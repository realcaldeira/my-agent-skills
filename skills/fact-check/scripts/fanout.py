#!/usr/bin/env python3
"""Fan a fact-check claims file out to headless checker CLIs, batch by batch.

Reads claims.json (a JSON array of objects with at least `id` and `quote`),
splits it in order into batches, renders the checker contract for each batch,
and runs every batch through dispatch_checker.run_one in a small thread pool.

Writes into --out-dir:
    batch-NN/prompt.txt (+ run_one's artifacts)   one folder per batch
    verdicts.jsonl                                 every verdict, tagged _batch
    summary.json                                   counts, tokens, cost, gaps
    cost_report.md                                 human-readable cost table

Exit code: 0 when every batch returned a verdict array, 1 when only some did,
2 when none did (argparse errors also exit 2). Standard library only; 3.9+.
"""

from __future__ import annotations

import argparse
import collections
import datetime
import json
import re
import sys
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, List, Optional, Tuple

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from dispatch_checker import (  # noqa: E402
    DEFAULT_STALL,
    DEFAULT_TIMEOUT,
    PARSERS,
    harness_entry,
    load_default_model,
    make_scrubber,
    run_one,
)

SKILL_ROOT = HERE.parent
DEFAULT_TEMPLATE = SKILL_ROOT / "references" / "checker-contract.md"
# Everything above this line in the template is orchestrator commentary and is
# not sent to checkers. A template without the marker is sent whole.
PROMPT_MARKER = "<!-- checker-prompt:start -->"
PLACEHOLDER = re.compile(r"\{\{(TITLE|LANG|CLAIM_COUNT|CLAIMS)\}\}")
FENCE = re.compile(r"```[ \t]*(?:json)?[ \t]*\n(.*?)```", re.DOTALL | re.IGNORECASE)

VERDICTS = ("false", "imprecise", "misleading", "unsupported", "correct", "opinion-skipped")


# --------------------------------------------------------------------------
# Prompt rendering and answer parsing
# --------------------------------------------------------------------------

def prompt_body(template: str) -> str:
    """The part of the template that checkers receive."""
    idx = template.find(PROMPT_MARKER)
    if idx < 0:
        return template
    return template[idx + len(PROMPT_MARKER):].lstrip("\n")


def render_prompt(template: str, claims: List[dict], title: str, lang: str) -> str:
    """Fill the four placeholders in one pass, so claim text is never re-expanded."""
    values = {
        "TITLE": title,
        "LANG": lang,
        "CLAIM_COUNT": str(len(claims)),
        "CLAIMS": json.dumps(claims, indent=2, ensure_ascii=False),
    }
    return PLACEHOLDER.sub(lambda m: values[m.group(1)], prompt_body(template))


def extract_json_array(text: Optional[str]) -> Optional[list]:
    """Last parseable JSON array in the answer: fenced blocks first, then the whole text."""
    if not text:
        return None
    candidates = [m.group(1) for m in FENCE.finditer(text)] + [text]
    for candidate in reversed(candidates):
        start, end = candidate.find("["), candidate.rfind("]")
        if start < 0 or end <= start:
            continue
        try:
            parsed = json.loads(candidate[start:end + 1])
        except ValueError:
            continue
        if isinstance(parsed, list):
            return parsed
    return None


def reconcile(claim_ids: List[str], verdicts: Optional[list]) -> Dict[str, List[str]]:
    """Compare the ids a checker answered for with the ids it was given."""
    if verdicts is None:
        return {"missing_ids": list(claim_ids), "unexpected_ids": [], "duplicate_ids": []}
    answered = [str(v.get("id")) for v in verdicts
                if isinstance(v, dict) and v.get("id") is not None]
    counts = collections.Counter(answered)
    expected = set(claim_ids)
    unexpected: List[str] = []
    for vid in answered:
        if vid not in expected and vid not in unexpected:
            unexpected.append(vid)
    return {
        "missing_ids": [cid for cid in claim_ids if cid not in counts],
        "unexpected_ids": unexpected,
        "duplicate_ids": [cid for cid in claim_ids if counts.get(cid, 0) > 1],
    }


# --------------------------------------------------------------------------
# Running
# --------------------------------------------------------------------------

def _number(value) -> float:
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) else 0


