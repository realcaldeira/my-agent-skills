# Verification

Step 3 (apply incrementally) and Step 4 (verify the result). Loaded only for
Apply mode — Review edits nothing and Teaches nothing about process, so they
do not read this file. The parity questions that gate *each individual change*
(questions 1–3 before it, question 4 after it) live in `principles.md` §1.

---

## Step 3: Apply changes incrementally

Make one simplification at a time. Batch refactors hide which change broke
something and make the diff unreviewable.

**Size gate — before the first edit.** If the scope yields more than ~10
candidates or the edits would touch more than ~500 lines, stop: list the
planned candidates one per line and ask the user before editing. Past ~500
lines, propose automation (codemod, AST transform, scripted replace) instead
of hand edits [Osmani]. Small scopes proceed without asking.

**High-risk candidates.** A candidate with `Risco da mudança: ALTO`
(`simplification-signals.md`, Severity and change risk) is report-only unless
the user confirms it in this conversation. A public-interface candidate
follows its own rule (`principles.md` §1). A candidate that would violate
Principle 1 is never applied.

**No test oracle.** When no tests cover the target (understand-first
question 4), question 4 cannot be answered. Then:

1. Apply only transforms whose parity is locally provable: local rename,
   deleting provably unreachable code, extracting a named intermediate
   without reordering evaluation.
2. For anything else, offer to write characterization tests first — tests
   that pin the current behavior, bugs included — and write them only with
   the user's OK [Feathers].
3. Otherwise leave those candidates unapplied and list them in the report
   marked `sem oráculo de teste`.

For each simplification:

1. **Make the change** — one candidate, one small, self-contained edit.
2. **Run relevant tests** — the tests covering the touched code first; the
   full suite before finishing (checklist below). On a PR from an author
   outside the user's team, confirm, and run only in an isolated environment
   (container/VM without the user's home, SSH agent or tokens); otherwise
   stay in `review` (router's engagement rules).
3. **Keep it only if behavior is preserved** — questions 1–3 were answered
   before the edit; now answer question 4 with the test run
   (`principles.md` §1). If it fails, revert *that* change (revert
   discipline below), note why in the report, and move on. A reverted
   attempt is a valid report entry.

Separate refactoring from feature work whenever possible. If the task mixes
both, land the behavior change first, simplify second, and never mix both in
one diff.

**Revert discipline.** Every change must be individually revertable. If a
simplification only works when bundled with three others, it is not a safe
simplification — decompose it or drop it. Revert means undoing only your own
edit, by applying the inverse edit with the file-edit tool. In-scope files
usually hold the user's uncommitted work, so never run `git checkout`,
`git restore`, `git reset`, `git stash`, or `git clean` on them. Do not
commit unless the user asks.

## Step 4: Verify the result

After simplifying, confirm:

- **The code is genuinely easier to understand** — apply the master test:
  "Would a new team member understand this faster than the original?" If the
  answer is "about the same", the change wasn't worth the diff.
- **The diff is clean and reviewable** — no unrelated hunks, no formatting
  churn mixed into logic changes.
- **Project conventions still match** — style, naming, error handling as the
  surrounding code does it (`principles.md`, principle 2).
- **No behavior, error handling, or side effects changed** — re-run the
  parity questions on the final state, not just per-change.

## Verification checklist

Run every item before declaring the task done. A failed item is not optional.

- [ ] Existing tests pass with **no change to assertions, expected values,
      fixtures, or snapshots**. Mechanical reference updates (renamed
      identifiers, call sites, imports, mock targets) are allowed and listed
      in the report; any other test edit means behavior changed — stop and
      revert your own edits (revert discipline above — never a git
      reset/restore of the files).
- [ ] With no covering tests, only locally provable transforms were applied
      (no-test-oracle branch above).
- [ ] Build / typecheck / lint still pass.
- [ ] No unrelated files were refactored — the diff touches only the scoped
      code (principle 5).
- [ ] No error handling was weakened or removed — error types, messages, and
      timing preserved; swallowed errors restored.
- [ ] The result is simpler to review than the original — compare the before/
      after diffs as a reviewer would.

## Failure patterns to catch before reporting

- "Simplification" that inlined a name carrying meaning (principle 4).
- A helper extracted from two similar-but-different copies — that is a
  behavior merge, not deduplication.
- Dead code removed that was actually a seam used by tests or by an external
  consumer you hadn't found (check exports and fixtures first).
- Flag arguments split, but one of the two new functions now diverges from
  the other's error behavior.

## Citations

- `[Osmani]` — incremental apply/verify loop, the verification checklist, and
  the "Rule of 500" (automate refactors that touch more than 500 lines). The
  ~10-candidate threshold and the revert discipline are this skill's own
  operating rules.
- `[Feathers]` — tests as the behavior oracle for legacy edits; unchanged
  assertions as the parity signal; characterization tests for untested code.
- The high-risk gate and the no-test-oracle branch are this skill's own
  operating rules.
- `[Fowler]` — one refactoring at a time; revertable, reviewable diffs.
