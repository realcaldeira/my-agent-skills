# Git safety — the confirmation gate

Sources: `[git docs]`, `[repo policy]`, `[prática pós-2020]`. The lane
protocol (phases, manifest, ownership) lives in `lane-protocol.md`; this file
owns one fact: **every git mutation needs explicit user confirmation, and no
mutation ever surprises the user with dirty state.**

---

## Mandatory user confirmation

Seek explicit user confirmation before executing ANY of the following — for
that exact operation, not a blanket "may I work on this repo":

- `git worktree add`, `git worktree remove`, `git worktree move`,
  `git worktree repair`
- Branch creation, deletion, or renaming
- Merges, rebases, or cherry-picks
- `git worktree prune` — only when `git worktree list --porcelain` shows a
  `prunable` entry
- Destructive commands: `git reset` (especially `--hard`), `git clean`,
  `git checkout -- <path>`, `git restore` over uncommitted work,
  `git push --force` / `--force-with-lease`, or removing a dirty worktree
  directory outside git
- Any commit (the router's non-negotiable #4: only when the user asked or
  approved)

This list is illustrative, not exhaustive: any command that changes refs,
the index, the working tree, the stash, config, or a remote needs
confirmation, including plain `git push`, `git fetch`, `git switch` /
`git checkout <branch>`, `git stash push`, `git tag`, and
`git worktree lock` / `unlock`.

Never propose `git prune` or `git gc --prune=now`: lanes never need them
(`git worktree remove` already cleans worktree metadata), and after a lane's
worktree and branch are gone they destroy the last recoverable copy of its
commits. Out of scope for this skill.

Read-only observation needs no confirmation: `git status`, `git diff`,
`git log`, `git show`, `git worktree list`, `git branch --list/-a`,
`git branch --show-current`, `git rev-parse`, `git merge-base`, and
`git stash list`. Network calls are not observation: `git ls-remote`,
`git fetch`, and `git push` reach the remote with the user's credentials and
run only after confirmation.

## Confirmation format

Before a mutation, state and wait for a yes:

1. The exact command(s) to run.
2. The target path/branch and the expected effect.
3. What is reversible and what is not.

One confirmation covers one stated operation. Re-confirm if the command,
target, or scope changes.

## Working-tree preconditions

Observe (via git command output, never memory) before any mutation:

- Current branch and the intended base branch.
- `git status --porcelain` — the dirty/uncommitted state of the checkout the
  mutation will touch (main checkout for integration; the lane for
  lane-local work).
- `git worktree list` — for worktree-affecting operations.
- The main worktree root (first `worktree` line of
  `git worktree list --porcelain`) — every lane and manifest path is anchored
  to it (`lane-protocol.md`, pre-flight step 1).

If the observed state contradicts the plan (wrong branch, unexpected dirty
files, branch already exists), stop and report — do not "fix" it silently.

## Never a dirty-state surprise

- Never discard, stash, overwrite, or remove uncommitted changes without an
  explicit approval for that exact effect.
- Never remove a worktree that has uncommitted changes; report the file list
  from `git status` and ask how to proceed (commit, stash, archive, or
  approved discard).
- After every mutation, re-observe `git status` (and `git worktree list`
  when relevant) and report the actual post-state.
- When in doubt, leave the tree untouched and ask.

## Lane-specific guards

- The lane path must be `<main-root>/.agent/worktrees/<slug>/` (protocol
  non-negotiable #2). Refuse sibling-directory worktrees unless the user
  explicitly overrides, and never create a lane relative to a subdirectory or
  from inside another lane.
- Ignore-block edits follow `lane-protocol.md`: managed block in place,
  missing lines only. Show the exact diff and wait for confirmation before
  writing it — in `.gitignore` it modifies a tracked file in the main
  checkout; the local-only alternative is `info/exclude`.
- Worktrees under `.claude/worktrees/` (Claude Code's built-in worktree
  support) are foreign: never remove or move them. `git worktree prune`
  drops every stale entry at once, so name any foreign `prunable` entry in
  the confirmation before proposing it.
- Branch deletion after integration: prefer `git branch -d` (refuses
  unmerged work). `git branch -D` is destructive and needs its own explicit
  approval.

## Anti-hallucination

Per the router's citation rules: never report a branch, worktree, or
working-tree state you have not seen in git command output this session. If
you have not observed it, say `[estado não verificado]` and run the command
first.
