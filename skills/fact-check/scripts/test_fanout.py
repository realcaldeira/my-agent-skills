#!/usr/bin/env python3
"""Tests for fanout.py (stdlib unittest, no network, no real CLIs).

Run: PYTHONDONTWRITEBYTECODE=1 python3 scripts/test_fanout.py
run_one is replaced by a fake; every artifact goes to a temp dir.
"""

from __future__ import annotations

import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import fanout  # noqa: E402


def claims(n: int) -> list:
    return [{"id": f"C{i:02d}", "quote": f"claim {i}", "category": "statistic",
             "hint": "h", "load_bearing": i == 1} for i in range(1, n + 1)]


def fence(payload) -> str:
    return "Some interim prose [not json].\n```json\n" + json.dumps(payload) + "\n```\n"


class ExtractJsonArrayTests(unittest.TestCase):
    def test_last_fenced_array_wins(self):
        text = fence([{"id": "C01"}]) + "\nthen\n" + fence([{"id": "C02"}])
        self.assertEqual(fanout.extract_json_array(text), [{"id": "C02"}])

    def test_plain_fence_is_accepted(self):
        text = "```\n[1, 2]\n```"
        self.assertEqual(fanout.extract_json_array(text), [1, 2])

    def test_falls_back_to_earlier_fence_when_last_is_broken(self):
        text = fence([{"id": "C01"}]) + "```json\n[{\"id\": oops}]\n```"
        self.assertEqual(fanout.extract_json_array(text), [{"id": "C01"}])

    def test_whole_text_is_the_last_resort(self):
        self.assertEqual(fanout.extract_json_array('Result: [{"id": "C01"}] done'),
                         [{"id": "C01"}])

    def test_objects_and_garbage_give_none(self):
        self.assertIsNone(fanout.extract_json_array('```json\n{"id": "C01"}\n```'))
        self.assertIsNone(fanout.extract_json_array("no array here"))
        self.assertIsNone(fanout.extract_json_array(""))
        self.assertIsNone(fanout.extract_json_array(None))


class RenderPromptTests(unittest.TestCase):
    TEMPLATE = ("Orchestrator notes {{TITLE}}\n" + fanout.PROMPT_MARKER + "\n"
                "Title: {{TITLE}} / {{LANG}} / {{CLAIM_COUNT}}\n{{CLAIMS}}\n")

    def test_commentary_is_stripped_and_placeholders_filled(self):
        batch = [{"id": "C01", "quote": "São Paulo tem {{TITLE}} habitantes"}]
        out = fanout.render_prompt(self.TEMPLATE, batch, "Meu artigo", "pt-BR")
        self.assertNotIn("Orchestrator notes", out)
        self.assertTrue(out.startswith("Title: Meu artigo / pt-BR / 1\n"))
        self.assertIn("São Paulo", out)  # non-ASCII preserved
        self.assertIn("{{TITLE}} habitantes", out)  # claim text is not re-expanded
        self.assertEqual(json.loads(out.split("\n", 1)[1]), batch)

    def test_template_without_marker_is_sent_whole(self):
        out = fanout.render_prompt("A {{LANG}}", [], "t", "en")
        self.assertEqual(out, "A en")

    def test_bundled_contract_has_marker_and_placeholders(self):
        text = fanout.DEFAULT_TEMPLATE.read_text(encoding="utf-8")
        body = fanout.prompt_body(text)
        self.assertIn(fanout.PROMPT_MARKER, text)
        for token in ("{{TITLE}}", "{{LANG}}", "{{CLAIM_COUNT}}", "{{CLAIMS}}"):
            self.assertIn(token, body)


class ReconcileTests(unittest.TestCase):
    def test_missing_extra_and_duplicate_ids(self):
        verdicts = [{"id": "C01"}, {"id": "C01"}, {"id": "C09"}, "junk", {"verdict": "x"}]
        got = fanout.reconcile(["C01", "C02", "C03"], verdicts)
        self.assertEqual(got["missing_ids"], ["C02", "C03"])
        self.assertEqual(got["unexpected_ids"], ["C09"])
        self.assertEqual(got["duplicate_ids"], ["C01"])

    def test_no_array_means_every_claim_is_missing(self):
        got = fanout.reconcile(["C01", "C02"], None)
        self.assertEqual(got["missing_ids"], ["C01", "C02"])

    def test_complete_answer_has_no_gaps(self):
        got = fanout.reconcile(["C01"], [{"id": "C01", "verdict": "correct"}])
        self.assertEqual(got, {"missing_ids": [], "unexpected_ids": [], "duplicate_ids": []})


