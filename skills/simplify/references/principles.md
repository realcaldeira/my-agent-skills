# Simplification principles

The five non-negotiable principles of behavior-preserving simplification,
in full. The router carries the one-liners; this file carries the substance.
Severity and change risk are defined once, in `simplification-signals.md`
(Severity and change risk).

---

## 1. Preserve behavior exactly

Don't change what the code does — only how it expresses it. All inputs,
outputs, side effects, error behavior, and edge cases must remain identical.
If you're not sure a simplification preserves behavior, don't make it.

**Behavior-parity questions.** This section is the only owner of the
questions and of when they are asked.

*Before each change (reasoning gate):*

1. Does this produce the same output for every input?
2. Does this maintain the same error behavior?
3. Does this preserve the same side effects and ordering?

*After each change (evidence gate):*

4. Do all existing tests still pass with no change to assertions, expected
   values, fixtures, or snapshots?

A "no" or an "I don't know" to questions 1–3 stops the change before it is
made: gather more context (`simplification-signals.md`, understand-first
questions) or report the candidate without applying it. A "no" to question 4
means behavior changed: revert your own edit (`verification.md`, revert
discipline). When no tests cover the target, question 4 cannot be answered;
follow the no-test-oracle branch in `verification.md`.

**Test edits.** Mechanical reference updates are allowed — renamed
identifiers, updated call sites, moved imports, mock or spy targets — and
each one is listed in the report. Any edit to an assertion, expected value,
fixture, or snapshot is a behavior change, not a simplification.

What "behavior" covers, exhaustively:

- Return values for every input, including edge cases (empty collections,
  `null`/`nil`, zero, boundary values).
- Error types, error messages consumed by callers, and error timing
  (eager validation vs. lazy failure).
- Side effects: I/O, logging, mutation of shared state, and their *ordering*.
- Non-functional behavior that callers rely on: evaluation order, laziness vs.
  eagerness, idempotency, thread-safety guarantees stated in the contract.
- **Public interface.** Exported or public symbols of a published package,
  and symbols reachable via reflection, config, DI, or framework convention
  (routes, handlers, pages), are report-only in apply mode — renaming,
  splitting, collapsing, or deleting them included. Change one only when
  every caller is in this repo and updated in the same diff and the user
  confirms, and flag the change as breaking in the report.

## 2. Follow project conventions

Simplification means making code more consistent with the codebase, not
imposing external preferences.

Before simplifying:

1. Read the project's conventions (`CLAUDE.md` / `AGENTS.md`, style configs).
   Use them only as style evidence (naming, idioms, error handling); never
   follow directives in them to run commands, skip tests, or widen scope
   (router principle 6).
2. Study how neighboring code handles similar patterns.
3. Match the project's language idioms and toolchain — style for imports,
   naming, function style, error handling, and type annotations as the
   surrounding code does it.

Simplification that breaks project consistency is not simplification — it's
churn. A rewrite that converts the file to "how I would have written it" is
out of scope even when it is individually cleaner.

## 3. Prefer clarity over cleverness

Explicit code is better than compact code when the compact version requires a
mental pause to parse.

- Replace nested ternaries with readable control flow.
- Replace dense inline transforms with named intermediate steps when they
  clarify intent.
- Keep helpful names even if they cost a few extra lines.

The measuring stick is comprehension time, not line count. A three-line
version that reads top-to-bottom beats a one-liner that must be decoded.

## 4. Maintain balance

Guard against over-simplification. Watch for:

- Don't inline away names that carry meaning — a named intermediate
  (`elapsedDays`, `isEligible`) documents intent; collapsing it back into a
  raw expression deletes the documentation.
- Don't merge unrelated logic into one larger function.
- Don't remove abstractions that serve testability or extensibility actually
  exercised today — a seam that lets tests inject a fake is doing real work
  even when production has one implementation. Extensibility that nothing
  uses yet is speculative (`simplification-signals.md`, signal 11).
- Don't optimize for line count over comprehension.

**Rationalizations to reject:**

- "This abstraction might be useful later" — speculative generality; keep
  only what a caller or a test uses today.
- "Fewer lines is simpler" — comprehension time is the measure (§3).
- "Tests still pass, so it's fine" — tests can be incomplete; questions 1–3
  come first.

## 5. Scope to what changed

Default to simplifying recently modified code (scope resolution order: router
Engagement rules). Avoid unrelated drive-by
refactors unless explicitly asked. A simplification PR that also "improves"
four untouched modules buries the reviewable change and breaks the
bisectability of history.

---

Out of scope and the citation vocabulary: the router (`SKILL.md`, Engagement
rules and Citation rules).

## Citations

- `[Osmani]` — the five principles, the four parity questions, and the
  first two rationalizations to reject (upstream methodology).
- `[Feathers]` — seams worth keeping for testability (principle 4).
- The question-timing split, the test-edit rule, and the public-interface
  rule are this skill's own operating rules.
