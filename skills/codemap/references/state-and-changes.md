# State manifest and change detection

`codemap.mjs` keeps its state in `.agent/codemap.json` at the repository root.
The manifest freezes the mapping scope and the content hashes that drive
incremental refresh. Folder map content itself is specified in
`content-spec.md`; the root atlas and registration step are in
`root-atlas.md`.

## Manifest shape

```json
{
  "metadata": {
    "version": "1.0.0",
    "last_run": "2026-09-27T12:00:00.000Z",
    "root": "/abs/path/to/repo",
    "include_patterns": ["src/**/*.ts", "package.json"],
    "exclude_patterns": ["**/*.test.ts", "dist/**", "node_modules/**"],
    "exceptions": []
  },
  "file_hashes": {
    "src/index.ts": "9473fdd0d880a43c21b7778d34872157"
  },
  "folder_hashes": {
    ".": "…",
    "src": "…"
  }
}
```

- `metadata.version` — manifest schema version written by the script.
- `metadata.last_run` — ISO timestamp of the last `init`/`update`.
- `metadata.root` — resolved root recorded at run time.
- `metadata.include_patterns` / `exclude_patterns` / `exceptions` — the
  frozen scope. `changes` and `update` reuse these verbatim; they do not take
  new pattern flags.
- `file_hashes` — relative path → md5 of the file's bytes.
- `folder_hashes` — folder (root is `.`) → md5 over the sorted
  `path:hash\n` lines of the selected files under it; `""` when a folder has
  no selected files.

## Command semantics

### `init --root <dir> [--include glob]... [--exclude glob]... [--exception path]... [--rescope]`

1. Validates the root is a directory. Default include is `**/*` when no
   `--include` is given.
2. **Refuses (exit 1) when `.agent/codemap.json` already exists**, unless
   `--rescope` is given: a second plain `init` would reset the baseline and
   silently absorb edits whose maps were never refreshed. Existing state
   means `update` mode.
3. Lists candidate files (see "File selection" below).
4. Selects files: drop ignored files; drop exclude matches unless excepted;
   keep include matches or excepted paths.
5. Writes `.agent/codemap.json` with the hashes of the selection (with
   `--rescope`: the new patterns, but the **previous** hashes — see "Changing
   the scope later").
6. Creates an **empty** `codemap.md` scaffold in every folder that has
   selected files (plus the root) and prints how many it created versus kept.
   Existing `codemap.md` files are never overwritten.

### File selection

- **Inside a git work tree**, candidates come from
  `git ls-files --cached --others --exclude-standard` (run read-only, with
  `core.fsmonitor` disabled): tracked files plus untracked files that are not
  ignored. This honors nested `.gitignore` files, `.git/info/exclude`, the
  global excludes file, and `!` negation exactly as git does. Paths under a
  dot-directory (`.github/`, `.agent/`) are dropped, dotfiles
  (`.eslintrc.js`) are kept — the same selection as the walker; symlinks are
  skipped. If the root itself is ignored by the enclosing repo (e.g.
  `vendor/lib` under a `vendor/` rule), git lists nothing, so the walker
  below is used instead.
- **Outside git**, the script walks the tree (skipping dot-directories) and
  applies the **root** `.gitignore` only — no nested `.gitignore` files, no
  `.git/info/exclude`. It follows git's pattern rules: a bare name
  (`node_modules`, `coverage`) matches that file or directory anywhere and
  everything below it; a leading or inner `/` (`/build`, `src/gen`) anchors to
  the root; a trailing `/` matches directories only; `!` re-includes unless a
  parent directory is ignored. Ignored directories are not traversed.
- `--include` / `--exclude` globs are **unanchored** unless they start with
  `/`: `src/**/*.ts` also matches `packages/a/src/x.ts` and
  `node_modules/pkg/src/x.ts`, so always pass the mandatory exclusions from
  `content-spec.md`. `*` and `?` never cross a `/`; `**/` spans folders; a
  trailing `/` matches everything below.

### `changes --root <dir>`

Requires state (exits 1 with "No codemap state found. Run 'init' first."
otherwise). Rescans with the stored patterns and prints:

- added files (`+`), removed files (`-`), modified files (`~`, hash differs)
- `folders affected`: every ancestor folder of each changed file that still
  has selected files. The root (`.`) is never listed — its `codemap.md` is
  the atlas.
- `new folders`: affected folders with no selected files in the previous
  baseline — write their map in full, not as a refresh.
- `emptied folders`: folders that had selected files and now have none —
  their `codemap.md` is orphaned.
- a closing `Root atlas: re-assemble ...` line whenever anything changed
- `No changes detected.` when the tree is clean

Work order for `update` mode:

1. Spawn one subagent per listed affected folder and refresh only those
   `codemap.md` files (new folders get a full map).
2. For each emptied folder, tell the user and, after their confirmation,
   delete the orphan `codemap.md`; its atlas row goes away with it.
3. Re-assemble the root atlas (`root-atlas.md`): new folders get a row,
   emptied folders lose theirs, root-level file changes update the System
   Entry Points.
4. Run the script's `update` to record the new baseline.

### `update --root <dir>`

Requires state. Recomputes hashes for the current selection using the stored
patterns and persists the new manifest (`last_run` refreshed). Run it **after**
the affected folder maps have been rewritten — it records the new baseline and
does not touch any `codemap.md`.

## Hash-based change detection in practice

- A folder is "changed" when any selected file under it (or in it, for the
  root) was added, removed, or modified since the recorded hashes.
- All ancestor folders of a changed file are marked affected, so parent maps
  stay consistent with their children's integration points.
- `folder_hashes` is derived data: it exists so a future run can compare whole
  folders cheaply; the authoritative diff is always computed from
  `file_hashes`.
- Deleting `codemap.md` files is not tracked; the state only watches the
  selected source files.

## Changing the scope later

Patterns are frozen in `metadata`. To map more or fewer files (only when the
user asks):

1. Run `init --rescope` with the full new `--include`/`--exclude`/
   `--exception` flags. It stores the new patterns but **keeps the previous
   hashes**, and scaffolds folders that entered the scope. Existing
   `codemap.md` files are preserved.
2. Run `changes`: files that entered the scope show as added, files that left
   it as removed, and edits made since the last `update` as modified; the
   folder lists are the work order (new folders get full maps, emptied
   folders' maps are deleted after confirmation).
3. Finish as a normal `update` run: refresh maps, re-assemble the atlas, run
   the script's `update`.

To start over from scratch instead, delete `.agent/codemap.json` (with the
user's go-ahead) and run a plain `init`.