class WriteOutputsTests(unittest.TestCase):
    def test_summary_jsonl_and_cost_report(self):
        results = [
            {"batch": "batch-02", "claim_ids": ["C03"], "status": "timeout", "tokens_in": None,
             "tokens_out": 0, "cost_usd": None, "cost_usd_est": None, "duration_s": 9.0,
             "verdicts": None, "error": "wall-clock timeout",
             **fanout.reconcile(["C03"], None)},
            {"batch": "batch-01", "claim_ids": ["C01", "C02"], "status": "ok", "tokens_in": 100,
             "tokens_out": 50, "cost_usd": 0.0, "cost_usd_est": 0.0123, "duration_s": 3.2,
             "verdicts": [{"id": "C01", "verdict": "false", "claim_quote": "ação"},
                          {"id": "C07"}, "skip-me"],
             "error": None,
             **fanout.reconcile(["C01", "C02"], [{"id": "C01"}, {"id": "C07"}])},
        ]
        with tempfile.TemporaryDirectory(prefix="fc-fanout-") as tmp:
            out = Path(tmp)
            summary = fanout.write_run_outputs(out, results, 3, 12.34, "codex", None)
            rows = [json.loads(line) for line in
                    (out / "verdicts.jsonl").read_text(encoding="utf-8").splitlines()]
            report = (out / "cost_report.md").read_text(encoding="utf-8")
            self.assertIn("ação", (out / "verdicts.jsonl").read_text(encoding="utf-8"))
            self.assertEqual(json.loads((out / "summary.json").read_text()), summary)

        self.assertEqual([r["_batch"] for r in rows], ["batch-01", "batch-01"])
        self.assertTrue(rows[1]["_unexpected"])
        self.assertNotIn("_unexpected", rows[0])
        self.assertEqual(summary["batches_ok"], 1)
        self.assertEqual(summary["batches_failed"], 1)
        self.assertEqual(summary["tokens_in"], 100)
        self.assertEqual(summary["cost_usd_est"], 0.0123)
        self.assertEqual(summary["wall_s"], 12.3)
        self.assertEqual(summary["verdict_counts"], {"false": 1, "unknown": 1})
        self.assertEqual(summary["unverified_ids"], ["C02", "C03"])
        self.assertEqual(summary["incomplete"], [{"batch": "batch-01", "missing_ids": ["C02"],
                                                  "unexpected_ids": ["C07"], "duplicate_ids": []}])
        self.assertEqual([f["batch"] for f in summary["failures"]], ["batch-02"])
        self.assertIn("| batch-01 | 2 | ok | 100 | 50 | 0.0123 | estimated | 3.2 s |", report)
        self.assertIn("| batch-02 | 1 | timeout | 0 | 0 | - | - | 9.0 s |", report)
        self.assertIn("**TOTAL**", report)
        self.assertIn("C02, C03", report)


