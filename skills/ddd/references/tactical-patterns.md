# Tactical patterns — building blocks in depth

Sources: `[Evans Reference]`, `[Evans DDD]`, `[IDDD ch.5–8]`, `[Distilled ch.5]`.
Aggregate sizing and invariants live in `aggregate-design.md`.

---

## Entity vs. Value Object

| | Entity | Value Object |
| --- | --- | --- |
| Identity | yes, stable over time | no |
| Equality | by identity | by value |
| Mutability | mutable (controlled) | immutable |
| Lifecycle | tracked | replaceable |
| Typical | Order, User, BankAccount | Money, DateRange, Address, Email |

**Decision test:** if two instances with the same attributes must be treated
as different things, it is an entity. If interchangeable, it is a value object.
Prefer VOs — they eliminate identity bugs and are trivially thread-safe.

**Anti-anemic test:** an entity with only getters/setters and no behavior is a
data bag. Business rules ("an order can only be cancelled before shipping")
must live on the entity, not in a service.

## Domain Service vs. Application Service

- **Domain Service** — a domain operation that naturally belongs to no single
  entity or VO (e.g. `TransferService.transferFunds(a, b, amount)`). Stateless;
  speaks the ubiquitous language; participates in the model.
  `[Evans Reference]`
- **Application Service** — use-case orchestrator. Opens transactions, loads
  aggregates via repositories, calls domain methods, publishes events, handles
  auth/transactions. **Contains no business rules.** `[IDDD ch.14]`

**Smell:** "God service" / fat application service — hundreds of lines of
business logic in the application layer. Move rules into aggregates, VOs, or
domain services.

## Repository

- One per aggregate root (not per table).
- Interface in the domain layer, implementation in infrastructure.
- Speaks the language: `orders.findPendingFor(customerId)`, not
  `select * from orders where ...`.
- Returns fully reconstituted aggregates; queries for read models are a
  different concern (CQRS). `[Evans Reference]`

**Smell:** repository used as a generic CRUD bag, or repository methods called
from inside an aggregate.

## Factory

Encapsulates construction when an aggregate has real invariants at creation
time (e.g. `OrderFactory.place(customer, lines)` enforcing non-empty lines and
valid prices). If construction is trivial (a VO with 2 fields), a constructor
or named constructor is enough — a factory class is over-engineering.
`[Evans Reference]`

## Domain Event

- Named in **past tense**: `OrderPlaced`, `PaymentReceived`, `StockReserved`.
- Immutable; carries only what consumers need (IDs + minimal data), not whole
  aggregates. `[IDDD ch.8]`
- Published **after** the state change commits (transactional outbox when the
  transport can lose messages). `[prática pós-2020]`
- Schema evolves: version the payload or wrap in a notification envelope
  (`typeName`, `version`, `occurredOn`, `eventBody`, `metadata`) `[IDDD ch.13]`.

**Smells:** events named `ProcessOrder` (that is a command); events carrying
huge payloads; events published before commit; "event" classes with setters.

## Specification

Predicate object with `isSatisfiedBy(candidate)`, composable via
`and`/`or`/`not`. Three uses `[Evans DDD ch.10]`:

1. **Validation** — `EligibleForDiscount.isSatisfiedBy(order)`.
2. **Selection** — query-side filtering expressed in the language.
3. **Building to order** — the spec drives construction.

Good when the rule is reused in several places or needs to be named in the
ubiquitous language. Overkill for a one-line `if`.

## Identity generation

Options `[IDDD ch.5]`: user-provided, application-generated (UUID/ULID),
persistence-generated (auto-increment), or value-derived (hash).

**Modern default:** generate in the application — UUID v4 or ULID. ULID's
timestamp prefix gives natural ordering and index-friendly inserts.
Persistence-generated IDs couple identity to a database and complicate
multi-store or distributed setups. `[prática pós-2020]`

## Module

Cohesive grouping of model elements whose name is part of the language
(`billing`, `fulfillment`). In practice a module ≈ a bounded context candidate;
module boundaries should match transactional and linguistic boundaries.
`[Evans Reference]`

## Quick classification guide

| Signal | Likely modeling choice |
| --- | --- |
| Needs uniqueness over time | Entity |
| Compared/interchangeable by content | Value Object |
| Rule spanning two entities | Aggregate invariant (if immediate) or event + saga (if eventual) |
| Operation fits no entity | Domain Service |
| Use-case orchestration only | Application Service |
| Reusable boolean rule | Specification |
| Something happened, others care | Domain Event |
| Reconstitution from storage | Repository |
| Non-trivial construction invariants | Factory |
