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

## Install (Claude Code)

```sh
ln -s "$PWD/skills/ddd" ~/.claude/skills/ddd
```

Claude Code reads `SKILL.md` at startup — restart the agent after adding or
renaming a skill. To share with other harnesses, symlink the same directory
into `~/.codex/skills`, `~/.config/opencode/skills`, `~/.agents/skills`, etc.

## Language convention

Instructions (`SKILL.md`, `references/`) are written in **English** — models
follow routing and constraints more reliably this way. All user-facing output
(reports, plans, explanations) is produced in **pt-BR** unless the user asks
otherwise. Canonical DDD terms stay in English (bounded context, aggregate,
value object) with the Portuguese equivalent on first use.

## Skills

| Skill | Purpose |
| --- | --- |
| [ddd](skills/ddd/SKILL.md) | DDD consultant: codebase audits, strategic design, legacy→DDD migration specs, concept teaching |

## Authoring rules

See [CONVENTIONS.md](CONVENTIONS.md) for the skill-authoring playbook
(frontmatter, routing table, progressive disclosure, fan-out, citation
discipline, anti-hallucination, definition of done).
