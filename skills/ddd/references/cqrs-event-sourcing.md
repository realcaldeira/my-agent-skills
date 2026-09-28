# CQRS and Event Sourcing — when (not) to use them

Sources: `[IDDD ch.4, appendix A]`, `[Fowler]` (CQRS bliki entry, Event
Sourcing article), `[prática pós-2020]`.

Neither is required for DDD. Both are tactical options chosen **per bounded
context**, never for a whole system by default. Outbox and sagas live in
`aggregate-design.md` and `tactical-patterns.md`.

---

## CQRS — Command-Query Responsibility Segregation `[IDDD ch.4]`

Split the model that handles commands (aggregates enforcing invariants) from
the model(s) that answer queries (read models shaped for each screen or
report).

- **Command side:** aggregates and repositories that load by identity; no
  finder methods for display.
- **Query side:** denormalized projections, updated from domain events
  (eventually consistent) or read straight from the same store.
- Separate stores are optional: two models over one database is still CQRS.

**Use when:** read and write shapes diverge strongly (many views over complex
write rules); repositories are bloating with display finders; read and write
load differ by orders of magnitude.

**Do NOT use when:** the context is CRUD-like; reads mirror writes; there is
no pressing need. Fowler warns that for most systems CQRS adds risky
complexity and that it belongs on specific bounded contexts, not the whole
system. `[Fowler]`

## Event Sourcing `[IDDD ch.4, appendix A]` `[Fowler]`

Persist an aggregate as the sequence of domain events that happened to it;
current state is rebuilt by replaying those events (snapshots optional).

- Gives full history, temporal queries ("what did we know on date X"), and
  new projections built from old events.
- Usually paired with CQRS, because querying an event stream directly is
  impractical.

**Use when:** history is itself a business requirement (ledger, audit,
regulatory trail); the domain is naturally event-centric; you need to rebuild
or add projections from past facts.

**Do NOT use when:** the context is simple CRUD; the team cannot absorb the
lasting costs — event schema versioning, replay time, eventual-consistency
UX; personal data must be erasable (LGPD/GDPR) and there is no erasure plan
(e.g. encrypting per subject and deleting the key). `[prática pós-2020]`

## Review checklist

- [ ] CQRS/ES chosen for a named context with a stated reason, not globally?
- [ ] Read models rebuilt from events or the write store, never written by
      hand from other contexts?
- [ ] Events versioned; an upgrade path for old events exists?
- [ ] UI and users tolerate the read-side lag?
- [ ] Erasure and retention obligations addressed before event-sourcing
      personal data?
