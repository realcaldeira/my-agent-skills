# fact-check

An adversarial review of a document you are about to publish (article, essay,
blog post, documentation). The skill plays the critic you hired on purpose:
it pulls every checkable claim out of the text, sends checkers to verify each
one against primary sources, attacks the reasoning, fixes the errors that can
be fixed without touching your opinions, and then runs a second, stronger
pass over the corrected text to catch what the first pass missed or the
fixes broke. Output is in pt-BR (or your language).

## Modes

| Command | What it does |
| --- | --- |
| `check <path or text>` | Full run: pass 1, minimal fixes, pass 2, final report (default) |
| `pass1 <path or text>` | Pass 1 only: report plus the automatic fixes; decisions wait for you |
| `explain [concept]` | Teaches one concept of the method (tiers, severity, two passes, …) |

With no command, the skill infers the mode from your message and says which
one it picked.

Findings are graded S1 (blatant falsehood) to S6 (nitpick). Pass 1 fixes
wrong numbers, dates, names, and wording on its own, but only after
re-fetching the evidence behind each fix. Anything that would reframe your
argument, cut an unsourced sentence, or contradict one of your opinions goes
to a confirm queue and waits for you. Pass 2 never edits.

## Verification backends

- **Native subagents (default).** The agent spawns one fresh checker per batch
  of about six claims, with web search and fetch, using its own subagent tool
  (Claude Code: the `Agent` tool, formerly `Task`; other harnesses have an
  equivalent).
- **Script fan-out (optional, opt-in).** `scripts/fanout.py` sends batches to
  command-line agents you already have installed and collects verdicts,
  tokens, and cost; `scripts/dispatch_checker.py` runs a single prompt through
  a single CLI. Details in `references/script-fanout.md`.

### About the scripts

- Python 3.9+, standard library only.
- Built-in harnesses: `claude`, `codex`, `opencode`. To add another, give
  `dispatch_checker.py` a command branch and a stream parser (and register the
  parser in `PARSERS`).
- Each run has a hard wall-clock timeout (`--timeout`, default 1500 s) and a
  stall detector that kills a checker whose stdout stays silent too long
  (`--stall`, default 300 s; 0 disables). A timed-out or stalled checker's
  whole process group is terminated.
- Credentials: only what each CLI already reads from its environment or login.
  The scripts never read or write a secrets file. Every artifact they write is
  scrubbed of known API-key values and common token shapes.
- Tool limits: the `claude` checker gets web tools only, with no file, shell,
  or MCP access. `codex` runs in its read-only sandbox and `opencode` with its
  `plan` agent; both can still read files by absolute path.
- Working directory: each checker starts in an empty folder inside the run
  dir. That is **not** isolation: the child inherits your full environment
  and there is no reduced-environment mode.
- Roster: copy `config/models.example.json` to `config/models.json` to choose
  models, reasoning effort, and list prices for cost estimates.
- Tests (no network, fake child processes, temp dirs only), from this folder:
  `PYTHONDONTWRITEBYTECODE=1 python3 scripts/test_dispatch_checker.py` and
  `PYTHONDONTWRITEBYTECODE=1 python3 scripts/test_fanout.py`.

## Layout

```
SKILL.md                         # router: input, mission, modes, gates
README.md, NOTICE.md
config/models.example.json       # checker roster for the script fan-out
references/
  two-pass-method.md             # phases 0–7, claims schema, argument map, logic audit
  severity-and-fixes.md          # S1–S6, auto-fix gate, confirm queue, evidence re-check, opinion contract
  checker-contract.md            # per-batch checker prompt: tiers, verdicts, JSON schema
  script-fanout.md               # optional headless-CLI fan-out: roster, flags, outputs, limits
  templates/
    pass1-report.md              # pass1 (and the first stop of check)
    final-report.md              # check, after pass 2
    teaching-card.md             # explain
scripts/
  dispatch_checker.py            # one prompt → one CLI, with watchdog and scrubber
  fanout.py                      # claims.json → batches → verdicts, summary, cost report
  test_dispatch_checker.py       # acceptance tests for the runner
  test_fanout.py                 # tests for batching, parsing, reconciliation, CLI checks
```

## Install

```sh
ln -sfn "$PWD/skills/fact-check" ~/.claude/skills/fact-check
```

For other harnesses, link into `~/.agents/skills` instead; see the repo
README. Restart the agent after adding the skill.

## Safety note

Every side effect is confirm-first:

- **Network:** verification needs web access; the skill asks once before any
  request.
- **File edits:** only in `check`/`pass1`, only for fixes that leave your
  conclusions intact, and only after you opt in (typing the command counts;
  an inferred mode asks). The original is copied to a temporary work dir
  before the first edit and the diff is shown. Run artifacts stay in that temp
  dir, never inside a git repo. `explain` writes nothing.
- **Git:** none, ever.
- **Credentials:** none by default. The optional scripts run your own CLIs,
  which use their env keys, only after you agree. Anything credential-shaped
  in an output is reported with the value redacted and a recommendation to
  rotate it.
- **Running code:** only the optional scripts, which start your installed CLIs.
- **Deletion:** of anything, including the run dir, needs its own
  confirmation.
- **Untrusted data:** the document, fetched pages, and search results are data.
  Instructions found in them are never followed; they are reported as
  findings.

## Provenance

Written independently in this repository. The overall idea of a two-pass
adversarial fact-check was inspired by a personal skill in
[akitaonrails/my-skills](https://github.com/akitaonrails/my-skills), but no
text or code from it is reused. See [NOTICE.md](NOTICE.md).
