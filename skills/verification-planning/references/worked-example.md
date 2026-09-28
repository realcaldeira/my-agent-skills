# Worked example (illustrative)

**Illustrative only** — a fictional system. Never copy its claims, commands,
or paths into a real plan; derive those from the [sistema sob análise].
Loaded by Teach (source for the card's example) and by Plan only when the user
asks for an example. Steps refer to `references/evidence-path.md`.

## The change

Bug fix: after a price edit in the catalog service, the storefront service
keeps serving the old price from its cache for up to 10 minutes. The fix
publishes an invalidation event after the price write commits; the storefront
evicts the cached entry when the event arrives.

## Step 1 — claims

Headline: a price edit is visible on the storefront within 5 s.

- **C1** — a committed price update publishes exactly one invalidation event
  carrying the product id.
- **C2** — the storefront evicts the cached entry for that id on the event.
- **C3** (must stay true) — cached entries for other products are untouched.

Failure that matters most: the event is published before the write commits,
so the storefront re-caches the old price.

## Step 2 — surface, path, alternative

Surface found: catalog unit tests next to the price handler; the project's
test and lint commands in CI; a local multi-service stack with a broker.
Preferred path: C1 by a catalog unit test on the published event; C2 by an
end-to-end run on the local stack (edit the price, read the storefront).
Alternative: unit tests on both sides only — cheaper, blind to the
commit-then-publish ordering; revisit if the local stack is unavailable.

## Budget

| Cn | Owner | Failure signal / fail-first | Reuse condition |
| --- | --- | --- | --- |
| C1 | new unit test on the price handler | no event; failed on the base code before the fix | handler or event schema changes |
| C2 | e2e run: edit price, read storefront at t+5 s | old price at t+5 s | broker config or cache code changes |
| C3 | existing storefront cache tests | a hit for another id misses | cache-key code changes |
| Baseline | project test + lint commands | any failure | re-run after every change |

## Step 3 — affordance

The storefront does not show whether a response came from cache. Temporary
affordance: a debug log line `cache evict id=<id>` in the event handler,
removed after close by a targeted edit of that line.

## Step 5 — runnable

Preconditions: local stack up; product 42 read once so it is cached. Run:
edit the price, read the storefront at t+1 s and t+5 s. Interpret: new price
at t+5 s plus the evict log line → C2 holds. Reset: tear down the local stack
and its volumes.

## Step 6 — close

- C1 **ESTABELECIDA** — the test failed before the fix, passes after it
  (1 executed, 0 skipped).
- C2 **LIMITADA** — new price at t+5 s and eviction logged, but the
  commit/publish race was never forced; forcing it needs a delay hook
  (next step).
- C3 **ESTABELECIDA** — existing cache tests pass; they cover other ids.

Deviations: none. Affordance: log line removed.
