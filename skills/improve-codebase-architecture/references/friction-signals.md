# Friction signals — the audit walk

What to look for when walking a codebase for deepening candidates (`audit`
mode). Explore organically — these are signals of friction, not a checklist to
score. Every signal is a hypothesis until the deletion test confirms it.

Sources: `[Ousterhout]`, `[Feathers]`, `[Fowler]`, `[prática pós-2020]`.

---

## Signals

1. **Concept scatter.** Understanding one concept requires bouncing between
   many small modules. Locality is missing: knowledge about one domain rule
   lives in five files, and no module owns the behaviour.

2. **Shallow modules.** The interface is nearly as complex as the
   implementation — the module hides nothing. Callers must learn (almost) as
   much as the implementer did; there is no leverage. Typical shapes: thin
   wrappers around a framework call, getters/setters clusters, "manager" or
   "helper" modules whose entry points mirror their internals.

3. **Test-driven extraction without locality.** Pure functions extracted just
   for testability, while the real bugs hide in how they're called. The units
   are green and the composition is untested: behaviour moved out of the call
   site into a function that is easy to test and hard to get wrong alone —
   the risk simply relocated. `[Feathers]`

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
3. Ask: does the complexity **vanish**, or does it **reappear across N
   callers**?
   - Complexity vanishes → it was a pass-through (Fowler's middle man at
     module scale `[Fowler]`) — candidate for removal or merge, not for
     deepening.
   - Complexity reappears across N callers → the module was earning its keep;
     if it is currently shallow, it is a **deepening candidate** (it already
     owns the behaviour callers would otherwise duplicate).
   - Complexity merely **moves** sideways (into a sibling module, a helper)
     → not yet a candidate; the real owner is elsewhere.
4. Record the caller count and the evidence (`path:line`) — the candidate
   list needs both.

Do not propose interfaces yet in `audit` mode: candidates first, user picks,
then `deepen` / `interfaces`.
