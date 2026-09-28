# Changelog, versioning, and release sequencing

Owner of: when changelog rules apply, the documentation-surface ledger,
changelog placement and its two hidden hazards, the semver decision, and
the order of merge → release → tag.

## When this applies

Only when `[trusted instructions]` require a changelog or release notes.
Internal or test-only changes are exempt only if that policy says so.

Landing a fix and releasing it are two different decisions. Cutting a release is
always its own explicit request from the user.

## Documentation-surface ledger

Build it from the **code diff**, never from PR prose. Surfaces to list: new
or changed features, fixes, defaults, flags, config and env fields,
providers, platforms, agents, tools or endpoints, public APIs, schemas,
migrations, install or deploy steps, security behavior.

For each surface, find every authoritative place that documents it (README
tables, examples, config and architecture references, platform docs,
decision records, security guidance, contributor docs — whichever exist)
and mark it complete, stale, or missing.

## Placement

- New entries go under the pending heading (usually `Unreleased`), in the
  category that matches their impact: fixes → Fixed; additions → Added;
  breaks → Changed or a Breaking section. The category later decides the
  version, so a break must be flagged as one or it will not force a major.
- Also check dates, tense, compare links, referenced issue and PR numbers,
  the chosen section and category, and the resulting version
  recommendation.

## Two hazards a "headings are unique" check misses

1. **Stranded entry.** A PR written before the last release put its bullet
   where `Unreleased` used to be. Merging main back into it can succeed
   without any conflict and leave the bullet inside an already-released
   section, falsely implying it shipped there. Verify each new bullet sits
   under the pending heading.
2. **Merge leftovers.** Automatic conflict resolution can leave diff3
   ancestor markers (`|||||||`) and duplicated bullets. Run
   `git diff --check` (or the repo's equivalent) on the changelog.

## Version from the diff

| Highest-impact change in the range | Bump |
| --- | --- |
| Fixes only | patch |
| Any new surface (endpoint, option, integration, provider) | minor |
| Any break (removed surface; changed public CLI, API, or wire contract; on-disk format) | major |

Name the single entry that forces the bump.

**Below 1.0.** Follow the project's stated 0.x policy if it has one.
Otherwise apply the common convention — breaking → minor, additive or fix →
patch — and say in the report which convention you applied.

## Sequencing

- "Resolve and push" ends with the fixes on mainline and CI green. Bumping,
  tagging, and deploying need a separate request.
- **Urgent fix while mainline holds unreleased features:** land the fix on
  mainline first; branch from the latest release tag; cherry-pick the fix;
  tag a patch from that branch; leave the branch idle. Prefer this narrow
  backport over permanent release branches.
- **Mixed batch:** split tickets by impact into a fixes release and a
  features release instead of shipping one bundle in arrival order.
- **Before any tag:** the full cross-platform / cross-target matrix is green
  on the exact candidate SHA, not just the faster merge subset. A red matrix
  is a real finding: fix it and cut a new candidate.
- **When the user orders a release:** deploy the audited commit, verify live
  behavior plus health and rollback signals, then create and push the tag.
  Published history and tags are never rewritten.
