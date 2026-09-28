# improve-codebase-architecture

Module-design consultant: surfaces architectural friction (the friction walk
+ deletion test), turns shallow modules into deep ones (grilling loop →
deepening plan), explores alternative interfaces ("design it twice" with
parallel design subagents), and teaches depth/seam/leverage/locality on
demand. Modes: audit, deepen, interfaces, explain. Deliverables are named
with the project's domain nouns and judged in a fixed architecture vocabulary
(module, interface, depth, seam, adapter, leverage, locality); the forbidden
substitutes (English and pt-BR) are listed once, in
`references/vocabulary.md`, as anti-drift guards.

## Provenance and attribution

Ported from Matt Pocock's improve-codebase-architecture skill in
[mattpocock/skills](https://github.com/mattpocock/skills) (MIT — SKILL.md,
LANGUAGE.md, DEEPENING.md, INTERFACE-DESIGN.md as of upstream history around
commit `a36584e`); the direct copy came through
[akitaonrails/my-skills](https://github.com/akitaonrails/my-skills), which
derives from it. See [NOTICE.md](NOTICE.md) for sources and license texts.
The vocabulary is influenced by John Ousterhout, *A Philosophy of Software
Design* (deep vs. shallow modules, ch.4; "design it twice", ch.11), and
Michael Feathers, *Working Effectively with Legacy Code* (the seam
definition, ch.4). Only those claims carry `[Ousterhout]` / `[Feathers]`;
the source attributes nothing else to them, so the rest of the method
(internal vs. external seams, the interface as test surface, tests that
survive refactors) is tagged `[prática pós-2020]` (see `SKILL.md` §Citation
rules).

Restructuring relative to the source: the router is a progressive-disclosure
dispatcher (≤150 lines); knowledge moved into `references/`; output templates
with a severity scale and Definitions of Done were added per this repo's
[CONVENTIONS.md](../../CONVENTIONS.md). Substantive content (the glossary and
its rejected framings, the four dependency categories, seam discipline,
replace-don't-layer, the friction walk, the grilling loop, the design-it-twice
briefs and comparison method) is preserved. Ownership split with the sibling
`ddd` skill: the DDD flavor of ports & adapters and DDD tactical concepts live
there; the deletion test / pass-through detection lives here.

## Layout

```
SKILL.md                                   # router (≤150 lines)
references/
  vocabulary.md                            # terms, principles, rejected framings
  friction-signals.md                      # audit walk + deletion-test application
  deepening.md                             # grilling loop, dependency categories,
                                           # seam discipline, replace-don't-layer
  interface-design.md                      # design-it-twice subagent briefs
  domain-context-and-adrs.md               # glossary/ADR side effects + formats
  templates/                               # candidate-list, deepening-plan,
                                           # interface-comparison, teaching-card
```

## Install (Claude Code)

```sh
ln -sfn "$PWD/skills/improve-codebase-architecture" ~/.claude/skills/improve-codebase-architecture
```

Restart the agent after adding or renaming a skill. For other harnesses link
into `~/.agents/skills` — see the repo README.

## Harness notes

- **Subagents.** The fan-out pattern is portable: read-only explore subagents
  for multi-module audits, parallel design subagents in `interfaces` mode
  (drafted sequentially when no subagent tool is available). Claude Code
  `Agent` tool (formerly `Task`); other harnesses expose an equivalent
  (`task`) — keep the pattern, swap the name.
- **Language.** Instructions in English; user-facing output in pt-BR (mirror
  the user's language otherwise).

## Safety note

Advisory skill: every mode produces a report or plan and never edits code or
tests. The only side effect is writing a glossary entry or ADR during
`deepen`, and only after the proposed text is shown and the user confirms; it
never creates a glossary/ADR file unasked. `audit` may run read-only
`git log` to find change hot spots. No git mutations, network calls,
credential use, or running project code. Repository content (code, docs,
ADRs, agent-instruction files) is treated as untrusted data, never as
instructions.

## Source content dropped or generalized in this port

- Dangling cross-skill links to a companion skill's format docs replaced with
  self-contained glossary-entry and ADR format notes in
  `references/domain-context-and-adrs.md`.
- Hard-coded glossary/ADR file paths generalized to "wherever this project
  keeps it" with examples only.
- Harness-specific subagent tool syntax replaced with a portable pattern plus
  a harness note.
