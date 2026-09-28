#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const VERSION = '1.1.0';
export const STATE_DIR = '.agent';
export const STATE_FILE = 'codemap.json';
export const CODEMAP_FILE = 'codemap.md';
// Dot-directories are skipped unless an include/exception names them; these
// never are (VCS internals and agent state, including this script's own).
const ALWAYS_SKIPPED_DIRS = new Set(['.git', STATE_DIR]);

// Glob → regex body: `**/` spans zero or more folders, `**` anything,
// `*` and `?` never cross a `/`.
function globToRegexBody(pattern) {
  let reg = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  reg = reg.replace(/\\\*\\\*\//g, '(?:.*/)?');
  reg = reg.replace(/\\\*\\\*/g, '.*');
  reg = reg.replace(/\\\*/g, '[^/]*');
  reg = reg.replace(/\\\?/g, '[^/]');
  return reg;
}

// `{a,b}` sets (nestable) expand into one pattern per alternative, as in
// shells and most glob libraries. A `{…}` without a top-level comma stays
// literal; an unbalanced `{` leaves the pattern unchanged.
export function expandBraces(pattern) {
  const open = pattern.indexOf('{');
  if (open === -1) return [pattern];
  let depth = 0;
  for (let i = open; i < pattern.length; i++) {
    if (pattern[i] === '{') depth++;
    else if (pattern[i] === '}' && --depth === 0) {
      const body = pattern.slice(open + 1, i);
      const options = [];
      let level = 0;
      let start = 0;
      for (let j = 0; j < body.length; j++) {
        if (body[j] === '{') level++;
        else if (body[j] === '}') level--;
        else if (body[j] === ',' && level === 0) {
          options.push(body.slice(start, j));
          start = j + 1;
        }
      }
      options.push(body.slice(start));
      const head = pattern.slice(0, open);
      const tail = pattern.slice(i + 1);
      if (options.length < 2) {
        return expandBraces(tail).map((rest) => pattern.slice(0, i + 1) + rest);
      }
      return options.flatMap((option) => expandBraces(head + option + tail));
    }
  }
  return [pattern];
}

// Include/exclude globs. Unanchored unless they start with `/`: `src/**/*.ts`
// also matches `packages/a/src/x.ts`. A trailing `/` matches everything below.
// `{a,b}` sets are expanded first.
export class PatternMatcher {
  regex;

  constructor(patterns) {
    if (!patterns.length) {
      this.regex = null;
      return;
    }

    const regexParts = patterns.flatMap(expandBraces).map((pattern) => {
      let reg = globToRegexBody(pattern);

      if (pattern.endsWith('/')) {
        reg += '.*';
      }

      if (pattern.startsWith('/')) {
        reg = `^${reg.slice(1)}`;
      } else {
        reg = `(?:^|.*/)${reg}`;
      }

      return `(?:${reg}$)`;
    });

    this.regex = new RegExp(regexParts.join('|'));
  }

  matches(filePath) {
    if (!this.regex) return false;
    return this.regex.test(filePath);
  }
}

// Root `.gitignore` semantics (fallback when the root is not a git work tree):
// a pattern matches the path itself or, when it names a directory, everything
// below it; `/` at the start or in the middle anchors it to the root; a
// trailing `/` matches directories only; `!` re-includes; last match wins; a
// file under an ignored directory cannot be re-included (as in git).
export class GitignoreMatcher {
  rules;

  constructor(patterns) {
    this.rules = [];
    for (const raw of patterns) {
      let body = raw;
      const negate = body.startsWith('!');
      if (negate) body = body.slice(1);
      else if (body.startsWith('\\!') || body.startsWith('\\#')) {
        body = body.slice(1);
      }
      const dirOnly = body.endsWith('/');
      body = body.replace(/\/+$/, '');
      if (!body) continue;
      const anchored = body.includes('/');
      body = body.replace(/^\//, '');
      const prefix = anchored ? '^' : '(?:^|.*/)';
      this.rules.push({
        negate,
        dirOnly,
        regex: new RegExp(`${prefix}${globToRegexBody(body)}$`),
      });
    }
  }

  // Does this exact path (a file, or a directory when isDir) match?
  ignoresEntry(relPath, isDir) {
    let ignored = false;
    for (const rule of this.rules) {
      if (rule.dirOnly && !isDir) continue;
      if (rule.regex.test(relPath)) ignored = !rule.negate;
    }
    return ignored;
  }

  // Is this directory (relative path, no trailing slash) ignored?
  matchesDir(relDir) {
    const parts = relDir.split('/');
    for (let i = 1; i <= parts.length; i++) {
      if (this.ignoresEntry(parts.slice(0, i).join('/'), true)) return true;
    }
    return false;
  }

  // Is this file ignored, directly or through an ignored ancestor directory?
  matches(relFile) {
    if (!this.rules.length) return false;
    const parts = relFile.split('/');
    if (parts.length > 1 && this.matchesDir(parts.slice(0, -1).join('/'))) {
      return true;
    }
    return this.ignoresEntry(relFile, false);
  }
}

export function loadGitignore(root) {
  const gitignorePath = path.join(root, '.gitignore');
  if (!existsSync(gitignorePath)) return [];

  return readFileSync(gitignorePath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}

// Include patterns and exceptions that can opt a dot-directory in: the
// directory must be named at their start (`.github/workflows/*.yml`,
// `/.github/**`), not reached through a wildcard.
export function dotDirOptIns(includePatterns = [], exceptions = []) {
  return [...includePatterns.flatMap(expandBraces), ...exceptions].map((entry) =>
    entry.replace(/^\/+/, ''),
  );
}

// May the walk enter this folder (segments of a relative directory path)?
// Dot-directories (`.github`, `.venv`) are skipped unless an opt-in starts
// with the path of the deepest one; `.git` and `.agent` never are entered.
// Dotfiles such as `.eslintrc.js` are not directories and always count.
export function dotDirsAllowed(dirParts, optIns = []) {
  let deepest = -1;
  for (let i = 0; i < dirParts.length; i++) {
    if (ALWAYS_SKIPPED_DIRS.has(dirParts[i])) return false;
    if (dirParts[i].startsWith('.')) deepest = i;
  }
  if (deepest === -1) return true;
  const prefix = `${dirParts.slice(0, deepest + 1).join('/')}/`;
  return optIns.some((optIn) => optIn.startsWith(prefix));
}

const runGit = (root, args) =>
  spawnSync('git', ['-c', 'core.fsmonitor=false', '-C', root, ...args], {
    encoding: 'utf8',
    maxBuffer: 512 * 1024 * 1024,
  });

// Inside a git work tree, ask git for the candidate files: tracked plus
// untracked-but-not-ignored, which honors nested .gitignore files,
// .git/info/exclude and negation exactly. Read-only; fsmonitor is disabled so
// an untrusted repo's config cannot run a hook. Returns null outside git, and
// also when the root itself is ignored by the enclosing repo (for example
// `vendor/lib` under a `vendor/` rule), where git would list nothing — the
// caller then falls back to the walker.
export function listGitFiles(root, optIns = []) {
  const result = runGit(root, [
    'ls-files',
    '-z',
    '--cached',
    '--others',
    '--exclude-standard',
  ]);
  if (result.error || result.status !== 0) return null;
  if (runGit(root, ['check-ignore', '-q', '--', '.']).status === 0) {
    return null;
  }

  const files = new Set();
  for (const relPath of result.stdout.split('\0')) {
    if (!relPath) continue;
    if (!dotDirsAllowed(relPath.split('/').slice(0, -1), optIns)) continue;
    const fullPath = path.join(root, relPath);
    try {
      if (lstatSync(fullPath).isFile()) files.add(fullPath);
    } catch {
      // Tracked but deleted from the working tree.
    }
  }
  return [...files].sort();
}

function walkFiles(root, gitignoreMatcher, optIns = []) {
  const files = [];

  function visit(currentDir) {
    let entries;
    try {
      entries = readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return; // Unreadable directory (permissions): nothing to map there.
    }
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        const relDir = path.relative(root, fullPath).replaceAll(path.sep, '/');
        if (
          dotDirsAllowed(relDir.split('/'), optIns) &&
          !gitignoreMatcher?.matchesDir(relDir)
        ) {
          visit(fullPath);
        }
        continue;
      }

      if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  visit(root);
  return files.sort();
}

// Candidate files come from git inside a work tree (exact ignore semantics),
// otherwise from a walk that skips dot-directories and honors the root
// .gitignore only. Include/exclude/exceptions then apply on top. Generated
// `codemap.md` files are never sources, whatever the patterns say.
export function selectFiles(
  root,
  includePatterns,
  excludePatterns,
  exceptions,
  gitignorePatterns,
  { useGit = true } = {},
) {
  const includeMatcher = new PatternMatcher(includePatterns);
  const excludeMatcher = new PatternMatcher(excludePatterns);
  const optIns = dotDirOptIns(includePatterns, exceptions);
  const gitFiles = useGit ? listGitFiles(root, optIns) : null;
  const gitignoreMatcher = new GitignoreMatcher(
    gitFiles ? [] : gitignorePatterns,
  );
  const exceptionSet = new Set(exceptions);
  const candidates = gitFiles ?? walkFiles(root, gitignoreMatcher, optIns);

  return candidates.filter((fullPath) => {
    let relPath = path.relative(root, fullPath).replaceAll(path.sep, '/');
    if (relPath.startsWith('./')) {
      relPath = relPath.slice(2);
    }

    if (path.posix.basename(relPath) === CODEMAP_FILE) return false;
    if (gitignoreMatcher.matches(relPath)) return false;
    if (excludeMatcher.matches(relPath) && !exceptionSet.has(relPath)) {
      return false;
    }

    return includeMatcher.matches(relPath) || exceptionSet.has(relPath);
  });
}

export function computeFileHash(filePath) {
  try {
    const buffer = readFileSync(filePath);
    return createHash('md5').update(buffer).digest('hex');
  } catch {
    return '';
  }
}

const toRel = (root, filePath) =>
  path.relative(root, filePath).replaceAll(path.sep, '/');

// Every folder (and ancestor) holding one of these relative file paths.
// The root (`.`) is not included.
function foldersOf(relPaths) {
  const folders = new Set();
  for (const filePath of relPaths) {
    const parts = filePath.split('/').slice(0, -1);
    for (let i = 0; i < parts.length; i++) {
      folders.add(parts.slice(0, i + 1).join('/'));
    }
  }
  return folders;
}

// Folders that directly contain one of these relative file paths.
function directFoldersOf(relPaths) {
  const folders = new Set();
  for (const filePath of relPaths) {
    const dir = path.posix.dirname(filePath);
    if (dir !== '.') folders.add(dir);
  }
  return folders;
}

// Every folder (plus the root `.`) that holds a selected file at any depth.
export function getFoldersWithFiles(files, root) {
  return new Set(['.', ...foldersOf(files.map((f) => toRel(root, f)))]);
}

// Folder plan: `files` folders hold selected files of their own and get a
// full map; `pass-through` folders only hold subfolders (for example Java
// package prefixes) and get a short map written after their children.
export function planFolders(relPaths) {
  const direct = directFoldersOf(relPaths);
  return [...foldersOf(relPaths)]
    .sort()
    .map((folder) => ({
      folder,
      kind: direct.has(folder) ? 'files' : 'pass-through',
    }));
}

export class StateError extends Error {}

// Returns null when there is no state file. A file that exists but cannot be
// parsed throws StateError: it must not look like "no state", or the caller
// re-runs init and silently resets the change baseline.
export function loadState(root) {
  const statePath = path.join(root, STATE_DIR, STATE_FILE);
  let text;
  try {
    text = readFileSync(statePath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw new StateError(`cannot read ${STATE_DIR}/${STATE_FILE}: ${error.message}`);
  }
  let state;
  try {
    state = JSON.parse(text);
  } catch (error) {
    throw new StateError(`${STATE_DIR}/${STATE_FILE} is corrupt: ${error.message}`);
  }
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw new StateError(`${STATE_DIR}/${STATE_FILE} is corrupt: not a JSON object`);
  }
  return state;
}

const CORRUPT_STATE_EXIT = 2;

function reportStateError(error) {
  console.error(
    `Error: ${error.message}. Repair it (for example resolve a merge conflict, ` +
      'or restore it from version control). Do not re-run init: that resets the ' +
      'change baseline and hides maps that are already stale.',
  );
  return CORRUPT_STATE_EXIT;
}

export function saveState(root, state) {
  const stateDir = path.join(root, STATE_DIR);
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(
    path.join(stateDir, STATE_FILE),
    `${JSON.stringify(state, null, 2)}\n`,
  );
}

const SCAFFOLDS = {
  files: (title) => `# ${title}/

<!-- codemap: fill each section from the files in this folder -->

## Responsibility

<!-- What is this folder's job in the system? -->

## Design

<!-- Key patterns, abstractions, architectural decisions -->

## Flow

<!-- How does data/control flow through this module? -->

## Integration

<!-- How does it connect to other parts of the system? -->
`,
  'pass-through': (title) => `# ${title}/

<!-- codemap: pass-through folder (no mapped files of its own); fill after the child maps exist -->

## Responsibility

<!-- One line: what the subfolders below have in common -->

## Child Maps

<!-- One link per child folder map, with its Responsibility line -->
`,
  atlas: (title) => `# Repository Atlas: ${title}

<!-- codemap: root atlas, assembled from the folder maps -->

## Project Responsibility

<!-- The project's purpose in 2-3 sentences, from the root README/manifest -->

## System Entry Points

<!-- Root-level files that start or configure the system -->

## Repository Directory Map

<!-- One row per folder map: directory, Responsibility line, link -->
`,
};

// Writes a scaffold unless a codemap.md already exists. `kind` is `files`,
// `pass-through`, or `atlas` (the root). Returns true when it created one.
export function createEmptyCodemap(folderPath, title, kind = 'files') {
  const codemapPath = path.join(folderPath, CODEMAP_FILE);
  if (existsSync(codemapPath)) return false;
  writeFileSync(codemapPath, SCAFFOLDS[kind](title));
  return true;
}

function hashSelection(root, selectedFiles) {
  const fileHashes = {};
  for (const filePath of selectedFiles) {
    fileHashes[toRel(root, filePath)] = computeFileHash(filePath);
  }
  return fileHashes;
}

// The manifest stores no absolute path: it is meant to be committed, and the
// root always comes from --root.
function buildState(includePatterns, excludePatterns, exceptions, fileHashes) {
  return {
    metadata: {
      version: VERSION,
      last_run: new Date().toISOString(),
      include_patterns: includePatterns,
      exclude_patterns: excludePatterns,
      exceptions,
    },
    file_hashes: fileHashes,
  };
}

const kindLabel = (kind) => (kind === 'pass-through' ? ' (pass-through)' : '');

export function cmdInit({
  root,
  include = [],
  exclude = [],
  exception = [],
  rescope = false,
  dryRun = false,
}) {
  const resolvedRoot = path.resolve(root);
  if (!existsSync(resolvedRoot) || !statSync(resolvedRoot).isDirectory()) {
    console.error(`Error: ${resolvedRoot} is not a directory`);
    return 1;
  }

  // Re-running init would silently reset the change baseline and absorb any
  // edits whose maps were never refreshed. Refuse unless re-scoping. A dry
  // run writes nothing, so it may preview a rescope.
  let previous = null;
  if (!dryRun) {
    try {
      previous = loadState(resolvedRoot);
    } catch (error) {
      if (error instanceof StateError) return reportStateError(error);
      throw error;
    }
    if (previous && !rescope) {
      console.error(
        `Error: ${STATE_DIR}/${STATE_FILE} already exists. Use 'changes' + 'update' to refresh, ` +
          "or 'init --rescope' with the new patterns to change the scope.",
      );
      return 1;
    }
  }

  const includePatterns = include.length ? include : ['**/*'];
  const excludePatterns = exclude;
  const exceptions = exception;
  const gitignore = loadGitignore(resolvedRoot);

  console.log(`Scanning ${resolvedRoot}...`);
  console.log(`Include patterns: ${JSON.stringify(includePatterns)}`);
  console.log(`Exclude patterns: ${JSON.stringify(excludePatterns)}`);
  console.log(`Exceptions: ${JSON.stringify(exceptions)}`);

  const selectedFiles = selectFiles(
    resolvedRoot,
    includePatterns,
    excludePatterns,
    exceptions,
    gitignore,
  );
  const selectedRel = selectedFiles.map((f) => toRel(resolvedRoot, f));

  console.log(`Selected ${selectedFiles.length} files`);

  // Scope mistakes surface here, before any subagent is spawned.
  for (const pattern of include) {
    const matcher = new PatternMatcher([pattern]);
    if (!selectedRel.some((relPath) => matcher.matches(relPath))) {
      console.log(`Warning: include pattern ${JSON.stringify(pattern)} matched no selected file`);
    }
  }
  const selectedSet = new Set(selectedRel);
  for (const relPath of exceptions) {
    if (!selectedSet.has(relPath)) {
      console.log(
        `Warning: exception ${JSON.stringify(relPath)} was not selected ` +
          '(missing, ignored by git, a codemap.md, or under a skipped dot-directory)',
      );
    }
  }

  const plan = planFolders(selectedRel);
  const passThrough = plan.filter((entry) => entry.kind === 'pass-through');
  console.log(
    `\n${plan.length} folders to map (${plan.length - passThrough.length} with files, ` +
      `${passThrough.length} pass-through) + the root atlas:`,
  );
  for (const { folder, kind } of plan) console.log(`  ${folder}/${kindLabel(kind)}`);

  if (dryRun) {
    console.log('\nDry run: nothing written.');
    return 0;
  }

  const state = buildState(
    includePatterns,
    excludePatterns,
    exceptions,
    // Rescope keeps the previous baseline: the next `changes` then reports
    // files that entered the scope as added, files that left it as removed,
    // and edits made since the last `update` as modified.
    previous ? (previous.file_hashes ?? {}) : hashSelection(resolvedRoot, selectedFiles),
  );

  saveState(resolvedRoot, state);
  console.log(
    previous
      ? `\nRescoped ${STATE_DIR}/${STATE_FILE} (previous baseline kept; run 'changes' for the scope delta)`
      : `\nCreated ${STATE_DIR}/${STATE_FILE}`,
  );

  let created = 0;
  if (createEmptyCodemap(resolvedRoot, path.basename(resolvedRoot), 'atlas')) created++;
  for (const { folder, kind } of plan) {
    if (createEmptyCodemap(path.join(resolvedRoot, folder), folder, kind)) created++;
  }

  console.log(
    `Created ${created} empty codemap.md scaffolds (${plan.length + 1 - created} existing kept)`,
  );
  return 0;
}

// Loads the state and rescans with its frozen patterns.
function rescan(root) {
  const state = loadState(root);
  if (!state) return { state: null };
  const metadata = state.metadata ?? {};
  const includePatterns = metadata.include_patterns ?? ['**/*'];
  const excludePatterns = metadata.exclude_patterns ?? [];
  const exceptions = metadata.exceptions ?? [];
  const selectedFiles = selectFiles(
    root,
    includePatterns,
    excludePatterns,
    exceptions,
    loadGitignore(root),
  );
  return { state, includePatterns, excludePatterns, exceptions, selectedFiles };
}

function withState(root, action) {
  const resolvedRoot = path.resolve(root);
  let scan;
  try {
    scan = rescan(resolvedRoot);
  } catch (error) {
    if (error instanceof StateError) return reportStateError(error);
    throw error;
  }
  if (!scan.state) {
    console.error("No codemap state found. Run 'init' first.");
    return 1;
  }
  return action(resolvedRoot, scan);
}

const printFolders = (title, folders, plan) => {
  if (!folders.length) return;
  console.log(`\n${folders.length} ${title}:`);
  for (const folder of folders) console.log(`  ${folder}/${kindLabel(plan.get(folder))}`);
};

export function cmdChanges({ root }) {
  return withState(root, (resolvedRoot, { state, selectedFiles }) => {
    const currentHashes = hashSelection(resolvedRoot, selectedFiles);
    const savedHashes = state.file_hashes ?? {};
    const currentPaths = new Set(Object.keys(currentHashes));
    const savedPaths = new Set(Object.keys(savedHashes));

    const added = [...currentPaths].filter((p) => !savedPaths.has(p)).sort();
    const removed = [...savedPaths].filter((p) => !currentPaths.has(p)).sort();
    const modified = [...currentPaths]
      .filter((p) => savedPaths.has(p) && currentHashes[p] !== savedHashes[p])
      .sort();

    if (!added.length && !removed.length && !modified.length) {
      console.log('No changes detected.');
      return 0;
    }

    if (added.length) {
      console.log(`\n${added.length} added:`);
      for (const filePath of added) console.log(`  + ${filePath}`);
    }
    if (removed.length) {
      console.log(`\n${removed.length} removed:`);
      for (const filePath of removed) console.log(`  - ${filePath}`);
    }
    if (modified.length) {
      console.log(`\n${modified.length} modified:`);
      for (const filePath of modified) console.log(`  ~ ${filePath}`);
    }

    // Work order. The root (`.`) is never listed: its codemap.md is the atlas,
    // re-assembled after the folder maps (root-level files are its entry points).
    const plan = new Map(
      planFolders([...currentPaths]).map(({ folder, kind }) => [folder, kind]),
    );
    const savedFolders = foldersOf(savedPaths);
    const changed = [...added, ...removed, ...modified];
    const direct = [...directFoldersOf(changed)].filter((f) => plan.has(f)).sort();
    const directSet = new Set(direct);
    const ancestors = [...foldersOf(changed)]
      .filter((f) => plan.has(f) && !directSet.has(f))
      .sort();
    const fresh = [...direct, ...ancestors].filter((f) => !savedFolders.has(f)).sort();
    const emptied = [...savedFolders].filter((f) => !plan.has(f)).sort();

    printFolders('folders with direct changes (refresh these maps)', direct, plan);
    printFolders(
      "ancestor folders (no direct change; update only if a child's Responsibility or Integration line changed, or a child map was added or removed)",
      ancestors,
      plan,
    );
    printFolders('new folders (no previous map; write in full)', fresh, plan);
    printFolders(
      'emptied folders (no selected files left; codemap.md is orphaned)',
      emptied,
      plan,
    );

    console.log(
      '\nRoot atlas: re-assemble ./codemap.md after refreshing the folders above.',
    );
    return 0;
  });
}

export function cmdUpdate({ root }) {
  return withState(
    root,
    (resolvedRoot, { includePatterns, excludePatterns, exceptions, selectedFiles }) => {
      saveState(
        resolvedRoot,
        buildState(
          includePatterns,
          excludePatterns,
          exceptions,
          hashSelection(resolvedRoot, selectedFiles),
        ),
      );
      console.log(
        `Updated ${STATE_DIR}/${STATE_FILE} with ${selectedFiles.length} files`,
      );
      return 0;
    },
  );
}

const BOOLEAN_FLAGS = { '--rescope': 'rescope', '--dry-run': 'dryRun' };

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = { include: [], exclude: [], exception: [] };

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    const value = rest[i + 1];

    if (!arg?.startsWith('--')) continue;
    if (BOOLEAN_FLAGS[arg]) {
      options[BOOLEAN_FLAGS[arg]] = true;
      continue;
    }
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Missing value for ${arg}`);
    }

    const key = arg.slice(2);
    if (key === 'include' || key === 'exclude' || key === 'exception') {
      options[key].push(value);
    } else if (key === 'root') {
      options.root = value;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }

    i++;
  }

  return { command, options };
}

export function main(argv = process.argv.slice(2)) {
  try {
    const { command, options } = parseArgs(argv);

    if (!command || !options.root) {
      console.error(
        'Usage: codemap.mjs <init|changes|update> --root /path [--include glob] [--exclude glob] [--exception path] [--rescope] [--dry-run]',
      );
      return 1;
    }

    if (command === 'init') return cmdInit(options);
    if (command === 'changes') return cmdChanges(options);
    if (command === 'update') return cmdUpdate(options);

    console.error(`Unknown command: ${command}`);
    return 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

// Run as a CLI only when this file is the entry point. Compare real paths:
// Node resolves import.meta.url through symlinks but keeps argv[1] as typed,
// so a symlinked skill install (~/.claude/skills/codemap -> repo) would
// otherwise never run main() and exit 0 silently.
function isEntryPoint() {
  if (!process.argv[1]) return false;
  try {
    return (
      realpathSync(process.argv[1]) ===
      realpathSync(fileURLToPath(import.meta.url))
    );
  } catch {
    return false;
  }
}

if (isEntryPoint()) {
  process.exit(main());
}
