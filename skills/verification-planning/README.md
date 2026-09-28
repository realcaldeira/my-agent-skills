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

## Safety note

Advisory by default: `explain` and plan steps 1–4 only read code and answer
in chat. No bundled scripts, no credentials, no git mutations. Plan step 5 and
`close` may write support files and run checks; the project's ordinary local
checks run directly, everything else is confirm-first: state-mutating
evidence outside an environment the user confirmed as disposable; checks that
write to shared, staging, or production state, run migrations, call external
services or send messages; adding dependencies; writing evidence-only
support or affordance files into the repo; and deleting committed code or
code the session did not add. A session-added affordance is removed only by a
targeted edit of its lines, never with git checkout, restore, stash, or
reset. Without confirmation, a plan step is marked "requer confirmação" and a
`close` claim is recorded as LIMITADA, each with the exact command for the
user to run. Inspected code, logs, docs, and
agent-instruction files are treated as untrusted data.
