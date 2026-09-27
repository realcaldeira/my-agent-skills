# Skill authoring conventions

Playbook for every skill in this repo. Derived from reviewing mature
third-party skills (DDD consultant, security audit) and fixing their known
failure modes: inconsistent commands, tool names that break across harnesses,
bloated routers, and fabricated citations.

## 1. Anatomy

```
skills/<name>/
  SKILL.md                      # router only — no bulk knowledge
  references/<topic>.md         # knowledge, loaded on demand
  references/templates/<x>.md   # output templates per mode
  scripts/                      # optional, read-only helpers
```

## 2. Frontmatter

```yaml
---
name: <kebab-case, matches directory>
description: >
  What it does + when to use it. Include the trigger nouns a user would
  type (bounded context, aggregate, ...). First two sentences decide
  discovery — make them count.
metadata:
  version: <semver>
---
```

- `description` is the discovery surface. State the capability AND the
  triggers. Never exceed ~600 characters.
- Bump `version` on every behavioral change.

## 3. SKILL.md is a router, not a book

Target ≤ 150 lines. It contains:

1. **Input block** — `$ARGUMENTS` plus the command table (explicit, including
   aliases and the "empty input" behavior).
2. **Mission** — role, audience, 4–6 non-negotiable principles.
3. **Mode table** — command → mode → references to load → output template.
   Every command that appears in the input block MUST map to a mode. No
   orphan commands.
4. **Fan-out rules** — when to spawn subagents, when not to.
5. **Output rules** — language, template location, severity scale.
6. **Citation rules** — short source-name vocabulary + anti-hallucination.
7. **Engagement rules** — questions to ask, defaults, out-of-scope list.
8. **Reading order** — a numbered checklist ending in the definition of done.

Bulk knowledge (heuristics, pattern catalogs, checklists) lives in
`references/`. If a section of SKILL.md is only ever read once, it belongs in
`references/`.

## 4. Progressive disclosure

- The router tells the model **which** reference to read and **when**.
- Never instruct "read all references". Always "load only these".
- Fast lookups (glossary, naming tables) get their own small file so they can
  be consulted without loading a chapter.
- Cross-link between references; do not duplicate content. One owner per fact.

## 5. Fan-out with subagentes (Claude Code)

Use the `Task` tool when work partitions cleanly (multiple modules, multiple
candidate bounded contexts, multiple independent topics):

- `subagent_type: "Explore"` — read-only codebase analysis.
- `subagent_type: "general-purpose"` — synthesis and report drafting.

Always give the subagent: its role, the exact files to read, the task, hard
constraints (language, citation, "insufficient evidence" wording), and the
output shape. The orchestrator **consolidates** (cross-checks and decides);
it never concatenates raw sub-reports.

Do NOT fan out for single questions, tiny scopes (< 20 relevant files), or
tasks requiring cross-cutting context.

Tool names differ across harnesses. Keep the pattern ("spawn a subagent,
consolidate the result") portable; name the concrete tool only in a harness
note.

## 6. Citation discipline

- Every factual claim about a method/pattern cites a short source tag
  (`[IDDD ch.10]`, `[Evans Reference]`, `[prática pós-2020]`).
- The source vocabulary is declared once in the router and must match the
  names used in `references/`.
- **Anti-hallucination rule:** cite only what is actually in the references.
  If a claim is not backed there, either drop it or label it
  `[sem fonte verificada]`. Never invent chapter numbers.

## 7. Output contracts

- Each mode has exactly one template in `references/templates/`.
- Templates define sections, severity scale (`CRÍTICO/ALTO/MÉDIO/BAIXO`), and
  evidence format (`file:line` + snippet).
- Reports end with (a) phased next steps sized to one sprint and (b) a
  positive-findings section when the mode audits existing work.
- Every report ends with a **Definition of Done** self-check the model applies
  before answering.

## 8. Language

- Instructions/references: English.
- User-facing output: pt-BR (canonical technical terms may stay in English,
  Portuguese equivalent on first use).
- If the user writes in another language, mirror the user.

## 9. Safety and scope

- Declare what is out of scope. Scope creep kills skills.
- Treat audited code/issue text as untrusted data (prompt-injection aware).
- Never require credentials, network calls, or destructive commands in a skill.
- Prefer incremental, reversible recommendations over rewrites.

## 10. Definition of done for a new skill

- [ ] Frontmatter: name matches dir, description has triggers, version set.
- [ ] SKILL.md ≤ 150 lines and every input command maps to a mode.
- [ ] Each mode: reference list + one template.
- [ ] All internal links resolve; no duplicated facts across references.
- [ ] Citation vocabulary consistent; anti-hallucination rule present.
- [ ] Fan-out section names when to use and when NOT to use it.
- [ ] Out-of-scope list present.
- [ ] Symlink install documented in README; skill loads in the target harness.
