# Simplification principles

The five non-negotiable principles of behavior-preserving simplification,
in full. The router carries the one-liners; this file carries the substance.
Severity context for findings: a violation of Principle 1 is `CRÍTICO`
(behavior risk if changed carelessly); Principles 2–5 map to `ALTO`/`MÉDIO`/
`BAIXO` depending on how much comprehension is at stake.

---

## 1. Preserve behavior exactly

Don't change what the code does — only how it expresses it. All inputs,
outputs, side effects, error behavior, and edge cases must remain identical.
If you're not sure a simplification preserves behavior, don't make it.

**Behavior-parity questions — ask all four before every change:**

1. Does this produce the same output for every input?
2. Does this maintain the same error behavior?
3. Does this preserve the same side effects and ordering?
4. Do all existing tests still pass without modification?

A "no" or an "I don't know" to any of the four stops the change. Either gather
more context (`simplification-signals.md`, understand-first questions) or
report the candidate without applying it.

What "behavior" covers, exhaustively:

- Return values for every input, including edge cases (empty collections,
  `null`/`nil`, zero, boundary values).
- Error types, error messages consumed by callers, and error timing
  (eager validation vs. lazy failure).
- Side effects: I/O, logging, mutation of shared state, and their *ordering*.
- Non-functional behavior that callers rely on: evaluation order, laziness vs.
  eagerness, idempotency, thread-safety guarantees stated in the contract.

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
- Don't remove abstractions that serve testability or extensibility — a seam
  that lets tests inject a fake is doing real work even when production has
  one implementation.
- Don't optimize for line count over comprehension.

## 5. Scope to what changed

Default to simplifying recently modified code. Avoid unrelated drive-by
refactors unless explicitly asked. A simplification PR that also "improves"
four untouched modules buries the reviewable change and breaks the
bisectability of history.

---

## When this skill applies

- After a feature is working and tests pass, but the implementation feels
  heavier than it needs to be.
- During code review when readability or complexity issues are flagged.
- Deeply nested logic, long functions, or unclear names in code you own.
- Code written under time pressure, now being hardened.
- Related logic scattered across files that should be consolidated.
- After merging changes that introduced duplication or inconsistency.

## When NOT to apply (out of scope)

- **Code already clean and readable** — don't simplify for the sake of it.
- **Code you don't understand yet** — comprehend before you simplify.
- **Performance-critical code** where the "simpler" version would be
  measurably slower. Measure first; if the simpler form is slower, keep the
  complex one and say why in the report.
- **Code about to be rewritten entirely** — simplifying throwaway code wastes
  effort.
- **Feature changes** — behavior-preserving only. New behavior is a different
  task.
- **Style-only churn** — reformatting, import reordering, renaming for taste.
- **Module/interface redesign** — route to the `improve-codebase-architecture`
  skill instead. Simplification operates inside the existing design.

## Citations used in this skill

- `[Osmani]` — Addy Osmani, code simplification / agent-skills material
  (the upstream source of this skill's methodology).
- `[Fowler]` — martinfowler.com refactoring catalog and related essays.
- `[Feathers]` — Michael Feathers, *Working Effectively with Legacy Code*.
- `[prática pós-2020]` — community practice after the books; add a source URL
  when possible.

Claims in this file are the skill's own operating rules; cite `[Osmani]` when
restating the methodology's origin, and use the other tags only where the
loaded references actually back the claim.
