# agent-skills

Personal agent skills repository. One directory per skill, each with a `SKILL.md`
router and (optionally) a `references/` folder holding progressive-disclosure
knowledge and output templates.

## Layout

```
skills/<skill-name>/SKILL.md        # router: mission, modes, routing table
skills/<skill-name>/references/     # knowledge loaded on demand
skills/<skill-name>/references/templates/  # output templates per mode
skills/<skill-name>/scripts/        # optional helper scripts
```

State artifacts produced by skills during use live under `.agent/` in the target
project (manifests, worktrees, cloned dependency sources) — each skill documents
its own files and ignore rules.

## Install (Claude Code)

```sh
ln -sfn "$PWD/skills/<skill>" ~/.claude/skills/<skill>
```

Restart the agent after adding or renaming a skill. For other harnesses, link
into `~/.agents/skills` — Codex reads it as its user root and OpenCode reads
both `~/.claude/skills` and `~/.agents/skills`. Do not also link into
`~/.codex/skills` or `~/.config/opencode/skills`: the same skill under two
roots shows up twice (Codex) or logs duplicate-name warnings (OpenCode).
Install every skill at once:

```sh
for s in "$PWD"/skills/*; do
  for h in ~/.claude/skills ~/.agents/skills; do
    mkdir -p "$h" && ln -sfn "$s" "$h/$(basename "$s")"
  done
done
```

If your Codex build does not discover `~/.agents/skills`, use
`~/.codex/skills` instead of it (never both).

## Language convention

Instructions (`SKILL.md`, `references/`) are written in **English** — models
follow routing and constraints more reliably this way. All user-facing output
(reports, plans, explanations) is produced in **pt-BR** unless the user asks
otherwise. Canonical technical terms stay in English (bounded context, aggregate,
value object) with the Portuguese equivalent on first use.

## Skills

| Skill | Purpose |
| --- | --- |
| [ddd](skills/ddd/SKILL.md) | DDD consultant: codebase audits, strategic design, legacy→DDD migration specs, concept teaching |
| [security-audit](skills/security-audit/SKILL.md) | Threat modeling + evidence-backed security audit: surface inventory, 12 boundary audit, adversarial verification, findings discipline |
| [github-audit](skills/github-audit/SKILL.md) | GitHub pipeline: PR audit, issue triage, post-merge audit, and approved-ticket resolution (4 modes, read-only judgment vs. mutating resolve) |
| [simplify](skills/simplify/SKILL.md) | Behavior-preserving simplification: clarity over cleverness, project conventions, incremental apply + verification |
| [improve-codebase-architecture](skills/improve-codebase-architecture/SKILL.md) | Module design: shallow→deep module candidates, deletion test, seam/adapter discipline, interface exploration |
| [verification-planning](skills/verification-planning/SKILL.md) | Evidence paths before non-trivial work: claims, verification budget, affordances, close-the-loop reporting |
| [worktrees](skills/worktrees/SKILL.md) | Git worktrees as isolated lanes for risky/parallel work: plan, open, integrate, cleanup — user-confirmed mutations |
| [codemap](skills/codemap/SKILL.md) | Hierarchical repo codemaps (per-folder `codemap.md` + root atlas) for unfamiliar codebases |
| [clonedeps](skills/clonedeps/SKILL.md) | Clone a small set of dependency sources locally (pinned, ignored workspace) to inspect library internals |
| [humanizer](skills/humanizer/SKILL.md) | Rewrite AI-sounding prose to sound like the writer — 25 patterns, fact-preservation contract |
| [fact-check](skills/fact-check/SKILL.md) | Adversarial pre-publish fact-checking: two-pass claim verification against primary sources, S1–S6 severity, opinion-safe fixes |

## Harness notes

- **Subagent fan-out**: skills describe a portable pattern ("spawn a subagent,
  consolidate the result"). Concrete tool names differ — Claude Code uses the
  `Agent` tool (named `Task` before v2.1.63; `Explore` / `general-purpose`);
  other harnesses expose an equivalent (`task`, etc.). Skills carry a one-line
  harness note; swap the name.
- **GitHub CLI**: `github-audit` uses `gh` (authenticated). JSON field lists can
  drift across `gh` versions — fall back to plain `gh pr view` / API equivalents.
- **Scripts**: `security-audit/scripts/security-surface.sh` needs `bash` + `rg`
  (ripgrep); `git` optional; on Windows use WSL/Git-Bash.
  `codemap/scripts/codemap.mjs` needs Node ≥ 18 (tests: `node --test`).
  `fact-check/scripts/*.py` need Python ≥ 3.9 and only run in the optional
  headless-CLI mode.
- **Invocation**: each SKILL.md names its helpers as
  `${CLAUDE_SKILL_DIR}/scripts/…` (Claude Code substitutes the variable inside
  SKILL.md); other harnesses resolve `scripts/` against the directory that
  contains SKILL.md.

## Authoring rules

See [CONVENTIONS.md](CONVENTIONS.md) for the skill-authoring playbook
(frontmatter, routing table, progressive disclosure, fan-out, citation
discipline, anti-hallucination, safety, definition of done). Validate every
change with:

```sh
node scripts/validate-skills.mjs
```

## Provenance and attribution

`ddd`, `fact-check`, `github-audit`, and `security-audit` are original to this
repo (the last three were written independently; their overall idea was
inspired by skills in [akitaonrails/my-skills](https://github.com/akitaonrails/my-skills),
but no text or code from it is reused). The other seven are ports of
MIT-licensed skills; each carries a `NOTICE.md` with its source and the full
upstream license text.

| Skill | Origin | License of upstream portions |
| --- | --- | --- |
| `clonedeps` | port of [alvinunreal/oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim) `src/skills/clonedeps/` | MIT |
| `codemap` | port of [alvinunreal/oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim) `src/skills/codemap/` | MIT |
| `ddd` | original | — |
| `fact-check` | original | — |
| `github-audit` | original | — |
| `humanizer` | port of [blader/humanizer](https://github.com/blader/humanizer); patterns based on Wikipedia's "Signs of AI writing" | MIT |
| `improve-codebase-architecture` | port of [mattpocock/skills](https://github.com/mattpocock/skills) | MIT |
| `security-audit` | original; methodology partly adapted from [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill) | MIT (Cloudflare portions) |
| `simplify` | port of [alvinunreal/oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim) `src/skills/simplify/`, itself adapted from [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | MIT |
| `verification-planning` | port of [alvinunreal/oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim) `src/skills/verification-planning/` | MIT |
| `worktrees` | port of [alvinunreal/oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim) `src/skills/worktrees/` | MIT |

Everything not covered by an upstream license is under the root
[LICENSE](LICENSE). `ddd` and `improve-codebase-architecture` cite Evans,
Vernon, Fowler, Ousterhout, and Feathers per skill.
