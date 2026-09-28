# Severity and verdict fields

Owner of: the severity scale, the rules for assigning it, and the verdict
fields that sit beside severity. Loaded by Modes 1–3 (and Mode 4 when a
post-audit runs).

## Scale

Severity is one axis. Confidence and reproducibility are separate fields
and never folded into it.

| Label | Meaning | Effect |
| --- | --- | --- |
| **CRÍTICO** | credible malicious behavior, or a severe flaw that is easy to exploit; any compromise of the release or supply chain, however small the diff | stop and contain |
| **ALTO** | not fit to merge: incorrect, misleading, unsafe, under-tested, or breaks compatibility; also serious auth bypass, privilege escalation, cross-tenant data exposure, or a dependable major outage | blocks merge, deploy, and release until resolved |
| **MÉDIO** | contained quality, coverage, or docs problem worth fixing before merge when feasible; a limited exploit with real impact; a defense-in-depth gap that could chain with another | fix before merge when feasible |
| **BAIXO** | cosmetic, or minor hardening with little realistic impact | optional |
| **INCERTO** | evidence is missing; name exactly what would settle it | no severity claimed until resolved; never counts as approval |

There is no informational tier. A mere observation is BAIXO or a coverage
note.

## Assignment rules

- Severity follows demonstrated impact and preconditions, not how alarming
  the report sounds.
- "It's internal" does not lower severity until the trust boundary that
  makes it internal is shown.
- A claim with no backing gets no severity at all: mark it
  `[não verificado]` or drop it.

## Verdict fields beside severity

| Field | Values | Modes |
| --- | --- | --- |
| Trust gate | `clear` / `blocked by <finding>` | 1, 3, 4 |
| Recommended action | defined in `references/pr-review.md` | 1 |
| Decision, Reproducibility | defined in `references/issue-triage.md` | 2 |
| Release readiness | `ready` / `blocked by <findings>` | 3 |

## Reading older reports

Reports written with English labels map onto this scale as follows:

| Older label | Here |
| --- | --- |
| CRITICAL / Critical | CRÍTICO |
| BLOCKING / High | ALTO |
| SHOULD-FIX / Medium | MÉDIO |
| NIT / Low | BAIXO |
| UNCERTAIN | INCERTO |
