#!/usr/bin/env python3
"""Send one checker prompt to one headless agent CLI and record what came back.

Part of the fact-check skill's optional script fan-out. Given a prompt and a
harness name (claude, codex, opencode), this module launches the user's own CLI
in a throwaway working directory, watches it with a wall-clock timeout and a
stdout stall detector, and writes these artifacts into --out-dir:

    prompt.txt     the prompt that was sent
    stream.ndjson  every raw stdout line, verbatim
    stderr.log     the last 4000 chars of stderr
    answer.md      the checker's final answer text
    result.json    status, exit code, timings, tokens, cost, session id, error

Every file passes through a secret scrubber first. Credentials are read from
the environment by the child CLI itself; this module never reads or writes a
secrets file. The child inherits the full environment and the working
directory is NOT an isolation boundary (see the skill README).

Standard library only; Python 3.9+.
"""

from __future__ import annotations

import argparse
import collections
import json
import os
import queue
import re
import shlex
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple

# --------------------------------------------------------------------------
# Tunables
# --------------------------------------------------------------------------

DEFAULT_TIMEOUT = 1500          # seconds of wall clock per run
DEFAULT_STALL = 300             # seconds of stdout silence before giving up
KILL_GRACE_S = 10               # SIGTERM -> this long -> SIGKILL
KILL_FINAL_WAIT_S = 5           # wait after SIGKILL
WATCHDOG_TICK_S = 0.2           # queue poll interval
READER_JOIN_S = 5               # shared budget for joining the pipe readers
STDERR_CHUNK = 4096             # stderr is drained in chunks of this size
STDERR_CHUNKS_KEPT = 2          # ...and only the newest few chunks are kept
STDERR_TAIL_CHARS = 4000        # what ends up in stderr.log
ERROR_MAX_CHARS = 500           # cap for error strings taken from streams
REDACTED = "<REDACTED>"

SKILL_ROOT = Path(__file__).resolve().parent.parent
CONFIG_DIR = SKILL_ROOT / "config"
ROSTER_FILES = ("models.json", "models.example.json")

# --------------------------------------------------------------------------
# Secret scrubbing
# --------------------------------------------------------------------------

SECRET_ENV_NAMES = (
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "OPENROUTER_API_KEY",
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "GROK_API_KEY",
    "XAI_API_KEY",
    "ZAI_API_KEY",
    "KIMI_API_KEY",
    "MOONSHOT_API_KEY",
    "QWEN36_API_KEY",
    "OLLAMA_API_KEY",
    "DEEPSEEK_API_KEY",
    "MISTRAL_API_KEY",
    "GROQ_API_KEY",
    "GITHUB_TOKEN",
    "GH_TOKEN",
)

SECRET_SHAPES = tuple(
    re.compile(pattern)
    for pattern in (
        r"sk-[A-Za-z0-9_-]{16,}",                                   # OpenAI/Anthropic style
        r"ghp_[A-Za-z0-9]{20,}",                                    # GitHub classic PAT
        r"github_pat_[A-Za-z0-9_]{20,}",                            # GitHub fine-grained PAT
        r"xox[baprs]-[A-Za-z0-9-]{10,}",                            # Slack
        r"AIza[0-9A-Za-z_-]{20,}",                                  # Google API key
        r"Bearer\s+[A-Za-z0-9._-]{20,}",                            # HTTP bearer token
        r"eyJ[A-Za-z0-9_-]{17,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}",  # JWT
    )
)


def _secret_env_values(env: Optional[Dict[str, str]] = None) -> List[str]:
    """Values of known credential variables that look like real secrets."""
    env = os.environ if env is None else env
    found = set()
    for name in SECRET_ENV_NAMES:
        value = env.get(name) or ""
        if len(value) >= 12 and any(ch.isdigit() for ch in value):
            found.add(value)
    # Longest first so a secret that contains another is removed whole.
    return sorted(found, key=len, reverse=True)


def make_scrubber() -> Callable[[str], str]:
    """Return scrub(text): env secret values and known token shapes -> <REDACTED>."""
    literal_values = _secret_env_values()

    def scrub(text: Optional[str]) -> str:
        if not text:
            return ""
        for value in literal_values:
            text = text.replace(value, REDACTED)
        for shape in SECRET_SHAPES:
            text = shape.sub(REDACTED, text)
        return text

    return scrub


