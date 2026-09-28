# State manifest and change detection

`codemap.mjs` keeps its state in `.agent/codemap.json` at the mapped root.
The manifest freezes the mapping scope and the content hashes that drive
incremental refresh. Folder map content itself is specified in
`content-spec.md`; the root atlas and registration step are in
`root-atlas.md`.

## Files this skill creates (commit policy)

| File | Written by | Commit? |
| --- | --- | --- |
| `<folder>/codemap.md`, root `codemap.md` (atlas) | agent (scaffolded by `init`) | Yes — they are the deliverable |
| `## Repository Map` section in `CLAUDE.md` / `AGENTS.md` | orchestrator | Yes |
| `.agent/codemap.json` | script | Yes — never add it to `.gitignore` |

Commit the manifest together with the maps it describes. It holds only
relative paths, patterns and hashes (no machine-specific path), so every
clone can run `changes`. Without it, a fresh clone has to run `init` again,
which re-baselines against the current tree and hides maps that were already
stale. `last_run` changes on every `update`; that diff lands in the same
commit as the refreshed maps. Never ignore `.agent/` wholesale: other skills
keep committable manifests there too; ignore only their own subfolders
(for example `.agent/worktrees/`). Put this advice in the run report's next
steps; do not commit on the user's behalf.

## Choosing the root

`init [path]` / `update [path]` pass `path` as `--root`. Default: the
repository root (`git rev-parse --show-toplevel`, or the current directory
outside git). `update` must reuse the root that `init` used. When the user
names a subdirectory, ask which they mean:

- **A subtree of this repo** — keep `--root` at the repo root and limit the
  scope with anchored includes (`--include "/<path>/**/*.ts"`). State, atlas
  and registration stay at the repo root.
- **An independent root** (for example one monorepo package) — `--root
  <path>`. State (`<path>/.agent/`), atlas (`<path>/codemap.md`) and, outside
  git, the `.gitignore` that is read all move to `<path>`; the registration
  section must then point to `<path>/codemap.md`.

## Manifest shape

```json
{
  "metadata": {
    "version": "1.1.0",
    "last_run": "2026-09-27T12:00:00.000Z",
    "include_patterns": ["/src/**/*.{ts,tsx}", "package.json"],
    "exclude_patterns": ["**/*.test.ts", "dist/**", "node_modules/**"],
    "exceptions": []
  },
  "file_hashes": {
    "src/index.ts": "9473fdd0d880a43c21b7778d34872157"
  }
}
```

- `metadata.version` — manifest schema version written by the script.
- `metadata.last_run` — ISO timestamp of the last `init`/`update`.
- `metadata.include_patterns` / `exclude_patterns` / `exceptions` — the
  frozen scope. `changes` and `update` reuse these verbatim; they do not take
  new pattern flags.
- `file_hashes` — relative path → md5 of the file's bytes. This is the only
  change-detection data; the diff is computed from it.

Manifests written by version 1.0.0 also carry `metadata.root` (an absolute
path) and `folder_hashes`. The script never reads either; the next `update`
drops them.

## Command semantics

### `init --root <dir> [--include glob]... [--exclude glob]... [--exception path]... [--rescope] [--dry-run]`

1. Validates the root is a directory. Default include is `**/*` when no
   `--include` is given.
2. **Refuses (exit 1) when `.agent/codemap.json` already exists**, unless
   `--rescope` is given: a second plain `init` would reset the baseline and
   silently absorb edits whose maps were never refreshed. Existing state
   means `update` mode. A corrupt state file also stops it (exit 2, see
   "Corrupt state").
3. Lists candidate files (see "File selection" below).
4. Selects files: drop `codemap.md` files and ignored files; drop exclude
   matches unless excepted; keep include matches or excepted paths.
5. Prints a warning for each `--include` pattern that matched no selected
   file and for each `--exception` that did not end up selected (missing,
   git-ignored, a `codemap.md`, or under a skipped dot-directory).
6. Prints the **folder plan**: every folder to map, tagged
   `(pass-through)` when it holds no selected file of its own, only
   subfolders (`content-spec.md`, "Pass-through folders").
7. `--dry-run` stops here: nothing is written. Use it to check the scope and
   the folder count before asking for the cost go-ahead.
