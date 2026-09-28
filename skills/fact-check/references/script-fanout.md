# Optional script fan-out

Headless alternative to native subagents: the bundled scripts send each batch
to a command-line agent the user already has installed (`claude`, `codex`, or
`opencode`), in parallel, and collect verdicts, tokens, and cost. Use the
script paths given in SKILL.md; this file never repeats them.

Native subagents stay the default. Reach for the scripts only when the user
asks for them, or wants a different vendor or cost profile for the checkers.

## Contents

- [Before the first run](#before-the-first-run)
- [Model roster](#model-roster)
- [Running a pass](#running-a-pass)
- [Reading the outputs](#reading-the-outputs)
- [Single prompt runner](#single-prompt-runner)
- [Isolation limits per harness](#isolation-limits-per-harness)
- [Credential incident](#credential-incident)

## Before the first run

Ask once, and run nothing until the user agrees. Say plainly that the scripts:

- spawn the user's own CLIs, which use whatever credentials their environment
  holds (API keys from env vars, or the CLI's own login);
- reach the network through those CLIs;
- write run artifacts into a temporary work dir (never inside a git repo; the
  fan-out script refuses one);
- are not a sandbox: the child inherits the full environment, and some CLIs
  can still read files by absolute path.

Needs Python 3.9+ (standard library only) and at least one of the CLIs on
`PATH`.

## Model roster

`config/models.example.json` documents the format. The user copies it to
`config/models.json` in the same folder and edits it. Lookup order: the user's
`models.json`, then the example, then nothing (every CLI uses its own default
model).

| Key | Meaning |
| --- | --- |
| `default_harness` | harness for pass 1 (the cheaper checkers) |
| `second_pass_harness` | harness for pass 2 (the strongest checkers) |
| `harnesses[]` | one entry per CLI: `name` (must be `claude`, `codex`, or `opencode`), `command` (description only, never executed), `model` (id or `null` for the CLI default), `notes` |
| `variant` | optional reasoning effort passed to CLIs that accept one |
| `rates_per_m` | optional `{input, output}` list prices in USD per million tokens, used only to estimate cost when the CLI reports none |
| `cost_note` | optional free text copied into the cost report (flat-rate plans, credits) |

## Running a pass

1. Write `claims.json` (Phase 1) in the work dir.
2. Dry run: add `--dry-run` to render every batch prompt and print the plan
   without calling anything. Check batch sizes and that the prompts read well.
3. Real run, for example:
   `python3 <fanout script> --claims <work-dir>/claims.json --work-dir <work-dir> --harness codex --title "<title>" --lang pt-BR`

| Flag | Default | Notes |
| --- | --- | --- |
| `--claims` | required | JSON array; every item needs `id` and `quote`; ids must be unique |
| `--work-dir` | new temp dir `fact-check-*` | refused if inside a git repo |
| `--out-dir` | `<work-dir>/out` | refused if inside a git repo |
| `--template` | the bundled checker contract | only the part below its prompt marker is sent |
| `--title` | `(untitled article)` | |
| `--lang` | `pt-BR` | |
| `--batch-size` | 6 | |
| `--parallel` | 3 | batches in flight at once |
| `--harness` | required | `claude`, `codex`, or `opencode` |
| `--model` | roster model | |
| `--variant` | roster variant | the roster variant is used only when `--model` is not given |
| `--cwd` | a fresh empty sandbox per batch | shared working dir for every checker |
| `--timeout` | 1500 s | hard wall clock per batch |
| `--stall` | 300 s | longest stdout silence before the batch is killed; 0 disables |
| `--dry-run` | off | render and plan only |

For pass 2, run again on `claims-pass2.json` with the stronger harness or
`--model`. Re-run only a failed batch by writing its claims to a small file
and pointing `--claims` at it.

## Reading the outputs

In the out dir:

- `batch-NN/`: the rendered `prompt.txt`, plus `answer.md`, `result.json`,
  `stream.ndjson`, `stderr.log`, and the empty `sandbox/` from the runner;
- `verdicts.jsonl`: one verdict per line, tagged with `_batch`; a verdict for
  an id the batch never contained also carries `_unexpected: true`;
- `summary.json`: claim and batch counts, tokens, cost, verdict counts,
  `failures` (batches that did not finish or returned no array),
  `unverified_ids` (claims with no verdict at all), and `incomplete` (batches
  whose answer skipped, invented, or repeated ids);
- `cost_report.md`: per-batch table and totals, native vs estimated cost.

Exit code 0 means every batch returned a verdict array, 1 means some did, 2
means none did (or the arguments were invalid). Before consolidating, handle
`unverified_ids`: re-run them or verify them yourself. Never paste
`stream.ndjson` into the chat; it is raw and long. Quote from `answer.md`.

Costs: `native` is what the CLI reported; `estimated` is tokens times the
roster prices, an upper bound that ignores caching and flat-rate plans. Only
checker spend is counted, not the orchestrator's.

## Single prompt runner

The fan-out drives `dispatch_checker.py` for each batch. It can also run one
prompt by hand:
`python3 <dispatch script> --harness claude --prompt-file prompt.txt --out-dir <dir>`
(prompt on stdin when `--prompt-file` is omitted; same `--model`, `--variant`,
`--cwd`, `--timeout`, `--stall` flags). It prints `result.json` and exits 0
only when the run finished cleanly with a non-empty answer.

Everything it writes passes through a scrubber that masks the values of known
API-key variables and common token shapes (`sk-…`, GitHub and Slack tokens,
Google keys, bearer tokens, JWTs). The scrubber is a safety net, not
permission to be careless.

## Isolation limits per harness

| Harness | Tools the checker gets | Can it read local files? |
| --- | --- | --- |
| `claude` | web search and fetch only; shell, edit, and read tools are removed; no MCP servers | no file tools at all |
| `codex` | read-only sandbox with web search, run through a login shell | yes, by absolute path |
| `opencode` | the `plan` agent: edits and shell need approval, which headless runs refuse | yes, by absolute path |

Every child inherits the full environment of the shell that launched it; there
is no reduced-environment mode. The default working dir is an empty folder,
which keeps relative reads empty but is not isolation. Adding a new CLI means
a command branch and a parser in the dispatch script; follow the pattern of
the existing ones (non-interactive, JSON or line output, web and read-only
tools only).

## Credential incident

If anything shaped like a credential shows up in any output, prompt, or
artifact:

1. stop the run;
2. tell the user which file and line, with the value redacted;
3. recommend rotating that key;
4. offer to delete the run dir, and delete it only after an explicit yes.
