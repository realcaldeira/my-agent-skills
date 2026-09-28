# Simplification signals

Step 1 (understand first) and Step 2 (find candidates) of the process. The
router routes here for Apply, Review, and Teach; this file is the working
checklist. Behavior-parity questions live in `principles.md` — ask them before
every change.

---

## Step 1: Understand before touching

Before changing or removing anything, understand why it exists. Answer:

1. **What is this code's responsibility?** The one job it is supposed to do.
2. **What calls it? What does it call?** Callers, callees, and any external
   contract (HTTP, CLI, public API) that pins behavior.
3. **What are the edge cases and error paths?** Empty inputs, failures,
   timeouts, partial state.
4. **Are there tests that define expected behavior?** If yes, they are the
   parity oracle; if no, say so and treat changes as higher risk.
5. **Why might it have been written this way?** Time pressure, a bug fix, a
   framework constraint, a performance measurement. The ugly version may be
   load-bearing.

If you can't answer these, read more context first. "I'll simplify it and see
if tests pass" is not understanding — tests can be wrong or incomplete.

## Step 2: Simplification signals

Nine signals, each with a one-line example. A hit is a *candidate*, not an
order: still check `principles.md` (behavior, conventions, balance) before
touching anything.

### 1. Deep nesting

Guard clauses and early returns instead of stacked `if/else` pyramids.

```js
if (user) { if (user.active) { if (user.plan) { doThing(); } } }
// → if (!user || !user.active || !user.plan) return; doThing();
```

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
longer be false; delete (after checking callers and tests).

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

---

## Severity mapping for candidates

- **CRÍTICO** — candidate touches behavior-adjacent code (error paths, side
  effect ordering, concurrency); changed carelessly it breaks production.
- **ALTO** — comprehension is badly blocked (deep nesting + mixed
  responsibilities together, misleading names on public API).
- **MÉDIO** — local clarity win with contained risk (nested ternary, flag
  argument, one duplicated block).
- **BAIXO** — cosmetic-adjacent but still behavior-safe (dead code already
  proven unreachable, generic local name).

## Citations

- `[Osmani]` — signal list and "understand before touching" gate.
- `[Fowler]` — naming and control-flow refactoring patterns behind signals
  1, 3, 6 (`Replace Nested Conditional with Guard Clauses`, naming essays).
- `[Feathers]` — "understand why it exists before touching" for legacy code
  (signal context, step 1 question 5).
- `[prática pós-2020]` — flag-argument splitting and seam-preservation as
  default modern practice.
