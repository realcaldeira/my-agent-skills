# Aggregate design — Vernon's four rules

Primary source: `[IDDD ch.10]` ("Aggregates"; expands Vernon's "Effective
Aggregate Design" essays).
Complements: `[Distilled ch.5]`, `[Evans Reference]`.

Aggregates are the tactical concept that fails most often. Too large: killed
performance and concurrency. Too small: cross-aggregate transactions
everywhere. Vernon's four rules resolve the trade-off.

---

## Rule 1 — Protect true invariants inside consistency boundaries

**Invariant:** a condition that must hold at the end of every operation
(transaction start and end). Temporary inconsistency *during* the operation is
fine.

**How to apply:**
1. Ask: what business rule requires A and B to be coherent *at the same
   instant*?
2. "Immediately, always" → same aggregate.
3. "Eventually, within seconds/minutes" → separate aggregates coordinated by
   a domain event.

**Example `[IDDD ch.10]`:**

```
BacklogItem { status, sprintId }  // invariant: status=COMMITTED ⟹ sprintId != null
```

The transition must be atomic, so `commitTo(sprint)` mutates both fields
inside one aggregate.

**Trap:** mistaking a database requirement ("I need ACID across these two
tables") for a business invariant. DB pressure is design; invariants come from
the business. "Everything must be immediately consistent" is usually a
developer/DBA driving the model.

## Rule 2 — Design small aggregates

**Why:** less optimistic-concurrency contention, lower memory, shorter
transactions, simpler tests.

**Operational heuristic:**
- Start with **one entity as aggregate root** plus its intrinsic value objects.
- Add child entities only when a real invariant demands them.
- Children growing without bound (e.g. `Product` with thousands of
  `BacklogItem`) is a clear signal to split.

**Size smells** (rough thresholds, not from the book
`[sem fonte verificada]`): loading the aggregate pulls 100+ objects; simple
operations touch 50%+ of the state; composition deeper than 3 levels; version
conflicts between users are frequent.

**How to split:** if a "child" has its own lifecycle and rules, it is another
aggregate. Relate by ID.

## Rule 3 — Reference other aggregates by identity, never by object

```
class Order {
  Customer customer;      // direct reference — wrong
}

class Order {
  CustomerId customerId;  // ID only — right
}
```

**Why `[IDDD ch.10]`:** each aggregate loads and persists independently;
storage can differ per aggregate; transactions stay inside one aggregate; no
accidental graph traversal; distribution becomes possible.

**If you need the other aggregate's data:** load it explicitly via its
repository in the application service *before* calling the aggregate method.
The domain receives IDs and value objects, not other aggregates.

## Rule 4 — Use eventual consistency outside the boundary

**Mantra:** one transaction per aggregate instance.

1. Aggregate A finishes and emits a domain event.
2. The application service commits A plus the event (outbox).
3. A subscriber — same process or messaging — updates aggregate B **in a
   separate transaction**.

**Consistency window:** the business defines it. "Immediate" (same process,
right after commit) is common; "minutes" happens; "zero" is almost never
needed.

**If you think you need immediate cross-aggregate consistency:** revisit
rule 1. Either both belong in one aggregate, or the requirement is
overstated.

## Reasons to break the rules `[IDDD ch.10]`

Vernon names four situations where modifying more than one aggregate in a
transaction (or relaxing the rules) can be justified. Treat them as
exceptions to argue for explicitly, not defaults:

1. **User interface convenience** — e.g. batch creation of several aggregate
   instances in one request, when no invariant spans them (atomic creation
   of A and B as one conceptual act is an example).
2. **Lack of technical mechanisms** — no messaging/event infrastructure
   available to deliver eventual consistency.
3. **Global transactions** — policy or legacy integration forces two-phase
   commit across resources.
4. **Query performance** — holding a direct object reference (instead of an
   ID) when loading by ID is measurably too slow.

An audit that finds a multi-aggregate transaction checks these first; if one
applies and is documented, report it as a trade-off, not a Rule 4 violation.

---

## Where invariants live

**Inside the aggregate** (enforced by the root): consistency among children
and VOs; the root's own state transitions.

**Outside the aggregate:**
- Global uniqueness ("only one customer with this CPF") → DB unique
  constraint + check in the application service. Not an aggregate invariant.
- Cross-aggregate rules ("stock ≥ reservations") → domain event + process
  manager/saga with eventual consistency.

## Right-sizing process `[IDDD ch.10]`

1. **Start small:** every aggregate candidate is 1 entity + intrinsic VOs.
2. **List reactions:** "when A changes, what should change as a consequence?"
3. **Ask the domain expert the timeframe:** immediate, or are seconds fine?
4. Immediate → same aggregate; eventual → split + domain event.
5. **Iterate** whenever a new requirement appears.

## Anti-patterns

- **God aggregate** — root with dozens of fields and children (e.g. 50+
  fields `[sem fonte verificada]`). Split.
- **Aggregate without a real invariant** — "these feel like they belong
  together" with no business rule. Convenience only — split.
- **Cross-aggregate loop** — A's event triggers B, whose event triggers A.
  Design smell; revisit who owns the state.
- **Repository inside the aggregate** — injected to lazy-load children. Breaks
  isolation and couples to persistence. Load first, pass the data.
- **Aggregate = table** — 1:1 with a relational table. Forces VOs into tables
  and ignores invariants. The model drives the schema, not the reverse.

## Review checklist

- [ ] One clear aggregate root?
- [ ] External references go only to the root?
- [ ] Other aggregates referenced by ID, not object?
- [ ] Small enough (fast load, few objects)?
- [ ] Invariants declared in code or tests?
- [ ] Transactions touch only this aggregate?
- [ ] Cross-aggregate operations use domain events + eventual consistency?
- [ ] Value objects immutable?
