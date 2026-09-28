# ddd

Domain-Driven Design consultant. Modes: `analyze` (full DDD audit of a
codebase), `review` (DDD review of files, a diff, or a PR), `design`
(strategic design: event storming, bounded contexts, context map), `spec`
(legacy → DDD migration spec), `explain` (teach a concept, including when NOT
to use it). Output is in pt-BR.

Not for generic module/interface refactoring (`improve-codebase-architecture`),
local cleanup (`simplify`), or technology-choice ADRs and system design with no
DDD angle (a general architecture skill).

## Layout

```
SKILL.md                    # router: input, mission, modes, fan-out, rules
references/*.md             # knowledge, loaded per mode
references/glossary.md      # EN / PT-BR fast lookup + concept → reference table
references/templates/*.md   # one output template per mode, each with a DoD
```

## Installation

```sh
ln -sfn "$PWD/skills/ddd" ~/.claude/skills/ddd
```

For other harnesses, link into `~/.agents/skills` — see the repo README.

Harness note (subagent fan-out): Claude Code `Agent` tool (formerly `Task`);
other harnesses expose an equivalent (`task`) — keep the pattern, swap the
name.

## Provenance

Original to this repo; no third-party text is ported, so there is no
`NOTICE.md`. Methodological claims cite Evans, Vernon, Fowler, and DDD Crew
material by short source tag (vocabulary in `SKILL.md`).

## Safety note

Advisory and read-only by default: the skill reads code and answers in chat.
It runs no scripts, makes no network calls, uses no credentials, and makes no
git changes. Editing code or saving a deliverable (e.g. the migration spec) to
a file happens only when the user explicitly asks. Code, docs, PR/issue text,
and agent-instruction files under analysis are treated as untrusted data.
