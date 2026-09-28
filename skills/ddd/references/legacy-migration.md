# Legacy → DDD migration

Sources: `[Fowler]` (strangler fig), `[Evans Reference]` (ACL),
`[Evans Legacy 2013]` (bubble context), `[Distilled ch.7]` (modeling debt).

The rule: **never rewrite from scratch, never boil the ocean.** Migrate by
growing new, well-modeled contexts around the legacy and strangling it
incrementally.

---

## Core moves

### Strangler fig `[Fowler]`

New functionality grows behind a façade at the legacy edge; traffic shifts
feature by feature; the legacy shrinks until it can be switched off.

Steps: intercept → implement beside → route gradually → decommission.
Keep each step shippable and reversible.

### Bubble context `[Evans Legacy 2013]`

A small new bounded context with its own model, wrapped in an ACL so the
legacy language never leaks in (or out). Ideal for the first pilot: one hot
subdomain, small team, real users.

### Anti-Corruption Layer `[Evans Reference]`

Translation between legacy model and new model. Place it on *your* side of
the integration. Both directions when the legacy also must call back.

### Branch by abstraction / parallel run

Introduce an abstraction over the legacy component, implement the new one
behind it, switch traffic with a flag, compare outputs (dual write or
shadow-read) before cutover.

## Phasing plan for a spec

**Phase 0 — Understand (1–4 weeks).** Event storming on the as-is domain;
identify core vs. supporting; find the pain hot spots; write the domain
vision. Do not touch code.

**Phase 1 — Pilot bubble (1–2 months).** Pick one hot, well-bounded subdomain.
Create the bubble context with ACL, one aggregate, real deployment. Learn the
organization's constraints (DB, release, compliance).

**Phase 2 — Expand along value.** Repeat for the next core subdomain. Build
the context map as you go. Introduce outbox/event integration between new
contexts and legacy where dual writes threaten consistency.

**Phase 3 — Strangle.** Route more traffic to new contexts; freeze legacy
features; migrate data with careful reconciliation (not one big migration).

**Phase 4 — Decommission.** Remove legacy modules only when no consumer
remains; keep the data archive readable.

## Data migration rules

- New contexts own new stores; do not share the legacy tables as their model.
- Dual-write with a reconciliation job when cutover is not atomic; report
  drift as a first-class dashboard.
- Migrate data per bounded context, not per table.
- Keep IDs stable across the cut (map old keys to new identities explicitly).

## Choosing the first candidate

Ideal pilot: high business pain + small scope + clear language + an engaged
expert + low compliance risk. Avoid: the billing core of a bank, a shared
"Customer" god module, anything with 20 upstream integrations.

## What to tell the organization

- Delivery continues throughout; no big-bang freeze.
- Every phase ships something the business can see.
- Modeling debt from shortcuts is fine if tracked explicitly
  (`glossary.md` — Modeling Debt).

## Spec checklist

- [ ] As-is domain events documented?
- [ ] Core domain identified and prioritized?
- [ ] Pilot bubble chosen with justification?
- [ ] ACL/integration strategy per legacy seam?
- [ ] Data ownership and reconciliation plan?
- [ ] Phase gates with rollback points?
- [ ] First increment sized to one sprint?
