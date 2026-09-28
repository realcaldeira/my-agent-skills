# Evidence path

The core object of this skill and the substance of all six steps. Loaded for
every mode: Plan runs steps 1–5 plus the budget; Close runs the budget rules
and step 6; Teach uses the sections the router's concept lookup names. A short
illustrative run of all six steps is in `references/worked-example.md`.

---

## The evidence path

Before changing a non-trivial system, build an **evidence path**: a
project-specific route from the claim being made to evidence that can
establish, limit, or refute it.

The purpose is not to select a familiar technique. The purpose is to decide
how this system can reveal the truth of this particular change.

Proportionality and the small-change early exit are owned by the router. For
larger multi-phase work, this skill establishes the evidence path that later
work follows.

**Related vocabulary:**

| Term | Meaning |
| --- | --- |
| **claim** | The behavior that needs to become true, stated so it can be established, limited, or refuted |
| **evidence** | An observation of the [sistema sob análise] that bears on a claim |
| **evidence owner** | The single piece of evidence responsible for establishing or refuting one claim |
| **failure signal** | What the evidence owner would observably show if its claim were false |
| **verification affordance** | The smallest capability that makes relevant state controllable, observable, repeatable, and diagnosable for an agent (step 3) |
| **verification budget** | The minimum non-duplicative evidence set covering the claims and important boundaries (below) |

## 1. Frame the claim

State the behavior that needs to become true and the conditions that could
make a confident conclusion wrong.

Consider what must change, what must remain true, where the behavior crosses a
boundary, and which failure would matter most. Keep one headline sentence,
then split it into distinct claims C1..Cn (budget rules).

**Complete when:** the claim, its meaningful uncertainty, and its important
failure modes are concrete enough to investigate.

## 2. Design the evidence path

Start from the verification surface the repository already has: tests near
the changed code, the CI/test/lint/typecheck commands, and the available
environments. Cite each with `file:line`; this is also where the required
baseline checks come from.

Derive possible evidence paths from the system itself: its controllable
inputs, observable effects, state transitions, invariants, boundaries,
artifacts, and ability to repeat or reverse a scenario.

Generate alternatives before choosing. If the alternatives depend on
unfamiliar capabilities, do step 4 before choosing. Prefer the path that
produces a trustworthy conclusion with proportionate cost, safety, and effort.

**Complete when:** there is a preferred path, its limitations are understood,
and a weaker or stronger alternative is available if circumstances change.

## Verification budget

Once the preferred path is chosen, apply these rules to the change's intended
end state:

- **Distinct claims.** Split the deliverable into claims that can fail
  independently; a bundled claim cannot be partially established. Number
  them C1..Cn: the plan's evidence table, its budget, and the close report
  use the same IDs.
- **One owner per claim.** Exactly one piece of evidence is responsible for
  establishing or refuting each claim. No claim rests on "a bit of
  everything".
- **Discriminating evidence.** Each owner states its failure signal. Evidence
  that would pass whether or not the claim holds (a vacuous assertion, a
  check that never reaches the changed code) establishes nothing. For
  bug-fix or regression claims, show that the owner fails without the fix:
  run it before the fix is applied, or against the base commit in a separate
  checkout or worktree (a git operation: confirm first). Never discard,
  stash, or revert the user's uncommitted work to do this. If fail-first is
  not feasible, say why.
- **The check actually ran.** Right target, more than zero tests or cases
  executed, nothing skipped or filtered out. A green run that executed
  nothing is not evidence.
- **Minimum non-duplicative evidence.** Cover each claim and each important
  boundary once. Duplicated evidence adds cost, not truth.
- **Reuse is conditional.** Existing evidence counts only while its relevant
  code, inputs, environment, and state remain valid. Anything touched on
  those axes invalidates it.
- **Baseline still applies.** Required repository and release checks (found
  in step 2) are not optional and get their own budget row; broaden or
  repeat verification only when a stated condition justifies it.

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
focused research before committing to an approach (step 2 waits for it).

Ask for official or project-specific facilities, constraints, and trade-offs
that affect this exact verification problem. Use existing project evidence
directly when it already resolves the choice. Record each conclusion with its
source (`[doc oficial: <URL>]` or `[specs/docs do projeto]`) in the plan.

**Complete when:** the chosen path rests on known capabilities and real
constraints rather than assumption.

## 5. Make the path runnable

Prepare only the support needed to follow the evidence path reliably — tests,
fixtures, scripts, affordances — never the product change itself. Keep the
support narrow, repeatable, and safe to inspect. Apply the step-3
temporary/durable lifecycle to any support built here, not only to
affordances.

Writing support or affordance files, adding dependencies, and running
support that touches shared state all follow the router's confirm-first
engagement rule, which names every gate and how to mark unconfirmed steps.
Support the user has not approved yet is specified in the plan, not built;
close builds it first (step 6).

Record how to run the path: preconditions and initial state, exact commands,
where to observe (`file:line`, log, query), how to interpret each result per
claim, and how to reset.

**Complete when:** the path can be followed without guessing about setup,
state, or interpretation.

## 6. Close the evidence path

Find the plan first, in this order: a path given as the argument → this
conversation → `.agent/verification/`. Name the source in the report. If no
plan exists, say so, reconstruct the claims C1..Cn from the diff and the
user's intent, and get the user to confirm them **before** running any
evidence; mark the report *fechamento retroativo*. Judge its outcomes by the
normal rules: the risk of a retroactive close is claims framed to fit the
evidence, which the up-front confirmation guards against.

After implementation, build any support the plan specified but did not build
(confirm-first), then follow the planned path (under the router's
confirm-first engagement rule) and interpret the resulting evidence against
the original claims. Record deviations: evidence swapped for an alternative
path, and reused evidence whose reuse condition the implementation broke
(re-run it or treat it as missing).

Report whether each claim was **established**, **limited**, or **refuted**;
distinguish known facts from remaining uncertainty. An owner whose
discrimination was not shown (no fail-first, no observed failure signal, or
no proof it executed) gives at most **limited**, with the reason.

**Complete when:** a future reader can see what supports the conclusion and
what remains outside its reach.
