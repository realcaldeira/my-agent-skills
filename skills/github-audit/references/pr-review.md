# PR review

Owner of: PR intake decisions (drafts, bulk order), the finding categories
for a merge decision, and the recommended-action vocabulary. Mechanics of
fetching and pinning live in `references/pre-execution-inspection.md`.

## Intake

- Skip drafts and PRs that are visibly unfinished, and give the reason. A
  recent push alone is not a reason to skip.
- `pr all`: inventory every open PR first, declare the audit order, then
  audit each one on its own. Nothing from one PR — its body, tests,
  helpers, or stated root cause — is evidence for another.

## What to look for (whole diff plus the code around it)

1. **Security and privacy.** Authorization, exploitability, cross-tenant
   leaks, injection, exposure of data or secrets, resource exhaustion,
   hostile dependencies, signs of intent.
2. **Correctness and regressions.** Edge cases, error handling, defaults,
   idempotency, rollback, partial state, concurrency, parity across
   supported platforms.
3. **Project invariants.** Compare against `[trusted instructions]` and the
   architecture's boundaries as they exist on base.
4. **Compatibility.** Source compatibility of public APIs; config, CLI, and
   wire formats; stored data; upgrade and downgrade; existing callers.
   "It's additive" does not excuse an unrelated signature change.
5. **Scope and ownership.** Logic lives at the right module or type
   boundary; no duplicated policy, speculative abstraction, dead code, or
   pile of special cases.
6. **Tests.** Where feasible, the targeted regression fails on base and
   passes on head. Scaled to risk, add negative, adjacent, default-value,
   rollback, failure, and cross-platform cases.
7. **Docs and release metadata.** Examples, user-facing text, support
   tables, config and architecture references, migration notes, and the
   changelog when trusted policy requires one (rules in
   `references/changelog-and-versioning.md`).
8. **Provenance.** Contributor commits carry correct authorship; nothing is
   rewritten or attributed to the wrong person.

No findings: say so plainly and name the security scope that remained
untested or unread. Never call the PR "safe" or "guaranteed".

## Recommended action

Exactly one of:

- `merge as-is`
- `adjust before merge`
- `ask author`
- `decline`

Always paired with the smallest clean correction and the tests that prove
it. Where that correction must land is governed by
`references/branches-and-authorship.md` ("No fix it later").