def run_batch(batch: dict, args, model: Optional[str], variant: Optional[str]) -> dict:
    """Run one batch; never raises, so one broken batch cannot sink the others."""
    started = time.monotonic()
    try:
        res = run_one(
            harness=args.harness,
            prompt=batch["prompt"],
            out_dir=batch["dir"],
            cwd=args.cwd,
            model=model,
            variant=variant,
            timeout=args.timeout,
            stall=args.stall,
        )
    except Exception as exc:  # keep the pool alive; report the batch as failed
        res = {"status": "error", "error": f"{type(exc).__name__}: {exc}", "answer": "",
               "duration_s": round(time.monotonic() - started, 1)}
    verdicts = extract_json_array(res.get("answer"))
    result = {
        "batch": batch["name"],
        "claim_ids": batch["claim_ids"],
        "status": res.get("status", "error"),
        "tokens_in": res.get("tokens_in", 0),
        "tokens_out": res.get("tokens_out", 0),
        "cost_usd": res.get("cost_usd"),
        "cost_usd_est": res.get("cost_usd_est"),
        "duration_s": res.get("duration_s", round(time.monotonic() - started, 1)),
        "verdicts": verdicts,
        "error": res.get("error"),
    }
    result.update(reconcile(batch["claim_ids"], verdicts))
    return result


def _batch_ok(result: dict) -> bool:
    return result.get("status") == "ok" and result.get("verdicts") is not None


def write_run_outputs(out_dir: Path, results: List[dict], n_claims: int, wall_s: float,
                      harness: str, model: Optional[str]) -> dict:
    """Write verdicts.jsonl, summary.json and cost_report.md; return the summary."""
    ordered = sorted(results, key=lambda r: r["batch"])
    verdict_counts: collections.Counter = collections.Counter()
    with open(out_dir / "verdicts.jsonl", "w", encoding="utf-8") as fh:
        for res in ordered:
            expected = set(res.get("claim_ids") or [])
            for verdict in res.get("verdicts") or []:
                if not isinstance(verdict, dict):
                    continue
                row = dict(verdict)
                row["_batch"] = res["batch"]
                if str(row.get("id")) not in expected:
                    row["_unexpected"] = True
                verdict_counts[str(row.get("verdict") or "unknown")] += 1
                fh.write(json.dumps(row, ensure_ascii=False) + "\n")

    n_ok = sum(1 for r in ordered if _batch_ok(r))
    failures = []
    for r in ordered:
        if r.get("status") != "ok":
            failures.append({"batch": r["batch"], "status": r.get("status"),
                             "reason": r.get("error") or "run did not finish cleanly"})
        elif not r.get("verdicts"):
            reason = "no JSON array in the answer" if r.get("verdicts") is None else "empty verdict array"
            failures.append({"batch": r["batch"], "status": r.get("status"), "reason": reason})

    incomplete = [
        {"batch": r["batch"], "missing_ids": r.get("missing_ids", []),
         "unexpected_ids": r.get("unexpected_ids", []), "duplicate_ids": r.get("duplicate_ids", [])}
        for r in ordered
        if r.get("verdicts") is not None
        and (r.get("missing_ids") or r.get("unexpected_ids") or r.get("duplicate_ids"))
    ]
    unverified: List[str] = []
    for r in ordered:
        unverified.extend(r.get("missing_ids", []))

    summary = {
        "claims": n_claims,
        "batches": len(ordered),
        "batches_ok": n_ok,
        "batches_failed": len(ordered) - n_ok,
        "tokens_in": sum(_number(r.get("tokens_in")) for r in ordered),
        "tokens_out": sum(_number(r.get("tokens_out")) for r in ordered),
        "cost_usd": round(sum(_number(r.get("cost_usd")) for r in ordered), 4),
        "cost_usd_est": round(sum(_number(r.get("cost_usd_est")) for r in ordered), 4),
        "wall_s": round(wall_s, 1),
        "verdict_counts": dict(sorted(verdict_counts.items())),
        "batches_detail": [
            {
                "batch": r["batch"],
                "claims": len(r.get("claim_ids") or []),
                "status": r.get("status"),
                "tokens_in": r.get("tokens_in"),
                "tokens_out": r.get("tokens_out"),
                "cost_usd": r.get("cost_usd"),
                "cost_usd_est": r.get("cost_usd_est"),
                "duration_s": r.get("duration_s"),
            }
            for r in ordered
        ],
        "failures": failures,
        "unverified_ids": unverified,
        "incomplete": incomplete,
    }
    (out_dir / "summary.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (out_dir / "cost_report.md").write_text(
        build_cost_report(ordered, summary, harness, model), encoding="utf-8")
    return summary


def _cost_cell(result: dict) -> Tuple[float, str]:
    """(amount, source) for one row; a zero native cost counts as unreported."""
    native, estimate = _number(result.get("cost_usd")), _number(result.get("cost_usd_est"))
    if native > 0:
        return native, "native"
    if estimate > 0:
        return estimate, "estimated"
    return 0.0, "-"


