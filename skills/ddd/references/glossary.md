# Glossary — canonical DDD terminology (EN / PT-BR)

Fast lookup. Definitions paraphrased from `[Evans Reference]`, `[Evans DDD]`,
`[IDDD]`. Literal hallmark phrases appear in quotes. Format:
**Term EN** / *Term PT-BR* — definition — source.

Portuguese variants in common use in Brazil are noted when they differ from
the official translation.

---

## Fundamentals

- **Domain** / *Domínio* — The sphere of knowledge the software is built to
  serve; the specific problem the system solves. `[Evans DDD]`
- **Model** / *Modelo* — A rigorous, selective abstraction of domain
  knowledge. Not the diagram — the idea the diagram conveys. `[Evans DDD]`
- **Ubiquitous Language** / *Linguagem Ubíqua* (also *Onipresente*) — Language
  built on the model, used consistently in speech, writing, diagrams, and code
  inside one bounded context. Language change = model change.
  `[Evans Reference]`
- **Bounded Context** / *Contexto Delimitado* — Explicit boundary within which
  one model and one language apply coherently. `[Evans Reference]` `[IDDD ch.2]`
- **Context Map** / *Mapa de Contextos* — Diagram plus narrative of the
  existing bounded contexts and the relationships between them.
  `[Evans Reference]`
- **Subdomain** / *Subdomínio* — A sub-problem of the domain. Types: core,
  supporting, generic. `[Evans Reference]`
- **Core Domain** / *Domínio Principal* — The subdomain with strategic value;
  what differentiates the business. Gets the best people and investment.
  `[Evans Reference]`
- **Supporting Subdomain** / *Subdomínio de Suporte* — Needed to operate, not
  differentiating. `[Evans Reference]`
- **Generic Subdomain** / *Subdomínio Genérico* — Industry-standard problem
  (auth, basic accounting). Buy or use a library. `[Evans Reference]`

## Strategic distillation

- **Domain Vision Statement** / *Declaração de Visão de Domínio* — Short
  (~1 page) statement of the core domain and its value proposition.
  `[Evans Reference]`
- **Highlighted Core** / *Núcleo Destacado* — Visible marking (short doc or
  module annotations) of what is core vs. supporting. `[Evans Reference]`
- **Segregated Core** / *Núcleo Segregado* — Refactoring that physically
  separates core concepts from supporting ones. `[Evans Reference]`
- **Abstract Core** / *Núcleo Abstrato* — Interfaces/abstract types expressing
  the central interactions between subdomains. `[Evans Reference]`

## Context relationships (context map patterns)

- **Partnership** / *Parceria* — Two contexts succeed or fail together;
  explicit coordination. `[Evans Reference]`
- **Shared Kernel** / *Núcleo Compartilhado* — Small shared subset of the
  model, maintained jointly; changes need consultation. `[Evans Reference]`
- **Customer-Supplier** / *Cliente-Fornecedor* — Upstream serves downstream's
  needs; joint acceptance tests. `[Evans Reference]`
- **Conformist** / *Conformista* — Downstream adopts the upstream model
  as-is, no translation. `[Evans Reference]`
- **Anti-Corruption Layer (ACL)** / *Camada Anticorrupção* — Defensive
  translation layer isolating the local model from a foreign upstream model.
  `[Evans Reference]`
- **Open Host Service (OHS)** / *Serviço de Host Aberto* — Upstream publishes
  a standardized protocol for multiple consumers. `[Evans Reference]`
- **Published Language** / *Linguagem Publicada* — Documented exchange
  schema/language, usually combined with OHS. `[Evans Reference]`
- **Separate Ways** / *Caminhos Separados* — No integration; local duplication
  is acceptable. `[Evans Reference]`
- **Big Ball of Mud** / *Grande Bola de Lama* — Legacy anti-pattern: recognize
  it and fence it with an ACL. `[Evans Reference]`

## Tactical building blocks

- **Entity** / *Entidade* — Identified by continuity of identity, not
  attributes. Mutable, stable identity. `[Evans Reference]`
- **Value Object** / *Objeto de Valor* — Defined only by its attributes.
  Immutable; replaced, never modified; equality by value. `[Evans Reference]`
- **Aggregate** / *Agregado* — Cluster of entities and value objects treated
  as one consistency unit; external references reach only the root.
  `[Evans Reference]`
- **Aggregate Root** / *Raiz do Agregado* — The single entity outsiders may
  reference. `[Evans Reference]`
- **Domain Service** / *Serviço de Domínio* — Stateless domain operation that
  does not belong to any entity or value object. `[Evans Reference]`
- **Application Service** / *Serviço de Aplicação* — Thin use-case
  orchestrator: transaction boundary, no business rules. `[IDDD ch.14]`
- **Repository** / *Repositório* — Collection-like interface for reconstituting
  aggregates, expressed in ubiquitous language. `[Evans Reference]`
- **Factory** / *Fábrica* — Encapsulates complex aggregate construction and
  its invariants. `[Evans Reference]`
- **Domain Event** / *Evento de Domínio* — Immutable record of something
  meaningful that happened; named in past tense. `[IDDD ch.8]`
- **Module** / *Módulo* — Cohesive grouping of model elements; its name is
  part of the ubiquitous language. `[Evans Reference]`
