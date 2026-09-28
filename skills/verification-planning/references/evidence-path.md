# Evidence path

The core object of this skill and the substance of all six steps. Loaded for
every mode: Plan runs steps 1–5 plus the budget; Close runs step 6; Teach uses
the one concept section the user asked about.

---

## The evidence path

Before changing a non-trivial system, build an **evidence path**: a
project-specific route from the claim being made to evidence that can
establish, limit, or refute it.

The purpose is not to select a familiar technique. The purpose is to decide
how this system can reveal the truth of this particular change.

Use this skill proportionately. Small mechanical changes can follow ordinary
project checks directly. For larger multi-phase work, this skill establishes
the evidence path that later work follows.

**Related vocabulary:**

| Term | Meaning |
| --- | --- |
| **claim** | The behavior that needs to become true, stated so it can be established, limited, or refuted |
| **evidence** | An observation of the [sistema sob análise] that bears on a claim |
| **evidence owner** | The single piece of evidence responsible for establishing or refuting one claim |
| **verification affordance** | The smallest capability that makes relevant state controllable, observable, repeatable, and diagnosable for an agent (step 3) |
| **verification budget** | The minimum non-duplicative evidence set covering the claims and important boundaries (below) |

## 1. Frame the claim

State the behavior that needs to become true and the conditions that could
make a confident conclusion wrong.

Consider what must change, what must remain true, where the behavior crosses a
boundary, and which failure would matter most.

**Complete when:** the claim, its meaningful uncertainty, and its important
failure modes are concrete enough to investigate.

## 2. Design the evidence path

Derive possible evidence paths from the system itself: its controllable
inputs, observable effects, state transitions, invariants, boundaries,
artifacts, and ability to repeat or reverse a scenario.

Generate alternatives before choosing. Prefer the path that produces a
trustworthy conclusion with proportionate cost, safety, and effort.

**Complete when:** there is a preferred path, its limitations are understood,
and a weaker or stronger alternative is available if circumstances change.

## Verification budget

At the final state, state the distinct claims, assign one owner to establish
or refute each, and choose the minimum non-duplicative evidence that covers
the claims and important boundaries. Reuse evidence only while its relevant
code, inputs, environment, and state remain valid. Required repository and
release checks still apply; broaden or repeat verification only when a stated
condition justifies it.

Budget rules:

- **Distinct claims.** Split the deliverable into claims that can fail
  independently; a bundled claim cannot be partially established.
- **One owner per claim.** Exactly one piece of evidence is responsible for
  establishing or refuting each claim. No claim rests on "a bit of
  everything".
- **Minimum non-duplicative evidence.** Cover each claim and each important
  boundary once. Duplicated evidence adds cost, not truth.
- **Reuse is conditional.** Existing evidence counts only while its relevant
  code, inputs, environment, and state remain valid. Anything touched on
  those axes invalidates it.
- **Baseline still applies.** Required repository and release checks are not
  optional; broaden or repeat verification only when a stated condition
  justifies it.

## 3. Create a verification affordance when needed

When the existing system leaves the decisive truth too indirect or ambiguous,
extend the evidence path with a **verification affordance**: the smallest
capability that makes the relevant state controllable, observable, repeatable,
and diagnosable for an agent.

Ask what capability would let an agent establish the claim directly, repeat
the scenario from a known state, and explain a failure without inference.
Prefer an affordance that strengthens directness, determinism,
agent-legibility, isolation, resetability, or future reuse.

Treat the affordance as part of the evidence path, not an automatic product
feature. **Lifecycle — decide deliberately before building it:**

| Lifecycle | Meaning | Fate |
| --- | --- | --- |
| **Temporary** | Exists only to resolve the current uncertainty | Remove once it has served its purpose |
| **Durable** | Has recurring value for future verification | Retain deliberately; keep it narrow and safe to inspect |

**Complete when:** the chosen path can establish the claim directly enough
for its stakes, and any needed affordance has a defined lifecycle.

## 4. Research when the path is unknown

When the right evidence path depends on an unfamiliar dependency, framework,
external service, or rapidly changing capability, ask a research subagent for
focused research before committing to an approach.

Ask for official or project-specific facilities, constraints, and trade-offs
that affect this exact verification problem. Use existing project evidence
directly when it already resolves the choice.

**Complete when:** the chosen path rests on known capabilities and real
constraints rather than assumption.

## 5. Make the path runnable

Prepare only the support needed to follow the evidence path reliably. Keep the
support narrow, repeatable, and safe to inspect.

Decide whether that support has recurring value or exists only to resolve the
current uncertainty. Retain durable value deliberately; remove temporary
support once it has served its purpose.

Writing support or affordance files, adding dependencies, and running
support that touches shared state all follow the router's confirm-first
engagement rule, which names every gate and how to mark unconfirmed steps.

**Complete when:** the path can be followed without guessing about setup,
state, or interpretation.

## 6. Close the evidence path

After implementation, follow the planned path (under the router's
confirm-first engagement rule) and interpret the resulting evidence against
the original claim.

Report whether the claim was **established**, **limited**, or **refuted**;
distinguish known facts from remaining uncertainty.

**Complete when:** a future reader can see what supports the conclusion and
what remains outside its reach.