class CliTests(unittest.TestCase):
    def setUp(self):
        self._tmp = tempfile.TemporaryDirectory(prefix="fc-fanout-cli-")
        self.tmp = Path(self._tmp.name)
        self._orig_run_one = fanout.run_one

    def tearDown(self):
        fanout.run_one = self._orig_run_one
        self._tmp.cleanup()

    def write_claims(self, payload) -> str:
        path = self.tmp / "claims.json"
        path.write_text(json.dumps(payload), encoding="utf-8")
        return str(path)

    def call(self, *extra) -> tuple:
        stdout, stderr = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            try:
                code = fanout.main(list(extra))
            except SystemExit as exc:
                code = exc.code
        return code, stdout.getvalue(), stderr.getvalue()

    def base(self, claims_path) -> list:
        return ["--claims", claims_path, "--harness", "claude",
                "--work-dir", str(self.tmp / "run")]

    def test_rejects_non_array_empty_and_malformed_claims(self):
        for payload, needle in (({"id": "C01"}, "non-empty JSON array"),
                                ([], "non-empty JSON array"),
                                ([{"id": "C01", "quote": "q"}, {"id": "C02"}], "index 1"),
                                ([{"id": "C01", "quote": "a"}, {"id": "C01", "quote": "b"}],
                                 "duplicate")):
            code, _, err = self.call(*self.base(self.write_claims(payload)), "--dry-run")
            self.assertEqual(code, 2, payload)
            self.assertIn(needle, err)

    def test_rejects_invalid_json_and_bad_numbers(self):
        bad = self.tmp / "bad.json"
        bad.write_text("[{", encoding="utf-8")
        self.assertEqual(self.call(*self.base(str(bad)), "--dry-run")[0], 2)
        good = self.write_claims(claims(1))
        self.assertEqual(self.call(*self.base(good), "--batch-size", "0", "--dry-run")[0], 2)
        self.assertEqual(self.call(*self.base(good), "--harness", "nope", "--dry-run")[0], 2)

    def test_refuses_work_dir_inside_git_repo(self):
        repo = self.tmp / "repo"
        (repo / ".git").mkdir(parents=True)
        code, _, err = self.call("--claims", self.write_claims(claims(1)), "--harness", "claude",
                                 "--work-dir", str(repo / "run"), "--dry-run")
        self.assertEqual(code, 2)
        self.assertIn("git repository", err)

    def test_dry_run_renders_batches_without_dispatching(self):
        fanout.run_one = lambda **kw: self.fail("dry run must not dispatch")
        code, out, _ = self.call(*self.base(self.write_claims(claims(7))),
                                 "--batch-size", "3", "--title", "Artigo", "--dry-run")
        self.assertEqual(code, 0)
        self.assertIn("7 claims -> 3 batches", out)
        prompt = (self.tmp / "run" / "out" / "batch-03" / "prompt.txt").read_text(encoding="utf-8")
        self.assertIn('"id": "C07"', prompt)
        self.assertIn('"load_bearing": false', prompt)  # extra fields pass through
        self.assertIn("Artigo", prompt)
        self.assertNotIn("{{", prompt)

    def test_exit_codes_follow_batch_outcomes(self):
        def fake_run_one(**kw):
            prompt = kw["prompt"]
            if '"claim 1"' in prompt:
                answer = fence([{"id": "C01", "verdict": "correct"},
                                {"id": "C02", "verdict": "false"}])
            elif '"claim 3"' in prompt:
                answer = "I could not finish."
            else:
                raise RuntimeError("boom")
            return {"status": "ok", "answer": answer, "tokens_in": 10, "tokens_out": 5,
                    "cost_usd": 0.01, "cost_usd_est": None, "duration_s": 0.1}

        fanout.run_one = fake_run_one
        code, out, _ = self.call(*self.base(self.write_claims(claims(5))), "--batch-size", "2")
        self.assertEqual(code, 1)  # batch-01 ok, batch-02 no json, batch-03 raised
        summary = json.loads((self.tmp / "run" / "out" / "summary.json").read_text())
        self.assertEqual(summary["batches_ok"], 1)
        self.assertEqual(summary["unverified_ids"], ["C03", "C04", "C05"])
        self.assertIn("(no json)", out)

        fanout.run_one = lambda **kw: {"status": "stalled", "answer": ""}
        code, _, _ = self.call(*self.base(self.write_claims(claims(2))), "--batch-size", "1")
        self.assertEqual(code, 2)

        fanout.run_one = lambda **kw: {"status": "ok", "answer": fence([{"id": "C01"}])}
        code, _, _ = self.call(*self.base(self.write_claims(claims(1))))
        self.assertEqual(code, 0)


class ModelResolutionTests(unittest.TestCase):
    def setUp(self):
        self._orig = fanout.load_default_model
        fanout.load_default_model = lambda harness: ("roster-model", "high")

    def tearDown(self):
        fanout.load_default_model = self._orig

    def test_roster_supplies_model_and_variant(self):
        self.assertEqual(fanout.resolve_model("codex", None, None), ("roster-model", "high"))

    def test_explicit_model_drops_roster_variant(self):
        self.assertEqual(fanout.resolve_model("codex", "m", None), ("m", None))
        self.assertEqual(fanout.resolve_model("codex", "m", "low"), ("m", "low"))

    def test_explicit_variant_overrides_roster(self):
        self.assertEqual(fanout.resolve_model("codex", None, "low"), ("roster-model", "low"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
