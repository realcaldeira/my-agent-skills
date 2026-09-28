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
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const VERSION = '1.0.0';
export const STATE_DIR = '.agent';
export const STATE_FILE = 'codemap.json';
export const LEGACY_STATE_FILE = 'cartography.json';
export const CODEMAP_FILE = 'codemap.md';

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

// Include/exclude globs. Unanchored unless they start with `/`: `src/**/*.ts`
// also matches `packages/a/src/x.ts`. A trailing `/` matches everything below.
export class PatternMatcher {
  regex;

  constructor(patterns) {
    if (!patterns.length) {
      this.regex = null;
      return;
    }

    const regexParts = patterns.map((pattern) => {
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

// Only directory segments count, matching the walker (which skips
// dot-directories but keeps dotfiles such as `.eslintrc.js`).
const hasDotDirSegment = (relPath) =>
  relPath
    .split('/')
    .slice(0, -1)
    .some((part) => part.startsWith('.'));

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
export function listGitFiles(root) {
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
    if (!relPath || hasDotDirSegment(relPath)) continue;
    const fullPath = path.join(root, relPath);
    try {
      if (lstatSync(fullPath).isFile()) files.add(fullPath);
    } catch {
      // Tracked but deleted from the working tree.
    }
  }
  return [...files].sort();
}

function walkFiles(root, gitignoreMatcher) {
  const files = [];

  function visit(currentDir) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        const relDir = path.relative(root, fullPath).replaceAll(path.sep, '/');
        if (
          !entry.name.startsWith('.') &&
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
// .gitignore only. Include/exclude/exceptions then apply on top.
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
  const gitFiles = useGit ? listGitFiles(root) : null;
  const gitignoreMatcher = new GitignoreMatcher(
    gitFiles ? [] : gitignorePatterns,
  );
  const exceptionSet = new Set(exceptions);
  const candidates = gitFiles ?? walkFiles(root, gitignoreMatcher);

  return candidates.filter((fullPath) => {
    let relPath = path.relative(root, fullPath).replaceAll(path.sep, '/');
    if (relPath.startsWith('./')) {
      relPath = relPath.slice(2);
    }

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

export function computeFolderHash(folder, fileHashes) {
  const folderFiles = Object.entries(fileHashes)
    .filter(
      ([filePath]) =>
        filePath.startsWith(`${folder}/`) ||
        (folder === '.' && !filePath.includes('/')),
    )
    .sort(([a], [b]) => a.localeCompare(b));

  if (!folderFiles.length) return '';

  const hasher = createHash('md5');
  for (const [filePath, hash] of folderFiles) {
    hasher.update(`${filePath}:${hash}\n`);
  }
  return hasher.digest('hex');
}

export function getFoldersWithFiles(files, root) {
  const folders = new Set(['.']);

  for (const filePath of files) {
    const relPath = path.relative(root, filePath).replaceAll(path.sep, '/');
    const parts = relPath.split('/').slice(0, -1);
    for (let i = 0; i < parts.length; i++) {
      folders.add(parts.slice(0, i + 1).join('/'));
    }
  }

  return folders;
}

export function migrateLegacyState(root) {
  const stateDir = path.join(root, STATE_DIR);
  const legacyPath = path.join(stateDir, LEGACY_STATE_FILE);
  const statePath = path.join(stateDir, STATE_FILE);

  if (existsSync(statePath) || !existsSync(legacyPath)) {
    return false;
  }

  mkdirSync(stateDir, { recursive: true });
  renameSync(legacyPath, statePath);
  console.log(
    `Migrated ${STATE_DIR}/${LEGACY_STATE_FILE} -> ${STATE_DIR}/${STATE_FILE}`,
  );
  return true;
}

export function loadState(root) {
  migrateLegacyState(root);
  const statePath = path.join(root, STATE_DIR, STATE_FILE);
  if (!existsSync(statePath)) return null;

  try {
    return JSON.parse(readFileSync(statePath, 'utf8'));
  } catch {
    return null;
  }
}

export function saveState(root, state) {
  const stateDir = path.join(root, STATE_DIR);
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(
    path.join(stateDir, STATE_FILE),
    `${JSON.stringify(state, null, 2)}\n`,
  );
}

export function createEmptyCodemap(folderPath, folderName) {
  const codemapPath = path.join(folderPath, CODEMAP_FILE);
  if (existsSync(codemapPath)) return false;

  const content = `# ${folderName}/

<!-- Fixer: Fill in this section with architectural understanding -->

## Responsibility

<!-- What is this folder's job in the system? -->

## Design

<!-- Key patterns, abstractions, architectural decisions -->

## Flow

<!-- How does data/control flow through this module? -->

## Integration

<!-- How does it connect to other parts of the system? -->
`;

  writeFileSync(codemapPath, content);
  return true;
}

// Every folder (and ancestor) holding one of these relative file paths.
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

function buildState(
  root,
  includePatterns,
  excludePatterns,
  exceptions,
  selectedFiles,
) {
  const fileHashes = {};
  for (const filePath of selectedFiles) {
    const relPath = path.relative(root, filePath).replaceAll(path.sep, '/');
    fileHashes[relPath] = computeFileHash(filePath);
  }

  const folders = getFoldersWithFiles(selectedFiles, root);
  const folderHashes = {};
  for (const folder of folders) {
    folderHashes[folder] = computeFolderHash(folder, fileHashes);
  }

  const state = {
    metadata: {
      version: VERSION,
      last_run: new Date().toISOString(),
      root,
      include_patterns: includePatterns,
      exclude_patterns: excludePatterns,
      exceptions,
    },
    file_hashes: fileHashes,
    folder_hashes: folderHashes,
  };

  return { state, folders };
}

export function cmdInit({
  root,
  include = [],
  exclude = [],
  exception = [],
  rescope = false,
}) {
  const resolvedRoot = path.resolve(root);
  if (!existsSync(resolvedRoot) || !statSync(resolvedRoot).isDirectory()) {
    console.error(`Error: ${resolvedRoot} is not a directory`);
    return 1;
  }

  // Re-running init would silently reset the change baseline and absorb any
  // edits whose maps were never refreshed. Refuse unless re-scoping.
  const previous = loadState(resolvedRoot);
  if (previous && !rescope) {
    console.error(
      `Error: ${STATE_DIR}/${STATE_FILE} already exists. Use 'changes' + 'update' to refresh, ` +
        "or 'init --rescope' with the new patterns to change the scope.",
    );
    return 1;
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

  console.log(`Selected ${selectedFiles.length} files`);

  const { state, folders } = buildState(
    resolvedRoot,
    includePatterns,
    excludePatterns,
    exceptions,
    selectedFiles,
  );

  if (previous) {
    // Keep the previous baseline: the next `changes` then reports files that
    // entered the scope as added, files that left it as removed, and edits
    // made since the last `update` as modified.
    state.file_hashes = previous.file_hashes ?? {};
    state.folder_hashes = previous.folder_hashes ?? {};
  }

  saveState(resolvedRoot, state);
  console.log(
    previous
      ? `Rescoped ${STATE_DIR}/${STATE_FILE} (previous baseline kept; run 'changes' for the scope delta)`
      : `Created ${STATE_DIR}/${STATE_FILE}`,
  );

  let created = 0;
  for (const folder of folders) {
    const folderPath =
      folder === '.' ? resolvedRoot : path.join(resolvedRoot, folder);
    const folderName = folder === '.' ? path.basename(resolvedRoot) : folder;
    if (createEmptyCodemap(folderPath, folderName)) created++;
  }

  console.log(
    `Created ${created} empty codemap.md scaffolds (${folders.size - created} existing kept)`,
  );
  return 0;
}

export function cmdChanges({ root }) {
  const resolvedRoot = path.resolve(root);
  const state = loadState(resolvedRoot);
  if (!state) {
    console.error("No codemap state found. Run 'init' first.");
    return 1;
  }

  const metadata = state.metadata ?? {};
  const includePatterns = metadata.include_patterns ?? ['**/*'];
  const excludePatterns = metadata.exclude_patterns ?? [];
  const exceptions = metadata.exceptions ?? [];
  const gitignore = loadGitignore(resolvedRoot);

  const currentFiles = selectFiles(
    resolvedRoot,
    includePatterns,
    excludePatterns,
    exceptions,
    gitignore,
  );

  const currentHashes = Object.fromEntries(
    currentFiles.map((filePath) => [
      path.relative(resolvedRoot, filePath).replaceAll(path.sep, '/'),
      computeFileHash(filePath),
    ]),
  );

  const savedHashes = state.file_hashes ?? {};
  const currentPaths = new Set(Object.keys(currentHashes));
  const savedPaths = new Set(Object.keys(savedHashes));

  const added = [...currentPaths]
    .filter((filePath) => !savedPaths.has(filePath))
    .sort();
  const removed = [...savedPaths]
    .filter((filePath) => !currentPaths.has(filePath))
    .sort();
  const modified = [...currentPaths]
    .filter((filePath) => savedPaths.has(filePath))
    .filter((filePath) => currentHashes[filePath] !== savedHashes[filePath])
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
  const currentFolders = foldersOf(currentPaths);
  const savedFolders = foldersOf(savedPaths);
  const emptied = [...savedFolders]
    .filter((folder) => !currentFolders.has(folder))
    .sort();
  const affected = [...foldersOf([...added, ...removed, ...modified])]
    .filter((folder) => currentFolders.has(folder))
    .sort();
  const fresh = affected.filter((folder) => !savedFolders.has(folder));

  console.log(`\n${affected.length} folders affected:`);
  for (const folder of affected) console.log(`  ${folder}/`);

  if (fresh.length) {
    console.log(`\n${fresh.length} new folders (no previous map; write in full):`);
    for (const folder of fresh) console.log(`  ${folder}/`);
  }

  if (emptied.length) {
    console.log(
      `\n${emptied.length} emptied folders (no selected files left; codemap.md is orphaned):`,
    );
    for (const folder of emptied) console.log(`  ${folder}/`);
  }

  console.log(
    '\nRoot atlas: re-assemble ./codemap.md after refreshing the folders above.',
  );
  return 0;
}

export function cmdUpdate({ root }) {
  const resolvedRoot = path.resolve(root);
  const state = loadState(resolvedRoot);
  if (!state) {
    console.error("No codemap state found. Run 'init' first.");
    return 1;
  }

  const metadata = state.metadata ?? {};
  const includePatterns = metadata.include_patterns ?? ['**/*'];
  const excludePatterns = metadata.exclude_patterns ?? [];
  const exceptions = metadata.exceptions ?? [];
  const gitignore = loadGitignore(resolvedRoot);

  const selectedFiles = selectFiles(
    resolvedRoot,
    includePatterns,
    excludePatterns,
    exceptions,
    gitignore,
  );

  const { state: nextState } = buildState(
    resolvedRoot,
    includePatterns,
    excludePatterns,
    exceptions,
    selectedFiles,
  );

  saveState(resolvedRoot, nextState);
  console.log(
    `Updated ${STATE_DIR}/${STATE_FILE} with ${selectedFiles.length} files`,
  );
  return 0;
}

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = { include: [], exclude: [], exception: [] };

  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    const value = rest[i + 1];

    if (!arg?.startsWith('--')) continue;
    if (arg === '--rescope') {
      options.rescope = true;
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
        'Usage: codemap.mjs <init|changes|update> --root /path [--include glob] [--exclude glob] [--exception path] [--rescope]',
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
