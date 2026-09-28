# Architecture styles for DDD systems

Sources: `[Evans Reference]`, `[IDDD ch.4]`, `[Fowler]`, `[prática pós-2020]`.

DDD does not mandate an architecture. The style must protect domain code from
infrastructure and keep bounded context boundaries visible.

---

## Layered architecture `[Evans Reference]`

Presentation → Application → Domain → Infrastructure. Dependency direction
points down; the domain layer must not import infrastructure.

**Verdict:** fine as a starting point; often degrades into anemic domain plus
fat services because nothing prevents logic leaking into the application
layer.

## Hexagonal / Ports & Adapters `[IDDD ch.4]`

Domain at the center. **Ports** are the domain's contracts (inbound: use-case
interfaces; outbound: repository, clock, gateway interfaces). **Adapters**
translate the outside world (REST controller, SQL repository, message bus).

**Rules:**
- The domain defines ports; infrastructure implements them.
- Inverting the dependency (DIP) is the whole point.
- Controllers stay thin: parse input → call application service → map output.
- Adapters are replaceable; tests run the domain against in-memory adapters.

**Smell:** port interfaces that mirror a framework (a "JpaPort"), or adapters
containing business rules.

## Modular monolith `[prática pós-2020]`

One deployable; multiple modules with hard boundaries — each module a bounded
context, own domain model, own storage schema, communication through module
APIs and events (in-process).

**Why it is the modern default for greenfield, including ERP:**
- Full transactional simplicity where consistency really is immediate.
- No distributed-systems tax (sagas for local invariants, network failure
  modes, tracing).
- Boundaries can later be cut into services *if* scaling or team autonomy
  demands it — the module seam is the future service seam.

**Enforcement:** dependency rules in code (no cross-module imports of internals
— arch unit tests), separate schemas, module-owned migrations.

## Microservices

Justified when: independent scaling of a specific context, independent release
cadence required by the business, team autonomy at scale, or isolation of a
volatile/legacy dependency.

**Costs:** distributed consistency (sagas, compensations), temporal coupling,
schema evolution over the wire, operational burden. Never the starting point
just because "it is modern".

## DIP and dependency rules

- Domain layer may depend only on its own abstractions.
- Application layer orchestrates; it may depend on domain + port interfaces.
- Infrastructure depends on the domain (implements its ports) — never the
  reverse.
- Composition roots (startup wiring) are the only place that knows about
  concrete adapters.

## REST as integration style `[Fowler]`

REST resources are a published language for a context's API — an integration
concern, not a domain model. Do not shape aggregates around REST DTOs. Map at
the adapter: domain → DTO at the edge.

## Choosing a style

| Situation | Recommendation |
| --- | --- |
| Greenfield, unknown scale, small team | Modular monolith + hexagonal inside each module |
| Legacy with hot new domain | Strangler fig (see `legacy-migration.md`) |
| One context needs 10x scale or separate deploy | Extract that module as a service |
| Regulated data isolation per tenant | Separate services/stores per boundary, but model contexts first |

## Review checklist

- [ ] Domain code free of framework imports (tolerated mapping annotations
      aside — see `code-review-heuristics.md` §5)?
- [ ] Ports defined in the domain, implemented in infrastructure?
- [ ] Module boundaries match bounded contexts (no cross-module internals)?
- [ ] Deployment split justified by evidence, not fashion?
- [ ] Transaction boundaries inside aggregates (`aggregate-design.md`)?