def build_cost_report(results: List[dict], summary: dict, harness: str,
                      model: Optional[str]) -> str:
    counts = summary.get("verdict_counts") or {}
    counts_text = ", ".join(f"{k}={v}" for k, v in counts.items()) or "none"
    stamp = datetime.datetime.now().astimezone().isoformat(timespec="seconds")
    lines = [
        "# Fact-check fan-out: cost report",
        "",
        f"- Run: {stamp}",
        f"- Harness: {harness}; model: {model or '(harness default)'}",
        f"- Claims: {summary['claims']} in {summary['batches']} batches "
        f"({summary['batches_ok']} ok, {summary['batches_failed']} failed)",
        f"- Verdicts: {counts_text}",
        f"- Wall time: {summary['wall_s']} s",
        "",
        "| Batch | Claims | Status | Tokens in | Tokens out | Cost USD | Source | Duration |",
        "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    total_cost, sources = 0.0, set()
    for r in sorted(results, key=lambda x: x["batch"]):
        amount, source = _cost_cell(r)
        total_cost += amount
        if source != "-":
            sources.add(source)
        lines.append(
            f"| {r['batch']} | {len(r.get('claim_ids') or [])} | {r.get('status')} "
            f"| {_number(r.get('tokens_in'))} | {_number(r.get('tokens_out'))} "
            f"| {f'{amount:.4f}' if source != '-' else '-'} | {source} "
            f"| {_number(r.get('duration_s'))} s |")
    total_source = "mixed" if len(sources) > 1 else (sources.pop() if sources else "-")
    lines.append(
        f"| **TOTAL** | **{summary['claims']}** | **{summary['batches_ok']}/{summary['batches']} ok** "
        f"| **{summary['tokens_in']}** | **{summary['tokens_out']}** "
        f"| **{f'{total_cost:.4f}' if total_source != '-' else '-'}** | **{total_source}** "
        f"| **{summary['wall_s']} s** |")
    lines += [
        "",
        "Notes:",
        "",
        "- `native` is the cost the CLI reported itself. `estimated` is tokens times the "
        "roster's list prices: an upper bound that ignores cache discounts and flat-rate plans. "
        "A native cost of zero is treated as unreported.",
    ]
    cost_note = harness_entry(harness).get("cost_note")
    if cost_note:
        lines.append(f"- Roster note for {harness}: {cost_note}")
    lines.append("- Only checker spend is counted; the orchestrator's own tokens are not included.")
    if summary.get("unverified_ids"):
        lines.append("- Claims with no verdict (re-run them or verify by hand): "
                     + ", ".join(summary["unverified_ids"]))
    return "\n".join(lines) + "\n"


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def _inside_git_repo(path: Path) -> bool:
    for candidate in (path, *path.parents):
        if (candidate / ".git").exists():
            return True
    return False


def load_claims(path: str, ap: argparse.ArgumentParser) -> List[dict]:
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except OSError as exc:
        ap.error(f"cannot read --claims: {exc}")
    except ValueError as exc:
        ap.error(f"--claims is not valid JSON: {exc}")
    if not isinstance(data, list) or not data:
        ap.error("--claims must hold a non-empty JSON array of claim objects")
    seen = set()
    for index, claim in enumerate(data):
        if not isinstance(claim, dict) or "id" not in claim or "quote" not in claim:
            ap.error(f"claim at index {index} needs both 'id' and 'quote'")
        cid = claim["id"]
        if not isinstance(cid, str) or not cid.strip():
            ap.error(f"claim at index {index} has an empty or non-string 'id'")
        if cid in seen:
            ap.error(f"claim id {cid!r} at index {index} is a duplicate; ids must be unique")
        seen.add(cid)
    return data


def resolve_model(harness: str, model: Optional[str],
                  variant: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """CLI model wins; the roster variant applies only when the roster model does."""
    if model:
        return model, variant or None
    roster_model, roster_variant = load_default_model(harness)
    return roster_model, variant or roster_variant


def _build_arg_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(
        description="Verify fact-check claims in batches through headless agent CLIs.")
    ap.add_argument("--claims", required=True, help="path to claims.json")
    ap.add_argument("--work-dir", default=None,
                    help="run folder (default: a fresh temp dir named fact-check-*)")
    ap.add_argument("--out-dir", default=None, help="output folder (default: <work-dir>/out)")
    ap.add_argument("--template", default=str(DEFAULT_TEMPLATE),
                    help="checker contract to render per batch")
    ap.add_argument("--title", default="(untitled article)", help="document title")
    ap.add_argument("--lang", default="pt-BR", help="document language")
    ap.add_argument("--batch-size", type=int, default=6, help="claims per batch (default 6)")
    ap.add_argument("--parallel", type=int, default=3, help="batches run at once (default 3)")
    ap.add_argument("--harness", required=True, choices=sorted(PARSERS), help="which CLI to drive")
    ap.add_argument("--model", default=None, help="model id (default: roster model)")
    ap.add_argument("--variant", default=None,
                    help="reasoning effort (default: roster variant, only without --model)")
    ap.add_argument("--cwd", default=None,
                    help="shared checker working dir (default: an empty sandbox per batch)")
    ap.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT, help="seconds per batch")
    ap.add_argument("--stall", type=int, default=DEFAULT_STALL,
                    help="max stdout silence in seconds, 0 disables")
    ap.add_argument("--dry-run", action="store_true",
                    help="render prompts and print the plan without dispatching")
    return ap


def main(argv: Optional[List[str]] = None) -> int:
    ap = _build_arg_parser()
    args = ap.parse_args(argv)
    if args.batch_size < 1:
        ap.error("--batch-size must be at least 1")
    if args.parallel < 1:
        ap.error("--parallel must be at least 1")
    if args.timeout <= 0:
        ap.error("--timeout must be positive")
    if args.stall < 0:
        ap.error("--stall must be 0 (disabled) or positive")
    claims = load_claims(args.claims, ap)
    try:
        template = Path(args.template).read_text(encoding="utf-8")
    except OSError as exc:
        ap.error(f"cannot read --template: {exc}")
    if args.cwd:
        args.cwd = Path(args.cwd).resolve()
        if not args.cwd.is_dir():
            ap.error(f"--cwd {args.cwd} is not an existing directory")

    if args.work_dir:
        work_dir = Path(args.work_dir).resolve()
    else:
        work_dir = Path(tempfile.mkdtemp(prefix="fact-check-")).resolve()
    out_dir = Path(args.out_dir).resolve() if args.out_dir else work_dir / "out"
    for label, folder in (("--work-dir", work_dir), ("--out-dir", out_dir)):
        if _inside_git_repo(folder):
            ap.error(f"{label} {folder} is inside a git repository; use a temp folder")
    out_dir.mkdir(parents=True, exist_ok=True)
    print(f"work dir: {work_dir}")

    model, variant = resolve_model(args.harness, args.model, args.variant)
    scrub = make_scrubber()
    batches = []
    for number, start in enumerate(range(0, len(claims), args.batch_size), start=1):
        chunk = claims[start:start + args.batch_size]
        name = f"batch-{number:02d}"
        batch_dir = out_dir / name
        batch_dir.mkdir(parents=True, exist_ok=True)
        prompt = render_prompt(template, chunk, args.title, args.lang)
        (batch_dir / "prompt.txt").write_text(scrub(prompt), encoding="utf-8")
        batches.append({"name": name, "dir": batch_dir, "prompt": prompt,
                        "claim_ids": [c["id"] for c in chunk]})

    print(f"{len(claims)} claims -> {len(batches)} batches of up to {args.batch_size}")
    print(f"harness: {args.harness}; model: {model or '(harness default)'}; "
          f"variant: {variant or '(none)'}")

    if args.dry_run:
        for batch in batches:
            print(f"  {batch['name']}: {len(batch['claim_ids'])} claims -> {batch['dir'] / 'prompt.txt'}")
        return 0

    started = time.monotonic()
    results = []
    with ThreadPoolExecutor(max_workers=args.parallel) as pool:
        futures = [pool.submit(run_batch, b, args, model, variant) for b in batches]
        for future in as_completed(futures):
            res = future.result()
            results.append(res)
            tag = " (no json)" if res["verdicts"] is None else ""
            count = len(res["verdicts"] or [])
            print(f"  {res['batch']}: {res['status']}{tag} in {res['duration_s']} s, "
                  f"{count} verdicts", flush=True)

    summary = write_run_outputs(out_dir, results, len(claims),
                                time.monotonic() - started, args.harness, model)
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    print(f"verdicts: {out_dir / 'verdicts.jsonl'}")
    print(f"cost report: {out_dir / 'cost_report.md'}")
    if summary["batches_ok"] == summary["batches"]:
        return 0
    return 1 if summary["batches_ok"] else 2


if __name__ == "__main__":
    sys.exit(main())
