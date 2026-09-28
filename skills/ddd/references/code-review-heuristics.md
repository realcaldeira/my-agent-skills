# Code review heuristics — DDD audit checklist

Stack-agnostic signals. Pair each finding with severity (rubric below),
evidence (`path:line` + snippet), source tag, and an incremental fix. Detailed
rules live in `aggregate-design.md`, `tactical-patterns.md`,
`context-mapping.md`, `architecture-styles.md`.

## Severity rubric

Every finding — and every subagent report — uses this scale:

| Severity | Criterion | Examples |
| --- | --- | --- |
| **CRÍTICO** | an invariant can be broken or data corrupted/lost | two contexts writing the same tables; a multi-aggregate transaction with no invariant causing lost updates; events published before commit on a lossy transport |
| **ALTO** | a boundary or ownership violation that blocks evolution | cross-context joins; object references between aggregates; domain code calling persistence APIs; business rules in controllers of a core module |
| **MÉDIO** | modeling or language drift that raises the cost of change | primitive obsession in the core; command-shaped event names; one term with two meanings |
| **BAIXO** | naming, style, or local polish | technical suffixes (`Impl`, `Manager`); tolerated mapping annotations |

Scale down one level (or report as a trade-off) when the module is a
supporting/generic subdomain and step 0 says simple code is acceptable there.

## 0. Is DDD warranted here?

Before applying sections 2–4 and 8 (anemic model, aggregates, value objects,
persistence) at full severity, classify each audited module as core,
supporting, or generic, with evidence (business differentiation, rule
density, change frequency) — `strategic-design.md` owns the definitions.
Tactical modeling effort belongs in the core domain `[Evans Reference]`.
For simple supporting/generic modules, CRUD or a Transaction Script is a
legitimate choice `[Fowler]`; record it as acceptable, not as an anemic-model
violation. When in doubt, ask whether the project would pass a DDD
"scorecard" (complex, evolving rules; domain experts available)
`[IDDD ch.1]`. Cross-context boundary and data-ownership findings
(section 7) apply to every module.

---

## 1. Naming and language

- Class/method names the domain expert would not say → modeling gap or wrong
  boundary. `[Evans Reference]`
- Same term meaning different things in different modules → candidate bounded
  context split.
- Different terms for the same concept inside one module → ubiquitous language
  drift.
- Technical names in domain code (`OrderDTOManager`, `DataProcessorImpl`).

## 2. Anemic domain

- Entities that are getter/setter bags; business rules living in services,
  controllers, or utils. `[Evans Reference]`
- `if/switch` chains on a status/enum scattered across the codebase instead of
  state behavior on the entity.
- Domain logic in SQL (stored procedures enforcing workflow) or in UI.

## 3. Aggregates

- Aggregate root unclear, or several entities mutated in one transaction
  without a shared invariant (`aggregate-design.md`).
- Object references to other aggregates inside an aggregate (Rule 3 violation).
- Children collections growing without bound.
- Repository/ORM calls inside domain methods (lazy loading through injection).
- Transactions spanning more than one aggregate (Rule 4 violation), unless
  one of the documented reasons to break the rules applies
  (`aggregate-design.md`).

## 4. Value objects vs. primitives

- Money as a bare decimal plus a separate currency string; dates as bare strings;
  emails/IDs as raw strings everywhere. Primitive obsession.
- Mutable "value" types with setters.

## 5. Services and layering

- God application service (hundreds of lines of business rules).
  `[IDDD ch.14]`
- Domain services holding state, or entities reaching into repositories.
- Infrastructure coupling inside domain code `[IDDD ch.4]`: mapping
  annotations/attributes on domain types are tolerated (BAIXO) when they do
  not shape the model; inheriting ORM base classes, calling persistence APIs,
  or lazy-loading from the domain is ALTO.
- Controllers with business logic.

## 6. Events

- Command-shaped names (`ProcessOrder`), mutable events, giant payloads,
  events published before commit (`tactical-patterns.md`).
- Shared event classes across contexts instead of versioned envelopes.

## 7. Contexts and integration

- Cross-module table joins or shared writes → hidden shared kernel
  (`context-mapping.md`).
- One "Common"/"Shared"/"Core" module every module imports.
- Sync calls between contexts without a timeout/fallback → temporal coupling.
- Foreign models used directly without ACL where semantics conflict.

## 8. Persistence influence

- Aggregate designed 1:1 with tables; VO forced into tables; schema-driven
  model. `[Evans Reference]`
- Identity generated only by the database when the model needs early identity
  (`tactical-patterns.md`).

## 9. Tests as evidence

- No tests naming business rules (only CRUD round-trips).
- Given-When-Then scenarios missing for the core workflows.
- Tests full of builder boilerplate → oversized aggregates.

## Good signals (report these too)

- Entities with behavior and named invariants.
- VOs used liberally; aggregates referenced by ID.
- Module names matching the experts' language.
- Event names in the past tense; thin application services.
- Tests written as business scenarios.
