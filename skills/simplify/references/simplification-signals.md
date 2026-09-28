# Simplification signals

Step 1 (understand first) and Step 2 (find candidates) of the process. The
router routes here for Apply, Review, and Teach; this file is the working
checklist. Behavior-parity questions, and when to ask them, live in
`principles.md` §1.

---

## Step 1: Understand before touching

Before changing or removing anything, understand why it exists (Chesterton's
Fence). Answer:

1. **What is this code's responsibility?** The one job it is supposed to do.
2. **What calls it? What does it call?** Callers, callees, and any external
   contract (HTTP, CLI, public API) that pins behavior. Public or
   convention-reached symbols fall under the public-interface rule
   (`principles.md` §1).
3. **What are the edge cases and error paths?** Empty inputs, failures,
   timeouts, partial state.
4. **Are there tests that define expected behavior?** If yes, they are the
   parity oracle; if no, say so and follow the no-test-oracle branch in
   `verification.md`.
5. **Why might it have been written this way?** Time pressure, a bug fix, a
   framework constraint, a performance measurement. The ugly version may be
   load-bearing.

If you can't answer these, read more context first. "I'll simplify it and see
if tests pass" is not understanding — tests can be wrong or incomplete.

## Step 2: Simplification signals

Eleven signals, each with a one-line example. A hit is a *candidate*, not an
order: still check `principles.md` (behavior, conventions, balance) before
touching anything.

### 1. Deep nesting

Guard clauses and early returns instead of stacked `if/else` pyramids.

```js
function run(user) { if (user) { if (user.active) { if (user.plan) { doThing(); } } } }
// → function run(user) { if (!user || !user.active || !user.plan) return; doThing(); }
```

Equivalent only when the nested block ends a function that returns nothing.
If statements follow it or the function returns a value, an early `return`
skips them: extract the block into a helper and put the guard there.

### 2. Long functions with mixed responsibilities

One function doing validation + transformation + I/O; split by responsibility.

```js
function handleOrder(o) { /* 80 lines: validate, price, charge, email */ }
// → validate(o); priceOrder(o); charge(o); sendReceipt(o)
```

### 3. Nested ternaries

Compact conditionals that require a mental pause; use readable control flow.

```js
const x = a ? (b ? 1 : 2) : (c ? 3 : 4);
// → if/else or a lookup table with named outcomes
```

### 4. Boolean flag arguments

A flag parameter that makes the function do two different things; split into
two named functions.

```js
function send(user, async) { ... }
// → sendSync(user) / sendAsync(user)
```

### 5. Repeated conditionals

The same condition checked in several branches or files; evaluate once or
centralize.

```js
if (isPremium(u)) { ... } // ...repeated in 5 handlers
// → one policy function / early filter
```

### 6. Generic or misleading names

`data`, `tmp`, `manager`, `process` — or a name that lies about the content;
rename to what it actually is.

```js
const data = calculateInvoiceTotal(items);
// → const invoiceTotal = ...
```

### 7. Duplicated logic

The same algorithm or rule copy-pasted; extract a shared helper *if* the
copies truly belong to one concept (if not, this may be deliberate
duplication — leave it and say so).

```js
// three handlers each computing tax with the same formula
// → computeTax(order)
```

### 8. Dead code

Unreachable branches, unused exports, commented-out blocks, flags that can no
longer be false; delete (after checking callers and tests). "Unused" inside
this repo is not unused for exports: see the public-interface rule
(`principles.md` §1).

```js
if (false) { legacyPath(); }  // or an export nothing imports
```

### 9. Wrappers or abstractions that add no value

Pass-through layers that only forward arguments without adding policy, naming,
or a seam worth keeping. Collapse — but only after the balance check in
`principles.md` (a seam serving testability *is* value).

```js
function getUser(id) { return repo.findById(id); } // no policy, one caller
// → call repo.findById(id) at the call site
```

> **Cross-reference:** the formal test for pass-through modules and layers is
> the **deletion test** (does anything break if the module disappears? what
> does it own?), owned by the `improve-codebase-architecture` skill. Do not
> restate that skill's test here — for module/interface-level wrappers, route
> there; this signal covers in-file/function-level pass-throughs only.

### 10. Comments that restate the code

"What" comments that repeat the next line; delete them. Keep "why" comments
(constraints, workarounds, links to issues) and docstrings the project or a
doc generator requires.

```js
// increment counter
counter++;
// → counter++;
```

### 11. Speculative generality

Options, parameters, config knobs, or single-implementation interfaces added
"for the future" that no caller or test uses today; remove them. A seam that
tests use is not speculative — run the balance check in `principles.md` §4
first.

```js
function fetchUser(id, { retries = 0, cache = false } = {}) { ... } // no caller passes options
// → function fetchUser(id) { ... }  // body keeps the default behavior (no retry, no cache)
```

---

## Severity and change risk

This section is the only owner of both scales. Every candidate and every
applied change carries both.

**Severity** — `CRÍTICO`/`ALTO`/`MÉDIO`/`BAIXO` measures the impact of the
clarity problem, as in the repo's other skills (worst problem first):

- **CRÍTICO** — the code misleads readers about what it does (a name,
  comment, or flag that lies about behavior), so the next edit is likely to
  introduce a bug.
- **ALTO** — comprehension is badly blocked (deep nesting plus mixed
  responsibilities, a long function doing several jobs, misleading names; on
  a public interface: report, don't apply).
- **MÉDIO** — local clarity win (nested ternary, flag argument, one
  duplicated block, speculative option).
- **BAIXO** — minor (restating comment, generic local name, dead code already
  proven unreachable).

**Risco da mudança** — `ALTO`/`MÉDIO`/`BAIXO` measures how likely the
change is to alter behavior, separately from severity:

- **ALTO** — touches error paths, side-effect ordering, concurrency, or the
  public interface (`principles.md` §1), or is a non-local change with no
  covering tests.
- **MÉDIO** — crosses functions or files (extract or merge a helper, dedupe)
  with tests covering the code.
- **BAIXO** — parity is locally provable (local rename, deleting provably
  unreachable code, a named intermediate that does not reorder evaluation).

Apply-mode consequences of `Risco da mudança: ALTO` live in
`verification.md`. Phase 1 of next steps takes high-severity, low-risk
candidates first.

## Citations

- `[Osmani]` — signal list, the "understand before touching" gate
  (Chesterton's Fence), deleting "what" comments while keeping "why"
  comments (signal 10), and rejecting speculative abstractions (signal 11).
- `[Fowler]` — naming and control-flow refactoring patterns behind signals
  1, 3, 6 (`Replace Nested Conditional with Guard Clauses`, naming essays);
  flag-argument splitting, signal 4 (`Remove Flag Argument`, Refactoring 2nd
  ed.; FlagArgument bliki); the Speculative Generality smell, signal 11.
- `[Feathers]` — "understand why it exists before touching" for legacy code
  (step 1 question 5); seams worth preserving for testability (signal 9).
