# Changelog

Per-skill versions live in each `SKILL.md` (`metadata.version`). Newest first.

## 2026-09-28

- Round-2 content fixes (1.2.0): ddd, humanizer, improve-codebase-architecture,
  verification-planning, codemap, clonedeps, worktrees, simplify.
- Repo: `AGENTS.md`/`CLAUDE.md` pointer to CONVENTIONS, routing evals
  (`evals/routing.json`, `scripts/check-routing.mjs`), `.gitignore` keeps skill
  docs tracked and ignores personal config, CONVENTIONS §6–§8/§10 aligned with
  practice.

## 2026-09-27

- fact-check, github-audit, security-audit 2.0.0: rewritten from scratch as
  original work.
- All other ported skills 1.1.0: licensing notices (`NOTICE.md`), script fixes
  with regression tests (codemap, security scanner, fact-check dispatcher),
  untrusted-input rule, confirm-first gates, "Not for" routing clauses,
  empty-input inference, `Agent` tool naming.
- `scripts/validate-skills.mjs` added; root `LICENSE` (MIT) for original work.
