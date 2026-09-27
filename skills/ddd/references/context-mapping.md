# Context mapping — relationships between bounded contexts

Sources: `[Evans Reference]`, `[Evans DDD part IV]`, `[IDDD ch.2,13]`,
`[Distilled ch.4]`, `[prática pós-2020]`.

A context map is not a network diagram — it names **who depends on whom and
under which pattern**. Draw it before integration code exists.

---

## The nine relationship patterns `[Evans Reference]`

| Pattern | Shape | When / cost |
| --- | --- | --- |
| **Partnership** | two teams coordinate closely | shared roadmap; high coordination cost |
| **Shared Kernel** | small shared model subset, joint ownership | tight trust; changes need consultation |
| **Customer-Supplier** | upstream serves downstream's needs | upstream runs downstream's acceptance tests |
| **Conformist** | downstream accepts upstream model as-is | no leverage over upstream; zero translation cost |
| **ACL** | downstream translates defensively | protecting your model from a hostile/legacy upstream |
| **OHS + Published Language** | upstream exposes a standard protocol/schema | many consumers; you define the exchange format |
| **Separate Ways** | no integration | integration cost exceeds value |
| **Big Ball of Mud** | model in decay | recognize and fence it; do not "fix" it opportunistically |
| **Core Domain** | the relationship center | invest here; everything else serves it |

Practical reading: every arrow on the map gets one of these labels, plus
direction (upstream → downstream) and a data/protocol note.

## Anti-Corruption Layer (ACL)

A translation boundary between your model and a model you do not want to
import. Contains: façade/adapter interfaces in *your* language, translators
mapping foreign types to yours, and integration tests pinning the mapping.

**Use when:** consuming legacy, vendor, or another team's model that is
unstable or semantically wrong for you. `[Evans Reference]`

**Do not** build an ACL when the upstream model is already a clean published
language you control — that is pure duplication.

## Integration mechanics

**Sync vs. async** — sync calls create temporal coupling: an upstream outage
becomes your outage `[prática pós-2020]`. Prefer async events for state
propagation; reserve sync (REST/RPC) for queries where the user waits.

**Commands vs. events** — a command is a directed request ("ReserveStock");
an event is a fact ("StockReserved"). Events decouple: the producer does not
know consumers.

**Wire formats** `[Distilled ch.4]` — JSON, JSON Schema/OpenAPI, Protobuf,
Avro, XML. Choose for: schema evolution, tooling, and payload size. Publish
the schema (Published Language) and version it. Never share domain classes
across contexts — share DTOs/envelopes.

**Notification envelope** `[IDDD ch.13]` — wrap cross-context events as
`{ typeName, version, occurredOn, eventBody, metadata }`. Consumers read
fields without sharing your class model (NotificationReader style), which
decouples release cycles.

## Data ownership rules

- One context owns each table/store. Others read via API, events, or
  read-only replicas explicitly sanctioned — never by joining the owner's
  tables in their transactions.
- Shared database = hidden shared kernel. It is the most common real-world
  violation of a context map.
- Duplicated reference data across contexts is normal (each keeps its own
  `Customer` projection). Reconcile via events.

## Mapping workshop

1. List candidate contexts with their ubiquitous language samples.
2. Draw dependency arrows from actual integration (who calls/reads whom).
3. Label each arrow with a pattern from the table.
4. For every "shared DB" or "join across modules" found, decide: Shared Kernel
   (with coordination), ACL, or event integration.
5. Mark the core domain; spend modeling effort there first.

## Review checklist

- [ ] Every integration point labeled with a pattern?
- [ ] Direction (upstream/downstream) explicit?
- [ ] No cross-context table joins or shared writes?
- [ ] Cross-context payloads are versioned DTOs/envelopes, not domain objects?
- [ ] Sync calls justified (user waiting) rather than default?
- [ ] Legacy/vendored models fenced with an ACL where they pollute?
