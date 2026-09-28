# Friction signals — the audit walk

What to look for when walking a codebase for deepening candidates (`audit`
mode; `deepen` also loads it to name the signal and deletion-test outcome
when no audit ran). Explore organically — these are signals of friction, not
a checklist to score. Every signal is a hypothesis until the deletion test
confirms it.

Sources: `[Ousterhout]`, `[Fowler]`, `[prática pós-2020]`.

---

## Where to start

Start from change hot spots when git history exists (read-only):
`git log --since=6.months --format= --name-only | sort | uniq -c | sort -rn | head -30`,
optionally cross-checked with fix-commit messages (`git log --oneline --grep=fix`).
Without git history, sample from the entry points. Read the glossary and ADRs
yourself; ask the user only what the code cannot show (test pain, planned
changes, constraints). `[prática pós-2020]`

## Signals

1. **Concept scatter.** Understanding one concept requires bouncing between
   many small modules. Locality is missing: knowledge about one domain rule
   lives in five files, and no module owns the behaviour. Your own friction
   navigating as an agent (many hops/files per concept) is the
   AI-navigability signal; deep, domain-named modules cut those hops.

2. **Shallow modules.** The interface is nearly as complex as the
   implementation — the module hides nothing. Callers must learn (almost) as
   much as the implementer did; there is no leverage. Typical shapes: thin
   wrappers around a framework call, getters/setters clusters, "manager" or
   "helper" modules whose entry points mirror their internals.
   `[Ousterhout]` (ch.4, "Modules Should Be Deep")

3. **Test-driven extraction without locality.** Pure functions extracted just
   for testability, while the real bugs hide in how they're called. The units
   are green and the composition is untested: behaviour moved out of the call
   site into a function that is easy to test and hard to get wrong alone —
   the risk simply relocated. `[prática pós-2020]`

4. **Seam leakage.** Tightly-coupled modules leak across their seams: callers
   depend on what should sit behind the interface (internal types, ordering
   quirks, storage details, config that belongs to the implementation). The
   interface is a fiction; the real contract is spread across callers.

5. **Untested or untestable regions.** Parts of the codebase that are
   untested, or hard to test through their current interface. If tests must
   reach past the interface (mocking internals, asserting on private state),
   the module is the wrong shape — the interface is the test surface
   (`vocabulary.md` §Principles).

## Applying the deletion test to suspects

The formal definition lives in `vocabulary.md` §Principles (one owner per
fact). Application procedure for each suspect:

1. Name the module and its interface as a caller would experience it.
2. Imagine deleting the module outright.
3. Ask: does the complexity **vanish**, **reappear across N callers**, or
   merely **move**? Each outcome sets the candidate's type (the "Tipo" field
   of the candidate list):
   - Complexity vanishes → it was a pass-through (Fowler's middle man at
     module scale `[Fowler]`) → **merge/inline** candidate: fold it into its
     caller or callee so the surviving module gets deeper. Still routed to
     `deepen`. Thin wrappers and mirror-shaped "manager"/"helper" modules
     (signal 2) usually land here.
   - Complexity reappears across N callers → the module was earning its keep;
     if it is currently shallow → **deepen in place** candidate (it already
     owns the behaviour callers would otherwise duplicate; pull more of it
     behind the interface).
   - Complexity merely **moves** sideways (into a sibling module, a helper)
     → not a candidate; name the real owner and examine that instead.
4. Record the outcome, the caller count, and the evidence (`path:line`) —
   the candidate list needs all three.

Do not propose interfaces yet in `audit` mode: candidates first, user picks,
then `deepen` / `interfaces`.

## Severity rubric

Uses only what the audit observes:

- **CRÍTICO** — the friction sits behind recurring defects, or blocks a change
  the user says is planned.
- **ALTO** — concept scatter or seam leakage touching many callers, or core
  behaviour untestable through its interface.
- **MÉDIO** — shallow module with few callers, or friction confined to one
  area.
- **BAIXO** — marginal leverage gain, or a borderline deletion-test result.

List candidates by severity; break ties by change frequency (hot spots above).
