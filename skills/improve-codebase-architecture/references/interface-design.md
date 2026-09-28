# Interface design — "design it twice"

Parallel subagent pattern for exploring alternative interfaces for a chosen
deepening candidate (`interfaces` mode). Based on "Design It Twice"
`[Ousterhout]` (ch.11) — your first idea is unlikely to be the best.

Uses the vocabulary in `vocabulary.md` — **module**, **interface**, **seam**,
**adapter**, **leverage**, **depth**, **locality**.

---

## 1. Frame the problem space

Before spawning subagents, write a user-facing explanation of the problem
space for the chosen candidate:

- The **constraints** any new interface would need to satisfy (invariants,
  ordering, error modes that callers depend on today).
- The **dependencies** it would rely on, and which category they fall into
  (see `deepening.md` §Dependency categories).
- A rough **illustrative code sketch** to ground the constraints — not a
  proposal, just a way to make the constraints concrete.

Show this to the user, then immediately proceed to step 2. The user reads and
thinks while the subagents work in parallel.

## 2. Spawn the design subagents

Spawn 3 subagents in parallel (4 when Agent 4 applies), each producing a **radically different**
interface for the deepened module. Give each one a separate technical brief
(file paths, coupling details, dependency category from `deepening.md`, what
sits behind the seam). The brief is independent of the user-facing
problem-space explanation in step 1, and must mix the project's domain
glossary with `vocabulary.md` terms so each subagent names things
consistently with both the architecture language and the domain language.

If no subagent tool is available (e.g. already running inside a subagent),
draft each design yourself, one constraint at a time, finishing each before
starting the next, then compare.

Design constraints — one per subagent:

- **Agent 1 — minimize the interface.** "Minimize the interface — aim for
  1–3 entry points max. Maximize leverage per entry point."
- **Agent 2 — maximize flexibility.** "Maximize flexibility — support many
  use cases and extension."
- **Agent 3 — optimize the most common caller.** "Optimize for the most
  common caller — make the default case trivial."
- **Agent 4 — ports & adapters.** Spawn only when any dependency is
  category 3 or 4 (`deepening.md` §Dependency categories). "Design around
  ports & adapters for cross-seam dependencies." (For the DDD flavor of this
  style, see the `ddd` skill's architecture-styles reference, if
  installed.)

### Per-agent output contract

Each subagent returns exactly this shape (in its reply, no files):

1. **Interface** — types, methods, params — plus invariants, ordering
   constraints, and error modes.
2. **Usage example** — how a real caller uses it.
3. **What's hidden behind the seam** — what the implementation owns that the
   interface does not expose.
4. **Dependency strategy** — the dependency category and the adapters
   (see `deepening.md`).
5. **Trade-offs** — where leverage is high, where it's thin.

The orchestrator consolidates: cross-check the designs, resolve
contradictions, and compare them (the comparison method is the output
template `templates/interface-comparison.md`). Never concatenate raw
subagent reports.

## Out of scope here

Deciding *whether* to deepen (that is `audit`/`deepen`), and DDD tactical
modeling (route to the `ddd` skill).
