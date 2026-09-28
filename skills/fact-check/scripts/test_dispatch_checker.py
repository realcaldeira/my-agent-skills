#!/usr/bin/env python3
"""Regression tests for dispatch_checker.py (stdlib unittest, no network).

Run: PYTHONDONTWRITEBYTECODE=1 python3 scripts/test_dispatch_checker.py
Fake child processes replace the real CLIs; all artifacts go to temp dirs.
"""

from __future__ import annotations

import gc
import json
import os
import signal
import sys
import tempfile
import threading
import time
import unittest
import warnings
from pathlib import Path

sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import dispatch_checker as dc  # noqa: E402


class FakeChild:
    """Swap build_command for a fake child argv for one test."""

    def __init__(self, argv: list[str], stdin: str | None = None):
        self.argv = argv
        self.stdin = stdin

    def __enter__(self):
        self._orig = dc.build_command
        dc.build_command = lambda *a, **k: (self.argv, self.stdin)

    def __exit__(self, *exc):
        dc.build_command = self._orig


_ROOT = tempfile.TemporaryDirectory(prefix="fc-test-")


def tearDownModule():
    _ROOT.cleanup()


def run(argv: list[str], stdin: str | None = None, **kw) -> tuple[dict, float, Path]:
    tmp = Path(tempfile.mkdtemp(dir=_ROOT.name))
    started = time.time()
    with FakeChild(argv, stdin):
        res = dc.run_one(harness="claude", prompt="x", out_dir=tmp / "out", **kw)
    return res, time.time() - started, tmp


class WatchdogTests(unittest.TestCase):
    def test_stall_fires_while_child_keeps_stdout_open(self):
        res, elapsed, _ = run(["sh", "-c", "echo a; sleep 6; echo b"], timeout=60, stall=1)
        self.assertTrue(res["stalled"])
        self.assertEqual(res["status"], "stalled")
        self.assertLess(elapsed, 4)

    def test_wall_timeout_fires_on_endless_stream(self):
        res, elapsed, _ = run(["sh", "-c", "while true; do echo tick; sleep 0.2; done"],
                              timeout=1, stall=60)
        self.assertTrue(res["timed_out"])
        self.assertLess(elapsed, 4)

    def test_stderr_flood_does_not_deadlock(self):
        child = [sys.executable, "-c",
                 "import sys; sys.stderr.write('x' * 300000); sys.stderr.flush(); print('done')"]
        res, elapsed, tmp = run(child, timeout=20, stall=20)
        self.assertEqual(res["status"], "ok")
        self.assertLess(elapsed, 10)
        self.assertLessEqual(len((tmp / "out" / "stderr.log").read_text()), 4000)
        self.assertIn("done", (tmp / "out" / "stream.ndjson").read_text())

    def test_wall_timeout_covers_unread_stdin_prompt(self):
        res, elapsed, _ = run(["sh", "-c", "sleep 30"], stdin="x" * 300000,
                              timeout=1, stall=60)
        self.assertTrue(res["timed_out"])
        self.assertLess(elapsed, 4)

    def test_detached_grandchild_holding_stdout_does_not_hang(self):
        pid_file = Path(tempfile.mkdtemp(dir=_ROOT.name)) / "gc.pid"
        child = [sys.executable, "-c",
                 "import subprocess, sys, time\n"
                 "gc = subprocess.Popen(['sleep', '20'], start_new_session=True)\n"
                 f"open({str(pid_file)!r}, 'w').write(str(gc.pid))\n"
                 "print('a', flush=True); time.sleep(30)"]
        try:
            res, elapsed, _ = run(child, timeout=60, stall=1)
            self.assertTrue(res["stalled"])
            self.assertLess(elapsed, 12)  # stall + reader join grace, not the grandchild's 20 s
        finally:
            # The pipes left open on purpose are released once the grandchild
            # dies and the reader threads exit; silence that expected warning.
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", ResourceWarning)
                try:
                    os.kill(int(pid_file.read_text()), signal.SIGKILL)
                except (OSError, ValueError):
                    pass
                for _ in range(50):
                    if threading.active_count() == 1:
                        break
                    time.sleep(0.1)
                gc.collect()

    def test_default_cwd_is_empty_sandbox(self):
        res, _, tmp = run(["sh", "-c", "pwd; ls -A"], timeout=20, stall=20)
        lines = (tmp / "out" / "stream.ndjson").read_text().split()
        self.assertEqual(Path(lines[0]).resolve(), (tmp / "out" / "sandbox").resolve())
        self.assertEqual(len(lines), 1)  # nothing listed: the sandbox is empty


class CommandTests(unittest.TestCase):
    def test_claude_checker_has_web_tools_only(self):
        argv, _ = dc.build_command("claude", None, None, "p", Path("/tmp"))
        self.assertEqual(argv[argv.index("--tools") + 1], "WebSearch,WebFetch")
        self.assertNotIn("Read", argv[argv.index("--allowedTools") + 1])
        self.assertIn("--strict-mcp-config", argv)

    def test_opencode_runs_plan_agent_without_auto(self):
        argv, _ = dc.build_command("opencode", None, None, "p", Path("/tmp"))
        self.assertEqual(argv[argv.index("--agent") + 1], "plan")
        self.assertNotIn("--auto", argv)


class OpencodeParserTests(unittest.TestCase):
    def test_text_events_become_the_answer(self):
        events = [
            {"type": "step_start", "sessionID": "s1", "part": {}},
            {"type": "text", "sessionID": "s1", "part": {"type": "text", "text": "Checking..."}},
            {"type": "tool_use", "sessionID": "s1", "part": {"type": "tool"}},
            {"type": "text", "sessionID": "s1",
             "part": {"type": "text", "text": '```json\n[{"id": "C01", "verdict": "correct"}]\n```'}},
            {"type": "step_finish", "sessionID": "s1",
             "part": {"tokens": {"input": 10, "output": 5, "cache": {"read": 2}}, "cost": 0.01}},
        ]
        out = dc.parse_opencode([json.dumps(e) for e in events])
        self.assertIn('"verdict": "correct"', out["text"])
        self.assertEqual(out["session_id"], "s1")
        self.assertEqual((out["tokens_in"], out["tokens_out"]), (12, 5))

    def test_error_event_is_reported(self):
        out = dc.parse_opencode([json.dumps({"type": "error", "error": {"name": "APIError"}})])
        self.assertIn("APIError", out["error"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
