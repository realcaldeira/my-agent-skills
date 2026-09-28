# Merged-batch review (Mode 3)

Owner of: freezing provenance, choosing the immutable range, per-merge
checks, the seven classes of cross-change interaction, commonly missed
problems, and platform traps. The security sweep of the merged tree lives in
`references/pre-execution-inspection.md` §9; release and changelog rules in
`references/changelog-and-versioning.md`.

## 1. Freeze provenance

Capture, before anything else (and pin SHAs as in the pre-execution
inspection):

```sh
git status --short --branch
git rev-parse HEAD
git describe --tags --abbrev=0
```

Unrelated local changes stay untouched and are kept out of any build or
deploy context.

## 2. Choose the range (always immutable)

| Situation | Range |
| --- | --- |
| Release audit | last public tag → `HEAD` |
| Incremental audit | last recorded post-audit SHA → `HEAD` |
| User-named batch | the given base → `HEAD` |

Record `BASE_SHA`, `HEAD_SHA`, and `RANGE`, then list what the range holds
with `git log --first-parent --oneline <BASE_SHA>..<HEAD_SHA>` (merges and
direct commits). If `HEAD` advances during the
audit, review the new commits and redo the phases they affect.

## 3. Per merge and per direct commit

For every first-parent merge and every direct commit in the range:

- the merge contains exactly the head that was audited, plus any declared
  maintainer adjustments;
- authorship is intact and nothing was rewritten without explanation;
- linked issues are in the right open/closed state (`[gh query]`) and their
  closing comments are accurate;
- nothing bypassed a per-change audit (unaudited or re-pushed PRs are
  audited now, per `references/evidence-ledger.md`);
- no newly opened PR or issue slipped into the batch unannounced.

## 4. Seven interaction classes

Read the merged code around each change, not only its hunks: the final tree
can behave in ways no single PR did.

1. **Invariant bridges.** A field or path one change added is written or
   authorized by another change, around the canonical boundary.
2. **Helper and policy drift.** Copies of normalization, validation,
   identity, permission, retry, or error handling no longer agree.
3. **Default and config composition.** Defaults that were fine alone now
   combine into different behavior, ambiguity, or an insecure setting being
   switched on.
4. **Ordering and lifecycle.** Init and teardown, retries, leases,
   transactions, cleanup, background jobs, rollback, and recovery still
   interact safely.
5. **Shared resources.** Pools, queues, caches, ports, files, locks, rate
   limits, and process-wide state stay bounded and consistent.
6. **Schema, API, and data composition.** Migrations, persisted data, wire
   formats, CLI flags, public functions, and old callers remain compatible.
7. **Test masking.** A mock, helper, or config introduced by one change
   makes another change's test pass without exercising real code.

## 5. Commonly missed

- An "additive" feature that broke a public API.
- Fallback logic that hides unrelated errors or repeats side effects.
- Contributor tests that depend on the real home directory, clock,
  platform, network services, or other mutable outside state.
- One entry point or platform fixed while its sibling was not.
- Release notes updated while examples, migration notes, config or
  architecture docs, or README support tables still describe the old
  behavior.

## 6. Platform traps

These pass a fast single-OS merge gate and fail elsewhere; send them to the
release candidate's full platform matrix instead of trusting the merge gate:

- path identity that assumes one spelling (symlinked temp or home dirs,
  Windows drive letters vs. POSIX paths, trailing separators);
- OS-specific file locking, exit codes, and stderr wording;
- line endings;
- case sensitivity of the filesystem.
