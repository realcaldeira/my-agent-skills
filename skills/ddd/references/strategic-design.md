# Strategic design — subdomains, bounded contexts, distillation

Sources: `[Evans Reference]`, `[Evans DDD part IV]`, `[IDDD ch.2]`,
`[Distilled ch.2–3]`, `[DDD Crew]`.

Strategic design decides **where models live and how they relate**. Tactical
patterns only pay off inside a sound strategic shape.

---

## Ubiquitous language

A shared language built on the model, used by domain experts and developers in
conversation, docs, diagrams, and code — within one bounded context. Changing
the language means changing the model.

**Practical tests:**
- Are class/method names words the domain expert says out loud?
- Does the same English word mean two different things in different modules?
  That is a context boundary signal.
- When the expert corrects a term, does the code change?

## Bounded context

Explicit boundary inside which one model and one language are coherent. A
model is not universal — `Customer` means different things in shipping,
billing, and support.

**Signals for a boundary:** language shifts; different experts; different
change cadence; different data ownership; integration that keeps needing
translation.

**Not a boundary:** a technical layer; a single class; a microservice (a
deployment unit can host several contexts — or one context can span several).

## Subdomain types

| Type | Meaning | Investment |
| --- | --- | --- |
| **Core** | Differentiates the business | Best people, custom modeling |
| **Supporting** | Necessary, not differentiating | Adequate team, buy/custom mix |
| **Generic** | Industry-standard problem | Buy, adopt OSS, or minimal code |

Ask: "if a competitor solved this better than us, would customers notice?"
Yes → core. Classification is strategic, not technical — revisit yearly.

## Domain vision statement

Evans: a short description (about one page) of the core domain and the
value it will bring — its value proposition. Written early, revised as
insight grows. `[Evans Reference]` The strategic-plan template uses a
condensed one-paragraph version.

Optional opener, borrowed from product-positioning statements (not Evans's
form): *For [target customer], [system] is the [category] that [key
capability]. Unlike [alternative], it [differentiator].*

## Distillation

- **Highlighted core** — mark what is core (short document + module
  annotations) so the team knows where modeling effort goes. Cheapest, do it
  first. `[Evans Reference]`
- **Segregated core** — physically extract core concepts from supporting code
  when noise drowns them. `[Evans Reference]`
- **Abstract core** — shared interfaces/types capturing the central
  interactions across subdomains. Powerful, risky: it becomes a shared kernel
  — coordinate changes. `[Evans Reference]`

## Core domain patterns worth knowing

- **Generic subdomains** → buy or adopt (auth, notifications, audit log).
  Custom-modeling them wastes core talent.
- **Problem subdomains hiding inside "the core"** — the actual differentiator
  is usually a small kernel (pricing rule, matching engine, risk scoring).
  Find it before modeling peripheral workflows deeply.

## Suggested order (adapted from the DDD Crew Starter Modelling Process) `[DDD Crew]`

The process has eight steps, iterated rather than run once:

1. **Understand** — business model, users, goals.
2. **Discover** — Big Picture event storming.
3. **Decompose** — split into subdomains / candidate contexts.
4. **Strategize** — classify core/supporting/generic (e.g. Core Domain Charts).
5. **Connect** — domain message flow between candidate contexts; context map.
6. **Organise** — align teams to contexts (team composition itself is out of
   scope for this skill).
7. **Define** — one Bounded Context Canvas per context.
8. **Code** — Software Design event storming, Aggregate Design Canvas, then
   implementation.

Recording decisions as ADRs along the way is this skill's addition, not a
DDD Crew step. `[prática pós-2020]`

Workshop logistics are in `event-storming.md`; relationship patterns in
`context-mapping.md`.

## Anti-patterns

- **Shared database integration** — implicit shared kernel with no
  coordination. Refuse by default.
- **One model to rule them all** — a "Customer" module every other module
  depends on. Split by meaning.
- **Context = team = service 1:1** — boundaries drawn by org chart alone.
- **Modeling peripheral generic subdomains deeply** while the core stays
  procedural scripts.

## Checklist before leaving strategic design

- [ ] Domain vision statement written?
- [ ] Subdomains classified core / supporting / generic with reasons?
- [ ] Each candidate context has a name the experts recognize and sample
      ubiquitous language?
- [ ] Context map draft with relationship patterns?
- [ ] Big picture workshop held (or its absence justified)?