8. Writes `.agent/codemap.json` with the hashes of the selection (with
   `--rescope`: the new patterns, but the **previous** hashes — see "Changing
   the scope later").
9. Creates an **empty** scaffold in every planned folder — the four-section
   scaffold for folders with files, a `Responsibility` + `Child Maps`
   scaffold for pass-through folders, the atlas scaffold at the root — and
   prints how many it created versus kept. Existing `codemap.md` files are
   never overwritten.

### File selection

- **Inside a git work tree**, candidates come from
  `git ls-files --cached --others --exclude-standard` (run read-only, with
  `core.fsmonitor` disabled): tracked files plus untracked files that are not
  ignored. This honors nested `.gitignore` files, `.git/info/exclude`, the
  global excludes file, and `!` negation exactly as git does; symlinks are
  skipped. If the root itself is ignored by the enclosing repo (e.g.
  `vendor/lib` under a `vendor/` rule), git lists nothing, so the walker
  below is used instead.
- **Outside git**, the script walks the tree and applies the **root**
  `.gitignore` only — no nested `.gitignore` files, no `.git/info/exclude`.
  It follows git's pattern rules: a bare name (`node_modules`, `coverage`)
  matches that file or directory anywhere and everything below it; a leading
  or inner `/` (`/build`, `src/gen`) anchors to the root; a trailing `/`
  matches directories only; `!` re-includes unless a parent directory is
  ignored. Ignored and unreadable directories are not traversed.
- **Dot-directories** (`.github/`, `.circleci/`, `.venv/`) are skipped in
  both modes unless an `--include` pattern or `--exception` path **starts
  with** the directory (`--include "/.github/workflows/*.yml"`); a wildcard
  such as `**/*.yml` does not opt one in. `.git/` and `.agent/` are never
  mapped. Dotfiles (`.eslintrc.js`) are ordinary files.
- `codemap.md` files are never selected, whatever the patterns say, so the
  maps never trigger their own refresh.
- `--include` / `--exclude` glob dialect: patterns are **unanchored** unless
  they start with `/` — `src/**/*.ts` also matches `packages/a/src/x.ts` and
  `node_modules/pkg/src/x.ts`, so prefer anchored includes (`/src/**/*.ts`)
  and always pass the mandatory exclusions from `content-spec.md`. `*` and
  `?` never cross a `/`; `**/` spans folders; a trailing `/` matches
  everything below; `{a,b}` sets expand (`/src/**/*.{ts,tsx}`). No `[...]`
  classes and no `!` negation in include/exclude.

### `changes --root <dir>`

Requires state (exits 1 with "No codemap state found. Run 'init' first."
when the file is missing, 2 when it is corrupt). Rescans with the stored
patterns and prints:

- added files (`+`), removed files (`-`), modified files (`~`, hash differs)
- `folders with direct changes`: folders that directly contain a changed
  file and still have selected files — the maps to refresh.
- `ancestor folders`: folders above a change with no changed file of their
  own. Their map changes only when a child's Responsibility or Integration
  line changed or a child map was added or removed.
- `new folders`: listed folders with no selected files in the previous
  baseline — write their map in full, not as a refresh.
- `emptied folders`: folders that had selected files and now have none —
  their `codemap.md` is orphaned.
- `(pass-through)` after any folder that now holds only subfolders.
- a closing `Root atlas: re-assemble ...` line whenever anything changed
- `No changes detected.` when the tree is clean

The root (`.`) is never listed: its `codemap.md` is the atlas.

Work order for `update` mode:

1. Spawn subagents for the `folders with direct changes` only (new folders
   get a full map), deepest folders first.
2. Then the orchestrator walks the `ancestor folders` bottom-up and edits a
   map only when the condition above holds; pass-through maps are the
   orchestrator's (no subagent).
3. For each emptied folder, tell the user and, after their confirmation,
   delete the orphan `codemap.md`; its atlas row goes away with it.
4. Re-assemble the root atlas (`root-atlas.md`): new folders get a row,
   emptied folders lose theirs, root-level file changes update the System
   Entry Points.
5. **Stop condition:** run the script's `update` only when every map in the
   work order was written and passed its Definition of Done. If a subagent
   failed or timed out, report the failed folders and leave the baseline
   untouched, so the next `changes` lists them again.

### `update --root <dir>`

Requires state. Recomputes hashes for the current selection using the stored
patterns and persists the new manifest (`last_run` refreshed). It records
whatever is on disk **now**, including edits made after `changes` ran, so
run it only after the stop condition above holds. It never touches any
`codemap.md`.

## Hash-based change detection in practice

- A file is changed when it was added, removed, or modified since the
  recorded hashes; its folder is a direct change and every folder above it
  is an ancestor.
- Deleting or editing `codemap.md` files is not tracked; the state only
  watches the selected source files.

## Corrupt state

A state file that exists but is not valid JSON (for example a merge
conflict or a truncated write) makes `init`, `changes` and `update` exit 2
with "... is corrupt". Do **not** re-run `init` or delete the file to get
past it: that resets the baseline. Show the user the error, then resolve
the conflict or restore the file from version control (with their go-ahead)
and re-run `changes`.

## Changing the scope later

Patterns are frozen in `metadata`. To map more or fewer files (only when the
user asks):

1. Preview with `init --rescope --dry-run` and the full new flags.
2. Run `init --rescope` with the full new `--include`/`--exclude`/
   `--exception` flags. It stores the new patterns but **keeps the previous
   hashes**, and scaffolds folders that entered the scope. Existing
   `codemap.md` files are preserved.
3. Run `changes`: files that entered the scope show as added, files that left
   it as removed, and edits made since the last `update` as modified; the
   folder lists are the work order (new folders get full maps, emptied
   folders' maps are deleted after confirmation).
4. Finish as a normal `update` run: refresh maps, re-assemble the atlas, run
   the script's `update`.

To start over from scratch instead, delete `.agent/codemap.json` (with the
user's go-ahead) and run a plain `init`.
