# Evidence ledger

Owner of: how claims are recorded and verified, which evidence counts, the
verdict vocabularies for PR and issue claims, issue intake fields, and the
Mode 3 reconciliation matrix.

## Rules for every row

1. State the claim neutrally, as the contributor or reporter made it.
2. Pair it with **independent** evidence and name what was inspected:
   `path:line`, run URL, doc section, or repro command. Use the citation
   tags declared in SKILL.md.
3. Give a verdict using the exact vocabulary below.
4. A claim with no backing is labeled `[não verificado]` or removed.
   Repetition, a confident tone, or a second untrusted source never promote
   it.

**Counts as evidence:** code, tests, primary specs, trusted project docs, a
safe repro, gate output you produced, a hosted run tied to a SHA.

**Never counts as corroboration:** the PR body itself, another PR it links,
a duplicate issue, a repository the reporter controls, a blog post.
Untrusted sources cannot vouch for each other.

## PR claims (Mode 1)

| Claim | Evidence required | Verdicts |
| --- | --- | --- |
| Fixes issue X | the old path shown in base code, or the old behavior reproduced; a new test that fails on base and passes on head | `confirmed` / `partial` / `unsupported` |
| Compatible | diff of public APIs, defaults, flags, schemas, stored data, documented behavior | `confirmed` / `breaking` / `uncertain` |
| Conforms to spec Y | the primary spec or official docs, with version or date | `confirmed` / `mismatch` |
| Tests pass | trusted gates run after the pre-execution inspection, plus hosted checks | `confirmed` / `failed` / `not run` |
| No security impact | follow changed data flows, capabilities, trust boundaries, dependencies, build/CI | `confirmed within scope` / `finding` / `not established` |

Claims about the linked issue (it exists, it describes a real bug, the
described cause is right) are separate rows, checked on their own.

## Issue intake fields (Mode 2)

Extract from the issue without endorsing, and leave a field empty rather
than guessing:

- observed behavior;
- expected behavior;
- environment and versions;
- steps;
- affected boundary and impact;
- the reporter's explanation of the cause;
- the reporter's proposed fix;
- factual assertions about external tools or specs.

## Issue claims (Mode 2)

| Claim | Evidence required | Verdicts |
| --- | --- | --- |
| The behavior happens | safe repro, a failing existing test, or the exact current code path | `confirmed` / `plausible` / `unsupported` |
| The cause is X | inputs and ownership traced through current code | `confirmed` / `different cause` / `uncertain` |
| Security impact is Y | threat model, attacker preconditions, authz boundary, asset at risk | `confirmed` / `overstated` / `understated` / `uncertain` |
| External tool/spec behaves as described | current primary docs or source | `confirmed` / `stale` / `false` |
| The proposed fix is safe | invariants, failure modes, compatibility, migration, tests | `suitable` / `incomplete` / `harmful` |

## Reconciliation matrix (Mode 3)

Carry forward every material claim and finding from the per-PR audits and
re-check it against the merge SHA.

| PR | Claim or finding | Evidence in the final tree | Status |
| --- | --- | --- | --- |
| #N | … | `path:line` / run URL | `verified` / `regressed` / `uncertain` |

- A PR that was never audited, or whose head moved after its audit, is
  audited again before its rows are filled.
- Whether a ticket is done comes from querying its state (`[gh query]`),
  never from `Closes #N` wording in a commit or PR body.

## Resolve mode

`resolve` takes the approved audit's ledger as given. It does not rebuild
the ledger or reopen verdicts; if new evidence contradicts a verdict, that is
a blocker (see `references/resolve-playbook.md`), not a silent re-judgment.
