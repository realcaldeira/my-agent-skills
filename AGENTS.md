# Working on this repo

Agent-skills collection. Before editing anything under `skills/`:

- Read [CONVENTIONS.md](CONVENTIONS.md) — it is the authoring contract.
- Keep each `SKILL.md` ≤ 150 lines; every command in the input table maps to
  a mode; one template per mode, each with a Definition of Done.
- Bump `metadata.version` on any behavioral change and add a line to
  [CHANGELOG.md](CHANGELOG.md).
- Run `node scripts/validate-skills.mjs` (0 errors) and the skill's own tests
  (`node --test skills/codemap/scripts/`, `python3 -m unittest` in
  `skills/fact-check/scripts/`, `bash skills/security-audit/scripts/test-security-surface.sh`).
- Ported skills keep their `NOTICE.md`; never copy text from sources without
  a license.
- Commit messages carry no AI attribution lines.