# --------------------------------------------------------------------------
# Model roster
# --------------------------------------------------------------------------

def load_model_config() -> dict:
    """Roster from config/models.json, else config/models.example.json, else {}."""
    for filename in ROSTER_FILES:
        try:
            data = json.loads((CONFIG_DIR / filename).read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        if isinstance(data, dict):
            return data
    return {}


def harness_entry(harness: str) -> dict:
    """First roster entry whose name matches, or {}."""
    entries = load_model_config().get("harnesses")
    if not isinstance(entries, list):
        return {}
    for entry in entries:
        if isinstance(entry, dict) and entry.get("name") == harness:
            return entry
    return {}


def load_default_model(harness: str) -> Tuple[Optional[str], Optional[str]]:
    """(model, variant) configured for a harness; None where not set."""
    entry = harness_entry(harness)
    return (entry.get("model") or None, entry.get("variant") or None)


def _is_number(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool)


def _as_number(value) -> float:
    return value if _is_number(value) else 0


def estimate_cost_usd(harness: str, tokens_in, tokens_out) -> Optional[float]:
    """List-price estimate from the roster's rates_per_m; None without rates.

    An upper bound: cache discounts and flat-rate plans are ignored.
    """
    rates = harness_entry(harness).get("rates_per_m")
    if not isinstance(rates, dict):
        return None
    rate_in = _as_number(rates.get("input", 0))
    rate_out = _as_number(rates.get("output", 0))
    cost = _as_number(tokens_in) / 1e6 * rate_in + _as_number(tokens_out) / 1e6 * rate_out
    return round(cost, 4)


# --------------------------------------------------------------------------
# Command lines per harness (extension point: add a branch per new CLI)
# --------------------------------------------------------------------------

CLAUDE_WEB_TOOLS = "WebSearch,WebFetch"
CLAUDE_BLOCKED_TOOLS = "Bash,Write,Edit,NotebookEdit,Read,Glob,Grep"


def build_command(harness, model, variant, prompt, cwd) -> Tuple[List[str], Optional[str]]:
    """Return (argv, stdin_text). stdin_text None means the child gets no stdin.

    New harnesses need: a non-interactive run, the prompt as an argument or on
    stdin, JSON or line-streamed stdout, and web + read-only tools only.
    """
    if harness == "claude":
        # The tool-list flags are variadic, so the prompt goes right after -p
        # and every tool list is one comma-joined argument.
        argv = [
            "claude", "-p", prompt,
            "--output-format", "stream-json", "--verbose",
            "--tools", CLAUDE_WEB_TOOLS,            # the only tools that exist
            "--allowedTools", CLAUDE_WEB_TOOLS,     # pre-approved, no prompts
            "--disallowedTools", CLAUDE_BLOCKED_TOOLS,
            "--strict-mcp-config",                  # no --mcp-config: no MCP servers
        ]
        if model:
            argv += ["--model", model]
        return argv, None

    if harness == "codex":
        inner = [
            "codex", "exec", "--json", "--ephemeral", "--skip-git-repo-check",
            "-s", "read-only", "-C", str(cwd), "-c", "tools.web_search=true",
        ]
        if model:
            inner += ["-m", model]
        if variant:
            inner += ["-c", f"model_reasoning_effort={variant}"]
        inner.append("-")  # read the prompt from stdin
        # Many installs are shell/npm/version-manager shims: use a login shell.
        return ["bash", "-lc", shlex.join(inner)], prompt

    if harness == "opencode":
        # The plan agent asks before edit/bash and headless `run` refuses those
        # asks. Never add --auto: it would approve them.
        argv = ["opencode", "run", "--format", "json", "--agent", "plan", "--dir", str(cwd)]
        if model:
            argv += ["-m", model]
        if variant:
            argv += ["--variant", variant]
        argv.append(prompt)
        return argv, None

    raise ValueError(f"unknown harness: {harness!r}")


# --------------------------------------------------------------------------
# Stream parsers: list of stdout lines -> normalized dict
# --------------------------------------------------------------------------

def _blank_parse() -> dict:
    return {
        "text": "",
        "tokens_in": 0,
        "tokens_out": 0,
        "cost_usd": None,
        "session_id": None,
        "error": None,
    }


def _json_events(lines):
    """Yield dict events from stdout lines; blank and non-JSON lines are skipped."""
    for line in lines:
        line = (line or "").strip()
        if not line:
            continue
        try:
            event = json.loads(line)
        except ValueError:
            continue
        if isinstance(event, dict):
            yield event


def _clip(value) -> str:
    return str(value)[:ERROR_MAX_CHARS]


def _dict(value) -> dict:
    return value if isinstance(value, dict) else {}


def parse_claude(lines) -> dict:
    out = _blank_parse()
    assistant_chunks: List[str] = []
    final_text = ""
    for event in _json_events(lines):
        kind = event.get("type")
        if kind == "assistant":
            content = _dict(event.get("message")).get("content")
            for part in content if isinstance(content, list) else []:
                if isinstance(part, dict) and part.get("type") == "text":
                    text = part.get("text")
                    if isinstance(text, str):
                        assistant_chunks.append(text)
        elif kind == "result":
            result = event.get("result")
            final_text = result if isinstance(result, str) else (str(result) if result else "")
            usage = _dict(event.get("usage"))
            out["tokens_in"] = _as_number(usage.get("input_tokens"))
            out["tokens_out"] = _as_number(usage.get("output_tokens"))
            out["cost_usd"] = event.get("total_cost_usd")
            out["session_id"] = event.get("session_id")
            if event.get("is_error"):
                out["error"] = _clip(result)
    out["text"] = final_text or "\n".join(assistant_chunks)
    return out


def parse_codex(lines) -> dict:
    out = _blank_parse()
    for event in _json_events(lines):
        kind = event.get("type")
        if kind == "thread.started":
            out["session_id"] = event.get("thread_id")
        elif kind == "item.completed":
            item = _dict(event.get("item"))
            if item.get("type") == "agent_message":
                out["text"] = item.get("text") or ""
        elif kind == "turn.completed":
            usage = _dict(event.get("usage"))
            out["tokens_in"] = _as_number(usage.get("input_tokens")) + _as_number(
                usage.get("cached_input_tokens"))
            out["tokens_out"] = _as_number(usage.get("output_tokens"))
        elif kind == "turn.failed":
            out["error"] = _clip(event.get("error"))
        elif kind == "error" and out["error"] is None:
            out["error"] = _clip(event.get("message", event))
    return out


def parse_opencode(lines) -> dict:
    out = _blank_parse()
    texts: List[str] = []
    for event in _json_events(lines):
        kind = event.get("type")
        part = _dict(event.get("part"))
        if kind in ("text", "step_finish") and event.get("sessionID"):
            out["session_id"] = event["sessionID"]
        if kind == "text":
            text = part.get("text")
            if isinstance(text, str) and text:
                texts.append(text)
        elif kind == "error":
            out["error"] = _clip(event.get("error"))
        elif kind == "step_finish":
            tokens = _dict(part.get("tokens"))
            cache = _dict(tokens.get("cache"))
            out["tokens_in"] += _as_number(tokens.get("input")) + _as_number(cache.get("read"))
            out["tokens_out"] += _as_number(tokens.get("output"))
            cost = part.get("cost")
            if _is_number(cost):
                out["cost_usd"] = (out["cost_usd"] or 0) + cost
    # Interim prose may precede the verdict fence; keep every text part in order.
    out["text"] = "\n".join(texts)
    return out


def parse_generic(lines) -> dict:
    out = _blank_parse()
    kept = [line.rstrip("\n") for line in lines
            if line and line.strip() and not line.lstrip().startswith("{")]
    out["text"] = "\n".join(kept).strip()
    return out


PARSERS: Dict[str, Callable[[List[str]], dict]] = {
    "claude": parse_claude,
    "codex": parse_codex,
    "opencode": parse_opencode,
}

# Harnesses that print nothing until the end: stall detection would misfire.
NO_STREAM_HARNESSES: set = set()


# --------------------------------------------------------------------------
# Process supervision
# --------------------------------------------------------------------------

def _signal_group(pid: int, sig) -> None:
    try:
        os.killpg(pid, sig)
    except (ProcessLookupError, PermissionError, OSError):
        pass


def _kill_tree(proc: subprocess.Popen) -> None:
    """SIGTERM the child's process group, wait, then SIGKILL whatever is left."""
    _signal_group(proc.pid, signal.SIGTERM)
    try:
        proc.wait(timeout=KILL_GRACE_S)
    except subprocess.TimeoutExpired:
        pass
    _signal_group(proc.pid, signal.SIGKILL)
    try:
        proc.wait(timeout=KILL_FINAL_WAIT_S)
    except subprocess.TimeoutExpired:
        pass


def _write_text(path: Path, text: str) -> None:
    path.write_text(text, encoding="utf-8")


def _start_daemon(target) -> threading.Thread:
    thread = threading.Thread(target=target, daemon=True)
    thread.start()
    return thread


def run_one(*, harness, prompt, out_dir, cwd=None, model=None, variant=None,
            timeout=DEFAULT_TIMEOUT, stall=DEFAULT_STALL) -> dict:
    """Run one prompt through one harness; return result.json's fields + 'answer'."""
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    if cwd is None:
        cwd = out_dir / "sandbox"
        cwd.mkdir(parents=True, exist_ok=True)
    cwd = Path(cwd).resolve()
    model = model or None
    variant = variant or None

    scrub = make_scrubber()
    _write_text(out_dir / "prompt.txt", scrub(prompt))

    # Looked up through the module global on purpose: tests swap it out.
    argv, stdin_text = build_command(harness, model, variant, prompt, cwd)

    raw_lines: List[str] = []
    stderr_chunks: collections.deque = collections.deque(maxlen=STDERR_CHUNKS_KEPT)
    timed_out = stalled = False
    launch_error: Optional[str] = None
    exit_code: Optional[int] = None
    started = time.monotonic()

    try:
        proc = subprocess.Popen(
            argv,
            cwd=str(cwd),
            env=dict(os.environ),
            stdin=subprocess.PIPE if stdin_text is not None else subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            start_new_session=True,
        )
    except (OSError, ValueError) as exc:
        proc = None
        launch_error = f"could not start {argv[0] if argv else '(empty argv)'}: {exc}"

    if proc is not None:
        lines_q: queue.Queue = queue.Queue()
        eof_marker = object()

        def read_stdout():
            try:
                for line in proc.stdout:
                    lines_q.put(line)
            except (OSError, ValueError):
                pass
            finally:
                lines_q.put(eof_marker)

        def drain_stderr():
            try:
                while True:
                    chunk = proc.stderr.read(STDERR_CHUNK)
                    if not chunk:
                        break
                    stderr_chunks.append(chunk)
            except (OSError, ValueError):
                pass

        def feed_stdin():
            # A child that never reads stdin must not block anyone: this thread
            # simply dies with a broken pipe once the child is gone.
            try:
                proc.stdin.write(stdin_text)
                proc.stdin.close()
            except (OSError, ValueError):
                pass

        out_reader = _start_daemon(read_stdout)
        err_reader = _start_daemon(drain_stderr)
        stdin_writer = _start_daemon(feed_stdin) if stdin_text is not None else None

        stall_enabled = harness not in NO_STREAM_HARNESSES and bool(stall) and stall > 0
        last_output = time.monotonic()
        seen_eof = False
        while True:
            try:
                item = lines_q.get(timeout=WATCHDOG_TICK_S)
            except queue.Empty:
                pass
            else:
                if item is eof_marker:
                    seen_eof = True
                else:
                    raw_lines.append(item)
                    last_output = time.monotonic()
            now = time.monotonic()
            if seen_eof and proc.poll() is not None:
                break
            if now - started > timeout:
                timed_out = True
                _kill_tree(proc)
                break
            if stall_enabled and not seen_eof and now - last_output > stall:
                stalled = True
                _kill_tree(proc)
                break

        # A detached grandchild may still hold the pipes open; give the readers
        # one shared, bounded grace period instead of waiting for it.
        join_deadline = time.monotonic() + READER_JOIN_S
        for reader in (out_reader, err_reader):
            reader.join(max(0.0, join_deadline - time.monotonic()))
        while True:
            try:
                item = lines_q.get_nowait()
            except queue.Empty:
                break
            if item is not eof_marker:
                raw_lines.append(item)
        if proc.poll() is None:
            try:
                proc.wait(timeout=KILL_FINAL_WAIT_S)
            except subprocess.TimeoutExpired:
                pass
        # Closing a pipe while its reader is blocked on it would hang here.
        for pipe, worker in ((proc.stdout, out_reader), (proc.stderr, err_reader),
                             (proc.stdin, stdin_writer)):
            if pipe is not None and worker is not None and not worker.is_alive():
                try:
                    pipe.close()
                except (OSError, ValueError):
                    pass
        exit_code = proc.returncode

    duration_s = round(time.monotonic() - started, 1)
    stderr_tail = "".join(stderr_chunks)[-STDERR_TAIL_CHARS:]
    _write_text(out_dir / "stream.ndjson", scrub("".join(raw_lines)))
    _write_text(out_dir / "stderr.log", scrub(stderr_tail))

    parser = PARSERS.get(harness, parse_generic)
    try:
        parsed = parser(raw_lines)
    except Exception as exc:  # a parser bug must not lose the run artifacts
        parsed = _blank_parse()
        parsed["error"] = _clip(f"parser failed: {type(exc).__name__}: {exc}")
    answer = scrub(parsed.get("text") or "")

    if timed_out:
        status = "timeout"
    elif stalled:
        status = "stalled"
    elif launch_error or (exit_code is not None and exit_code != 0):
        status = "error"
    else:
        status = "ok"

    error = parsed.get("error") or launch_error
    if error is None and timed_out:
        error = f"wall-clock timeout after {timeout}s"
    elif error is None and stalled:
        error = f"no stdout for {stall}s"
    elif error is None and status == "error":
        error = f"exit code {exit_code}"

    cost_usd = parsed.get("cost_usd")
    cost_usd = cost_usd if _is_number(cost_usd) else None
    tokens_in = parsed.get("tokens_in") or 0
    tokens_out = parsed.get("tokens_out") or 0
    cost_usd_est = estimate_cost_usd(harness, tokens_in, tokens_out) if cost_usd is None else None
    if cost_usd is not None:
        cost_source = "native"
    elif cost_usd_est is not None:
        cost_source = "estimated"
    else:
        cost_source = None

    result = {
        "harness": harness,
        "model": model or "(harness default)",
        "status": status,
        "exit_code": exit_code,
        "timed_out": timed_out,
        "stalled": stalled,
        "duration_s": duration_s,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "cost_usd": cost_usd,
        "cost_usd_est": cost_usd_est,
        "cost_source": cost_source,
        "session_id": parsed.get("session_id"),
        "error": scrub(error) if error else None,
        "answer_chars": len(answer),
    }
    _write_text(out_dir / "answer.md", answer)
    _write_text(out_dir / "result.json", json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    return {**result, "answer": answer}


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def _build_arg_parser() -> argparse.ArgumentParser:
    ap = argparse.ArgumentParser(
        description="Run one fact-check prompt through one headless agent CLI.")
    ap.add_argument("--harness", required=True, choices=sorted(PARSERS),
                    help="which CLI to drive")
    ap.add_argument("--model", default=None, help="model id; omit for the CLI default")
    ap.add_argument("--variant", default=None, help="reasoning effort (harness-specific)")
    ap.add_argument("--prompt-file", default=None, help="prompt file; stdin when omitted")
    ap.add_argument("--cwd", default=None,
                    help="checker working dir (default: empty <out-dir>/sandbox)")
    ap.add_argument("--out-dir", required=True, help="where artifacts are written")
    ap.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT,
                    help=f"wall-clock limit in seconds (default {DEFAULT_TIMEOUT})")
    ap.add_argument("--stall", type=int, default=DEFAULT_STALL,
                    help=f"max stdout silence in seconds, 0 disables (default {DEFAULT_STALL})")
    return ap


def main(argv: Optional[List[str]] = None) -> int:
    ap = _build_arg_parser()
    args = ap.parse_args(argv)
    if args.timeout <= 0:
        ap.error("--timeout must be a positive number of seconds")
    if args.stall < 0:
        ap.error("--stall must be 0 (disabled) or positive")
    if args.prompt_file:
        try:
            prompt = Path(args.prompt_file).read_text(encoding="utf-8")
        except OSError as exc:
            ap.error(f"cannot read --prompt-file: {exc}")
    else:
        prompt = sys.stdin.read()
    if not prompt.strip():
        ap.error("the prompt is empty")

    result = run_one(
        harness=args.harness,
        prompt=prompt,
        out_dir=Path(args.out_dir),
        cwd=Path(args.cwd).resolve() if args.cwd else None,
        model=args.model or None,
        variant=args.variant or None,
        timeout=args.timeout,
        stall=args.stall,
    )
    answer = result.pop("answer")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print(f"answer: {len(answer)} chars in {Path(args.out_dir) / 'answer.md'}")
    return 0 if result["status"] == "ok" and answer.strip() else 1


if __name__ == "__main__":
    sys.exit(main())