- **Specification** / *Especificação* — Reusable domain predicate
  (`isSatisfiedBy`), composable with `and`/`or`/`not`. Uses: validation,
  selection, building to order. `[Evans DDD ch.10]` `[IDDD ch.5,7]`

## Supple design

- **Intention-Revealing Interface** / *Interface Reveladora de Intenção* —
  Names say the "why", not the "how". `[Evans Reference]`
- **Side-Effect-Free Function** / *Função sem Efeitos Colaterais* — Computes a
  result without mutating state; essential for value objects.
  `[Evans Reference]`
- **Assertion** / *Asserção* — Post-conditions and invariants made explicit in
  code, tests, or docs. `[Evans Reference]`
- **Conceptual Contour** / *Contorno Conceitual* — Decomposition aligned with
  the domain's natural seams. `[Evans Reference]`
- **Deeper Insight** / *Insight Mais Profundo* — Model refactoring driven by a
  newly discovered concept, not by technical structure. `[Evans DDD]`
- **Breakthrough** / *Avanço* — Small insights converging into a large,
  simplifying model change. Facilitate it; do not force it. `[Evans DDD]`

## Architecture

- **Layered Architecture** / *Arquitetura em Camadas* — Presentation,
  application, domain, infrastructure; domain does not depend on
  infrastructure. `[Evans Reference]`
- **Hexagonal / Ports & Adapters** — Domain at the center; ports declare
  contracts, adapters translate protocols. `[IDDD ch.4]`
- **CQRS** — Separate write and read models. `[IDDD ch.4, appendix A]`
- **Event Sourcing** — State derived from an immutable sequence of domain
  events. `[IDDD appendix A]`
- **Unit of Work** / *Unit of Work* — Tracks changes to aggregates during an
  operation and commits them in one transaction. `[Fowler]` `[IDDD ch.14]`

## Post-book practice

- **Modular Monolith** / *Monolito Modular* — One deployable, multiple modules
  with hard boundaries aligned to bounded contexts. Default greenfield choice.
  `[prática pós-2020]`
- **Distributed Monolith** / *Monolito Distribuído* — Anti-pattern: services
  with monolith coupling (shared DB, lockstep deploys, chatty sync calls).
  `[prática pós-2020]`
- **Strangler Fig Pattern** / *Estrangulamento* — Incremental migration: the
  new system grows around and eventually replaces the legacy.
  `[Fowler]`
- **Bubble Context** / *Contexto Bolha* — Small new bounded context wrapped in
  an ACL, grown inside the legacy system. `[prática pós-2020]`
- **Outbox Pattern** / *Padrão Outbox* — Persist the domain event with the
  aggregate change in one transaction, publish afterwards. `[prática pós-2020]`
- **Saga** / *Saga* — Sequence of local transactions coordinated by events or
  an orchestrator for cross-aggregate consistency. `[prática pós-2020]`
- **Process Manager** / *Gerenciador de Processo* — Persistent entity reacting
  to domain events and emitting commands to coordinate a workflow.
  `[IDDD ch.8]`
- **Compensating Transaction** / *Transação Compensatória* — New business
  event that logically reverses a prior effect. Not an undo — an auditable
  reversal. `[prática pós-2020]`
- **Temporal Coupling** / *Acoplamento Temporal* — Availability coupling from
  sync cross-context calls; mitigate with async messaging or local cache.
  `[prática pós-2020]`
- **Notification** / *Notificação* — Standard envelope for publishing a domain
  event across contexts; fields in `context-mapping.md`. `[IDDD ch.13]`
- **ULID** — Sortable 128-bit identifier; timestamp prefix gives natural
  ordering and B-tree friendly indexes. Modern alternative to UUID v4 when
  ordering matters. `[prática pós-2020]`
- **Bounded Context Canvas** / *Canvas de Contexto Delimitado* — One-page
  structured description of a bounded context (purpose, classification,
  language, inbound/outbound, constraints). `[DDD Crew]`
- **Modeling Debt** / *Dívida de Modelagem* — Conscious decision to model
  shallowly now; must become explicit backlog with interest and due date.
  `[Distilled ch.7]`
- **Knowledge Acquisition Cycle** / *Ciclo de Aquisição de Conhecimento* —
  Short loop: scenario → model → refine with expert → minimal code → feedback.
  `[Distilled ch.7]`
- **Task-Board Shuffle** — Anti-pattern: velocity stays high while the model
  and language stagnate. Invisible modeling debt. `[Distilled ch.7]`

## Go deeper

Teaching mode: after the entry above, load only the one reference that owns
the concept.

| Concepts | Reference |
| --- | --- |
| Aggregate rules, sizing, invariants | `aggregate-design.md` |
| Entity, value object, anemic model, service, repository, factory, domain event, outbox, specification | `tactical-patterns.md` |
| Bounded context, ubiquitous language, subdomain, core domain, distillation | `strategic-design.md` |
| Context map patterns, ACL, integration, notification envelope | `context-mapping.md` |
| Event storming formats | `event-storming.md` |
| Hexagonal, modular monolith, microservices, DIP | `architecture-styles.md` |
| Strangler fig, bubble context, legacy migration | `legacy-migration.md` |
| Anything else | This glossary entry; if a reference above clearly owns it, load that one; otherwise say the references do not cover it |
