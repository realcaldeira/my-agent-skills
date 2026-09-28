# codemap

Hierarchical repository cartography for UNFAMILIAR codebases: one
`codemap.md` per folder (responsibility, design patterns, data & control
flow, integration points) plus a root atlas that aggregates every folder's
responsibility with links to the detailed maps. Change detection is
hash-based (`.agent/codemap.json`), so refreshes only touch folders whose
files changed, and the map is registered idempotently in the project's
agent-instruction file (`CLAUDE.md` first, `AGENTS.md` when that is what the
harness loads) so agents discover it automatically. Modes: `init`, `update`,
`explain`. This is an expensive operation (one subagent per folder) and runs
only on explicit request.

## Provenance and attribution

Ported from the codemap skill of [alvinunreal/oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim)
(`src/skills/codemap/`, MIT — SKILL.md and scripts/codemap.mjs match upstream
commits `3b349f13` / `0f37e2fc`). Sources and license text:
[NOTICE.md](NOTICE.md). Restructuring relative to the source: the
router is a progressive-disclosure dispatcher (≤150 lines) and the knowledge
moved into `references/` (content spec, state manifest and change semantics,
root atlas + registration) with output templates and Definitions of Done per
this repo's [CONVENTIONS.md](../../CONVENTIONS.md). Substantive content — the
workflow, include/exclude design rules with mandatory exclusions, the
four-section content spec with its full example, the manifest semantics, and
hash-based change detection — is preserved.

Depersonalizations in this port: state dir standardized to `.agent/`;
hardcoded skill paths → `${CLAUDE_SKILL_DIR}/scripts/codemap.mjs`;
product-specific agent names (Fixer/Orchestrator) → per-folder subagents /
orchestrator; product-specific claims about auto-loading → an explicit
instruction-file resolution order; source-code examples → generic examples.
The legacy state-file migration detail was dropped from the docs (the script
keeps its one-shot rename for old states). The tests were ported from bun to
`node:test`.

## Layout

```
SKILL.md                          # router (≤150 lines)
references/
  content-spec.md                 # folder map sections + include/exclude rules
  state-and-changes.md            # .agent/codemap.json manifest, file selection, init/changes/update
  root-atlas.md                   # root codemap.md + CLAUDE.md/AGENTS.md registration
  templates/                      # codemap-folder, codemap-root, teaching-card
scripts/
  codemap.mjs                     # state + change detection (Node ≥ 18)
  codemap.test.mjs                # node:test suite for the script
```

## Usage

From the agent: `codemap init ./`, `codemap update ./`, or
`codemap explain <concept>` — or just ask ("mapeia esse repo"). The workflow
(state check, pattern design, script calls, fan-out, atlas, registration) is
owned by [SKILL.md](SKILL.md); the script's commands and flags by
[references/state-and-changes.md](references/state-and-changes.md).

## Install (Claude Code)

```sh
ln -sfn "$PWD/skills/codemap" ~/.claude/skills/codemap
```

Restart the agent after adding or renaming a skill. For other harnesses, link
into `~/.agents/skills` — see the repo [README](../../README.md).

## Harness notes

- **Node ≥ 18** runs `scripts/codemap.mjs`. Tests:
  `node --test skills/codemap/scripts/codemap.test.mjs` (pass the file, not
  the directory — Node ≥ 22 treats the argument as a glob).
- **Subagents.** The fan-out pattern is portable: one subagent per folder,
  orchestrator consolidates.
  Harness note: Claude Code `Agent` tool (formerly `Task`); other harnesses
  expose an equivalent (`task`) — keep the pattern, swap the name.
- **Script path.** SKILL.md names the script as
  `${CLAUDE_SKILL_DIR}/scripts/codemap.mjs`; other harnesses resolve
  `scripts/` against the directory containing SKILL.md. The script works when
  invoked through a symlinked install.
- **Agent-instruction file.** Registration targets `CLAUDE.md` (or
  `.claude/CLAUDE.md`) when present — Claude Code ignores `AGENTS.md` when a
  `CLAUDE.md` exists and does not import it — otherwise `AGENTS.md`; if
  neither exists the agent asks before creating one.
- **Language.** Instructions/references in English; user-facing output in
  pt-BR (mirror the user's language otherwise).

## Safety note

Side effects, all on an explicit `init` / `update` request only:

- **File writes in the mapped repo:** `.agent/codemap.json` and `codemap.md`
  files (scaffolds never overwrite existing maps); an appended
  `## Repository Map` section in the resolved instruction file.
- **Confirm-first:** creating an instruction file that does not exist, and
  deleting the orphan `codemap.md` of a folder that no longer has mapped files
  (its own confirmation). A second `init` refuses to reset existing state;
  `init --rescope` changes the scope while keeping the baseline.
- **Subprocess:** inside a git work tree the script runs
  `git ls-files` (read-only, `core.fsmonitor` disabled) to list files. No
  other git command, no network, no credentials.
- **Running code:** none — the script hashes files; it never executes code
  from the mapped repo.
- **Untrusted content:** repository files (including `CLAUDE.md`,
  `AGENTS.md`, `.claude/`, `.cursor/rules`) are treated as data; maps never
  copy agent-directed text, commands, or URLs from them, and injection
  attempts are reported.
