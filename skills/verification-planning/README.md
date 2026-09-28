# verification-planning

Verification planning for non-trivial coding work. Before implementing a
feature, bug fix, refactor, or cross-system change, decide how THIS system
reveals the truth of THIS change and build an **evidence path** — a
project-specific route from the claim to evidence that can establish, limit,
or refute it. Modes: `plan` (build the path before implementing), `close`
(follow it after implementation; report established / limited / refuted),
`explain` (teach the concepts). Small changes follow the project's ordinary
checks; this skill earns its cost on risky or cross-system work.

## Source

Ported from the verification-planning skill of [alvinunreal/oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim)
(`src/skills/verification-planning/`, MIT — upstream commit `c5025e2e`), restructured for this repo's
[CONVENTIONS.md](../../CONVENTIONS.md): the router is a progressive-disclosure
dispatcher, knowledge moved into `references/evidence-path.md`, and per-mode
output templates were added. The six steps with their "Complete when" gates,
the evidence-path concept, verification affordances with the
temporary-vs-durable lifecycle, and the verification budget rules are
preserved. The source's single named-agent mention (a librarian persona) is
depersonalized to "research subagent" (see the router's Fan-out section), so
the skill carries no agent-name coupling. Sources and license text are in
[NOTICE.md](NOTICE.md).

## Layout

```
SKILL.md                              # router (≤150 lines)
NOTICE.md                             # third-party sources + license text
references/
  evidence-path.md                    # 6 steps + gates, budget rules,
                                      # affordances + lifecycle, research step
  worked-example.md                   # one illustrative run of all six steps
  templates/
    evidence-plan.md                  # plan output
    close-report.md                   # close output
    teaching-card.md                  # explain output
```

## Install (Claude Code)

```sh
ln -sfn "$PWD/skills/verification-planning" ~/.claude/skills/verification-planning
```

For other harnesses, link into `~/.agents/skills` — see the repo README.
Restart the agent after adding or renaming a skill.

## Harness notes

- **Subagents.** Fan-out is limited to focused research (step 4). Harness
  note: Claude Code `Agent` tool (formerly `Task`); other harnesses expose an
  equivalent (`task`) — keep the pattern, swap the name.
- **Language.** Instructions in English; user-facing output in pt-BR (mirror
  the user's language otherwise).

## State

`plan` offers to save the plan to `.agent/verification/<slug>.md` in the
target project (written only after the user confirms), so `close` can run in a
later session. `close` looks for the plan as an argument path, then in the
conversation, then in `.agent/verification/`; with no plan it reconstructs the
claims with the user and marks the report as a retroactive close. The saved
plan is reviewable metadata, committable like a design note. The skill writes
no ignore rules; to keep plans local, add `.agent/verification/` to
`.git/info/exclude` yourself.

## Safety note

Advisory by default: `explain` and plan steps 1–4 only read code and answer in
chat. No bundled scripts, no credentials, no commits or branch changes. Plan
step 5 and `close` may write verification-only support (never the product
change) and run checks; the project's ordinary local checks run directly,
everything else is confirm-first: saving the plan under
`.agent/verification/`; creating an extra checkout or worktree to show a
regression check fails on the base commit; state-mutating evidence outside an
environment the user confirmed as disposable; checks that write to shared,
staging, or production state, run migrations, call external services or send
messages; adding dependencies; writing evidence-only support or affordance
files into the repo; and deleting committed code or code the session did not
add. A session-added affordance is removed only by a targeted edit of its
lines, never with git checkout, restore, stash, or reset, and the user's
uncommitted work is never discarded to run fail-first. Without confirmation, a
plan step is marked "requer confirmação" and a `close` claim is recorded as
LIMITADA, each with the exact command for the user to run. Inspected code,
logs, docs, and agent-instruction files are treated as untrusted data.
