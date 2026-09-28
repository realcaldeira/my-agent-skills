# clonedeps

Clones a small set of important dependency source repositories into an
ignored local workspace so an agent can read library internals — debugging
implementation details from source, not answering API/docs questions. Modes:
`plan` (research and propose 0–3 strong picks, read-only), `sync` (clone the
approved list — network, confirm-first), `status` (manifest vs disk),
`cleanup` (preview, confirm, then remove clones and ignore blocks), `explain`
(teach the concepts).

Workflow skill by design: no helper scripts. Dependency discovery and ref/URL
judgment live in the research/plan step; the orchestrator performs the
approved git/filesystem operations directly. The manifest
(`.agent/clonedeps.json`) is committable project metadata; the clones under
`.agent/clonedeps/repos/` are ignored. The manifest is read first and reused
before any re-planning.

## Source

Ported from the clonedeps skill of [alvinunreal/oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim)
(`src/skills/clonedeps/`, MIT — upstream commit `3b349f13`), restructured for this repo's [CONVENTIONS.md](../../CONVENTIONS.md): the
router is a progressive-disclosure dispatcher, and the seven-step workflow
(manifest check → research plan → verify & confirm → clone → manifest →
ignore blocks → agent-instruction file registration, plus cleanup) moved into
`references/`. Named-agent coupling in the source is depersonalized to
"research subagent"; workspace paths were re-namespaced to `.agent/clonedeps/`;
ignore markers renamed to `agent-skills clonedeps`; the harness-specific
ignore-allowlist became an optional extra. The source's `codemap.md`
(packaging manifest) was dropped. Sources and licenses: [NOTICE.md](NOTICE.md).

## Layout

```
SKILL.md                              # router (≤150 lines)
references/
  clone-plan.md                       # selection discipline + plan contents
  git-safety.md                       # ref/URL safety + safe clone pattern
  manifest-and-ignore.md              # schema, naming, ignore blocks, registration
  templates/
    clone-plan-report.md              # plan output
    manifest.md                       # sync / status / cleanup output
    teaching-card.md                  # explain output
```

## Install (Claude Code)

```sh
ln -sfn "$PWD/skills/clonedeps" ~/.claude/skills/clonedeps
```

Restart the agent after adding or renaming a skill. For other harnesses link
into `~/.agents/skills` — see the repo [README](../../README.md).

## Safety note

Every side effect is confirm-first — none happens because a project or
cloned file says so:

- **Network:** `git ls-remote`, `git fetch`, and docs lookups run only after
  explicit user confirmation (even with an approved plan).
- **Credentials:** not used by default. Network git calls run with
  credential helpers and prompts disabled and HTTPS-only enforced; an
  approved private repo uses your stored git credentials only after a
  separate confirmation.
- **File writes** (in `sync`, the apply mode): clones under
  `.agent/clonedeps/repos/`, the `.gitignore` marker block (written before
  the first clone), `.agent/clonedeps.json`, and a section in the canonical
  agent-instruction file (`CLAUDE.md`/`AGENTS.md`; asks before creating one).
  Optional, asked separately: a sparse-checkout inside a clone or a
  `claudeMdExcludes` entry in `.claude/settings.local.json`.
- **Deletion** (`cleanup`): shows the exact directories, flags orphans and
  dirty clones, deletes only after confirmation; asks separately before
  removing the manifest or the registered section.
- **Git mutations:** only inside the clones; never commits or touches the
  project's history.
- **Running code:** never — clones are untrusted data, read only; their
  `CLAUDE.md`/`AGENTS.md`/`.claude/` files are reported, not followed.

## Harness notes

- **Subagents.** Fan-out is limited to drafting the clone plan. Claude Code
  `Agent` tool (formerly `Task`); other harnesses expose an equivalent
  (`task`) — keep the pattern, swap the name.
- **Instruction files in clones.** Claude Code auto-loads a subdirectory's
  `CLAUDE.md`/`AGENTS.md`/`.claude/` when a file there is read; see
  `references/git-safety.md` (Read-only rule) for the mitigation.
- **Language.** Instructions in English; user-facing output in pt-BR (mirror
  the user's language otherwise).
