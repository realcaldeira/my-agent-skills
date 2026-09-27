# Code review heuristics — DDD audit checklist

Stack-agnostic signals. Pair each finding with severity
(`CRÍTICO`/`ALTO`/`MÉDIO`/`BAIXO`), evidence (`path:line` + snippet), source
tag, and an incremental fix. Detailed rules live in `aggregate-design.md`,
`tactical-patterns.md`, `context-mapping.md`, `architecture-styles.md`.

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
- Transactions spanning more than one aggregate (Rule 4 violation).

## 4. Value objects vs. primitives

- Money as `BigDecimal` + currency string pairs; dates as bare strings;
  emails/IDs as raw strings everywhere. Primitive obsession.
- Mutable "value" types with setters.

## 5. Services and layering

- God application service (hundreds of lines of business rules).
  `[IDDD ch.14]`
- Domain services holding state, or entities reaching into repositories.
- Infrastructure imports inside domain code (framework annotations aside,
  coupling to ORM/base classes). `[IDDD ch.4]`
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
- Given-When-Then scenarios missing for the core workflows
  (`templates/strategic-plan.md`).
- Tests full of builder boilerplate → oversized aggregates.

## Good signals (report these too)

- Entities with behavior and named invariants.
- VOs used liberally; aggregates referenced by ID.
- Module names matching the experts' language.
- Event names in the past tense; thin application services.
- Tests written as business scenarios.
