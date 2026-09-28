# Deepening — safely merging shallow modules given their dependencies

How to deepen a cluster of shallow modules. Assumes `vocabulary.md` —
**module**, **interface**, **seam**, **adapter**, **depth**.

Sources: `[Ousterhout]`, `[Feathers]`, `[prática pós-2020]`.

---

## Grilling loop (`deepen` mode procedure)

Once the user picks a candidate, drop into an interactive grilling
conversation. Walk the design tree together — constraints, dependencies, the
shape of the deepened module, what sits behind the seam, what tests survive.
Do not hand over a plan on the first turn; probe, restate the trade-off, let
decisions crystallize.

Side effects (naming a term in the project's glossary, offering an ADR) are
handled inline as decisions crystallize — see `domain-context-and-adrs.md`.
When alternative interfaces become the topic, hand over to
`interface-design.md` ("design it twice").

The output of the loop is the deepening plan
(`templates/deepening-plan.md`).

## Dependency categories

When assessing a candidate for deepening, classify its dependencies. The
category determines how the deepened module is tested across its seam.

### 1. In-process

Pure computation, in-memory state, no I/O. Always deepenable — merge the
modules and test through the new interface directly. No adapter needed.

### 2. Local-substitutable

Dependencies that have local test stand-ins (PGLite for Postgres, in-memory
filesystem). Deepenable if the stand-in exists. The deepened module is tested
with the stand-in running in the test suite. The seam is internal; no port at
the module's external interface.

### 3. Remote but owned (Ports & Adapters)

Your own services across a network boundary (microservices, internal APIs).
Define a **port** (interface) at the seam. The deep module owns the logic;
the transport is injected as an **adapter**. Tests use an in-memory adapter.
Production uses an HTTP/gRPC/queue adapter.

Recommendation shape: _"Define a port at the seam, implement an HTTP adapter
for production and an in-memory adapter for testing, so the logic sits in one
deep module even though it's deployed across a network."_

### 4. True external (Mock)

Third-party services (Stripe, Twilio, etc.) you don't control. The deepened
module takes the external dependency as an injected port; tests provide a
mock adapter.

## Seam discipline

- **One adapter means a hypothetical seam. Two adapters means a real one.**
  Don't introduce a port unless at least two adapters are justified (typically
  production + test). A single-adapter seam is just indirection.
  `[prática pós-2020]`
- **Internal seams vs external seams.** A deep module can have internal seams
  (private to its implementation, used by its own tests) as well as the
  external seam at its interface. Don't expose internal seams through the
  interface just because tests use them. `[Ousterhout]`

## Testing strategy: replace, don't layer

- Old unit tests on shallow modules become waste once tests at the deepened
  module's interface exist — plan their deletion in the same change, after the
  new interface-level tests are green. Do not keep both layers.
- Write new tests at the deepened module's interface. The **interface is the
  test surface** (`vocabulary.md` §Principles).
- Tests assert on observable outcomes through the interface, not internal
  state.
- Tests should survive internal refactors — they describe behaviour, not
  implementation. If a test has to change when the implementation changes,
  it's testing past the interface. `[Feathers]`

## DDD flavor of ports & adapters — owned by the `ddd` skill

The discipline above (dependency categories, the two-adapters rule,
replace-don't-layer) is all this skill owns. The DDD flavor — domain defines
ports, DIP direction, the "JpaPort" smell — is owned by the `ddd` skill's
[`architecture-styles.md`](../../ddd/references/architecture-styles.md);
load that skill when the conversation turns to domain-vs-infrastructure
layering.
