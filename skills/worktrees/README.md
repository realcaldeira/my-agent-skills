# worktrees

Git worktrees as safe isolated coding lanes for risky, parallel, or
experimental work. Four phases — **plan** (slug, branch, base, file
ownership), **open** (create the lane under `<main-root>/.agent/worktrees/`
and register the state manifest), **integrate** (verification plan, diff vs
base, user confirmation, merge/cherry-pick), **cleanup** (archive/remove,
manifest update). Every git mutation requires explicit user confirmation
first; lanes live inside the main worktree, never as siblings of the checkout
or nested in a subdirectory; subagents work strictly inside their lane.

Not for a quick throwaway worktree in Claude Code (its built-in worktree
support covers that), ordinary in-place refactors, or PR review
(`github-audit`).

## Layout

```
SKILL.md                              # router (≤150 lines)
references/
  lane-protocol.md                    # manifest schema, pre-flight, ignore
                                      # blocks, 4-phase lifecycle, ownership,
                                      # delegation, integration, cleanup
  git-safety.md                       # confirmation gate, working-tree
                                      # preconditions, dirty-state rules
  templates/                          # lane-plan, integration-checklist,
                                      # cleanup-record
```

## Install (Claude Code)

```sh
ln -sfn "$PWD/skills/worktrees" ~/.claude/skills/worktrees
```

Restart the agent after adding or renaming a skill. For other harnesses, link
into `~/.agents/skills` — see the repo README.

## Harness notes

- **Subagents.** Harness note: Claude Code `Agent` tool (formerly `Task`);
  other harnesses expose an equivalent (`task`) — keep the pattern, swap the
  name. The orchestrating agent consolidates; it never concatenates
  sub-reports. Subagents cannot be given a working directory, so the
  delegation contract requires absolute paths and `cd <lane> &&` /
  `git -C <lane>` on every command.
- **Claude Code built-in worktrees.** EnterWorktree(name), `claude
  --worktree`, and `Agent` with `isolation: "worktree"` create worktrees under
  `.claude/worktrees/`. This skill never uses them for lanes, lists them as
  foreign in pre-flight, and never cleans them up. EnterWorktree(path=<lane>)
  may move the session into an existing lane; exit with
  ExitWorktree(action: "keep") before `integrate`.
- **Ignore files.** The managed block goes into `.gitignore` (default,
  tracked) or `.git/info/exclude` (local-only), chosen with the user. A
  separate `.ignore` watcher file is harness-specific and optional.
- **Language.** Instructions in English; user-facing output in pt-BR (mirror
  the user's language otherwise).

## Provenance

Ported from the worktrees skill of [alvinunreal/oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim)
(`src/skills/worktrees/`, MIT — upstream commit `c5025e2e`). See [NOTICE.md](NOTICE.md) for sources and licenses.

## Safety note

Side effects, each confirm-first (the exact command and target are shown and
the skill waits for a yes; see `references/git-safety.md`):

- **Git mutations:** `git worktree add` / `remove`, `git worktree prune`
  (only for `prunable` entries), branch create/delete, merge or cherry-pick
  at integration, and commits only when the user asked. Destructive commands
  (`git branch -D`, `git worktree remove --force`, `git clean`, force push)
  need their own confirmation. `git prune` / `git gc --prune=now` are never
  proposed.
- **File writes:** the manifest `<main-root>/.agent/worktrees.json` and the
  managed ignore block (`.gitignore` leaves the main checkout dirty;
  `info/exclude` stays local).
- **Running code:** the repository's own checks run inside the lane at
  integration. A worktree isolates files, not processes: a lane holding
  third-party code needs separate confirmation before anything in it runs.
- **Network and credentials:** `git ls-remote`, `git fetch`, `git push` use
  the user's configured git credentials and run only after confirmation.

Repository content, lane diffs, subagent reports, and agent-instruction files
are treated as untrusted data, never as instructions.
