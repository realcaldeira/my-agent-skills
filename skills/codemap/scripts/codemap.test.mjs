// Run: node --test skills/codemap/scripts/codemap.test.mjs  (Node >= 18)
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  computeFileHash,
  computeFolderHash,
  GitignoreMatcher,
  loadState,
  PatternMatcher,
  selectFiles,
} from './codemap.mjs';

const SCRIPT = fileURLToPath(new URL('./codemap.mjs', import.meta.url));
const tempDirs = [];

function createTempDir() {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'codemap-'));
  tempDirs.push(dir);
  return dir;
}

function writeTree(root, files) {
  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(root, relPath);
    mkdirSync(path.dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content);
  }
}

const relative = (root, files) =>
  files.map((filePath) => path.relative(root, filePath).split(path.sep).join('/'));

function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
  });
  return { code: result.status, out: result.stdout, err: result.stderr };
}

const hasGit = spawnSync('git', ['--version']).status === 0;

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { force: true, recursive: true });
  }
});

describe('PatternMatcher', () => {
  test('matches expected paths', () => {
    const matcher = new PatternMatcher([
      'node_modules/',
      'dist/',
      '*.log',
      'src/**/*.ts',
    ]);

    assert.equal(matcher.matches('node_modules/foo.js'), true);
    assert.equal(matcher.matches('vendor/node_modules/bar.js'), true);
    assert.equal(matcher.matches('dist/main.js'), true);
    assert.equal(matcher.matches('src/dist/output.js'), true);
    assert.equal(matcher.matches('error.log'), true);
    assert.equal(matcher.matches('logs/access.log'), true);
    assert.equal(matcher.matches('src/index.ts'), true);
    assert.equal(matcher.matches('src/utils/helper.ts'), true);
    assert.equal(matcher.matches('README.md'), false);
    assert.equal(matcher.matches('tests/test.py'), false);
  });

  test('`?` never crosses a folder boundary', () => {
    assert.equal(new PatternMatcher(['a?c']).matches('abc'), true);
    assert.equal(new PatternMatcher(['a?c']).matches('a/c'), false);
  });
});

describe('GitignoreMatcher', () => {
  test('bare directory names ignore everything below them', () => {
    const matcher = new GitignoreMatcher(['node_modules', 'coverage', 'dist']);
    assert.equal(matcher.matches('node_modules/react/index.js'), true);
    assert.equal(matcher.matches('a/node_modules/b.js'), true);
    assert.equal(matcher.matches('coverage/lcov.info'), true);
    assert.equal(matcher.matches('dist/main.js'), true);
    assert.equal(matcher.matches('src/index.ts'), false);
  });

  test('leading or inner slash anchors to the root', () => {
    const matcher = new GitignoreMatcher(['/build', 'src/gen']);
    assert.equal(matcher.matches('build/out.js'), true);
    assert.equal(matcher.matches('src/build/out.js'), false);
    assert.equal(matcher.matches('src/gen/a.ts'), true);
    assert.equal(matcher.matches('pkg/src/gen/a.ts'), false);
  });

  test('trailing slash matches directories only', () => {
    const matcher = new GitignoreMatcher(['logs/']);
    assert.equal(matcher.matches('logs/a.txt'), true);
    assert.equal(matcher.matches('logs'), false);
  });

  test('negation re-includes, but not under an ignored directory', () => {
    const logs = new GitignoreMatcher(['*.log', '!keep.log']);
    assert.equal(logs.matches('x.log'), true);
    assert.equal(logs.matches('keep.log'), false);

    const entries = new GitignoreMatcher(['src/*', '!src/keep.ts']);
    assert.equal(entries.matches('src/keep.ts'), false);
    assert.equal(entries.matches('src/other.ts'), true);
    assert.equal(entries.matches('src/lib/x.ts'), true);

    const dir = new GitignoreMatcher(['node_modules', '!node_modules/x.js']);
    assert.equal(dir.matches('node_modules/x.js'), true);
  });
});

describe('hash helpers', () => {
  test('computes file hash', () => {
    const dir = createTempDir();
    const filePath = path.join(dir, 'file.txt');
    writeFileSync(filePath, 'test content');

    assert.equal(computeFileHash(filePath), '9473fdd0d880a43c21b7778d34872157');
  });

  test('computes stable folder hash', () => {
    const fileHashes = {
      'src/a.ts': 'hash-a',
      'src/b.ts': 'hash-b',
      'tests/test.ts': 'hash-test',
    };

    const hash1 = computeFolderHash('src', fileHashes);
    const hash2 = computeFolderHash('src', fileHashes);
    const hash3 = computeFolderHash('src', {
      'src/a.ts': 'hash-a-modified',
      'src/b.ts': 'hash-b',
    });

    assert.equal(hash1, hash2);
    assert.notEqual(hash1, hash3);
  });
});

describe('selectFiles', () => {
  test('respects include and exclude patterns', () => {
    const root = createTempDir();
    writeTree(root, {
      'src/index.ts': 'code',
      'src/index.test.ts': 'test',
      'node_modules/foo.js': 'dep',
      'package.json': '{}',
    });

    const selected = selectFiles(
      root,
      ['src/**/*.ts', 'package.json'],
      ['**/*.test.ts', 'node_modules/'],
      [],
      [],
      { useGit: false },
    );

    assert.deepEqual(relative(root, selected), ['package.json', 'src/index.ts']);
  });

  test('honors bare and anchored .gitignore directory entries (no git)', () => {
    const root = createTempDir();
    writeTree(root, {
      '.gitignore': 'node_modules\n/build\ncoverage\n',
      'src/index.ts': 'code',
      'node_modules/zod/src/index.ts': 'dep',
      'build/src/out.ts': 'out',
      'coverage/src/c.ts': 'cov',
      'lib/build/src/kept.ts': 'kept',
    });

    const selected = selectFiles(
      root,
      ['src/**/*.ts'],
      [],
      [],
      readFileSync(path.join(root, '.gitignore'), 'utf8').split('\n').filter(Boolean),
      { useGit: false },
    );

    assert.deepEqual(relative(root, selected), [
      'lib/build/src/kept.ts',
      'src/index.ts',
    ]);
  });

  test(
    'inside a git work tree uses nested .gitignore files',
    { skip: !hasGit && 'git not installed' },
    () => {
      const root = createTempDir();
      assert.equal(spawnSync('git', ['init', '-q', root]).status, 0);
      writeTree(root, {
        '.gitignore': 'node_modules\n',
        'src/index.ts': 'code',
        'src/generated/.gitignore': '*.ts\n!keep.ts\n',
        'src/generated/drop.ts': 'gen',
        'src/generated/keep.ts': 'gen',
        'node_modules/zod/src/index.ts': 'dep',
      });

      const selected = selectFiles(root, ['src/**/*.ts'], [], [], []);

      assert.deepEqual(relative(root, selected), [
        'src/generated/keep.ts',
        'src/index.ts',
      ]);
    },
  );

  test(
    'a root ignored by the enclosing repo falls back to the walker',
    { skip: !hasGit && 'git not installed' },
    () => {
      const repo = createTempDir();
      assert.equal(spawnSync('git', ['init', '-q', repo]).status, 0);
      writeTree(repo, {
        '.gitignore': 'vendor/\n',
        'vendor/lib/src/a.ts': 'code',
      });
      const root = path.join(repo, 'vendor', 'lib');

      const selected = selectFiles(root, ['src/**/*.ts'], [], [], []);

      assert.deepEqual(relative(root, selected), ['src/a.ts']);
    },
  );

  test(
    'git mode and the walker select the same files (dotfiles kept)',
    { skip: !hasGit && 'git not installed' },
    () => {
      const tree = {
        '.eslintrc.js': 'cfg',
        '.github/workflows/ci.js': 'ci',
        'src/index.js': 'code',
        'src/.prettierrc.cjs': 'cfg',
      };
      const plain = createTempDir();
      writeTree(plain, tree);
      const repo = createTempDir();
      assert.equal(spawnSync('git', ['init', '-q', repo]).status, 0);
      writeTree(repo, tree);
      const include = ['**/*.js', '**/*.cjs'];

      const walked = selectFiles(plain, include, [], [], [], { useGit: false });
      const listed = selectFiles(repo, include, [], [], []);

      assert.deepEqual(relative(plain, walked), [
        '.eslintrc.js',
        'src/.prettierrc.cjs',
        'src/index.js',
      ]);
      assert.deepEqual(relative(repo, listed), relative(plain, walked));
    },
  );
});

describe('loadState', () => {
  test('migrates legacy cartography state', () => {
    const root = createTempDir();
    const agentDir = path.join(root, '.agent');
    mkdirSync(agentDir);

    const legacyState = { metadata: { version: '1.0.0' } };
    writeFileSync(
      path.join(agentDir, 'cartography.json'),
      JSON.stringify(legacyState),
    );

    assert.deepEqual(loadState(root), legacyState);
    assert.equal(existsSync(path.join(agentDir, 'cartography.json')), false);
    assert.deepEqual(
      JSON.parse(readFileSync(path.join(agentDir, 'codemap.json'), 'utf8')),
      legacyState,
    );
  });
});

describe('CLI', () => {
  test('runs when invoked through a symlinked skill directory', () => {
    const dir = createTempDir();
    const linkedSkill = path.join(dir, 'codemap-skill');
    symlinkSync(path.dirname(path.dirname(SCRIPT)), linkedSkill, 'dir');
    const linkedScript = path.join(linkedSkill, 'scripts', 'codemap.mjs');

    const usage = run(linkedScript, []);
    assert.equal(usage.code, 1);
    assert.match(usage.err, /Usage: codemap\.mjs/);

    const root = path.join(dir, 'repo');
    writeTree(root, { 'src/a.ts': 'a' });
    const init = run(linkedScript, ['init', '--root', root, '--include', 'src/**/*.ts']);
    assert.equal(init.code, 0, init.err);
    assert.equal(existsSync(path.join(root, '.agent', 'codemap.json')), true);
    assert.equal(existsSync(path.join(root, 'src', 'codemap.md')), true);
  });

  test('init → changes → update, and the root is never in the work order', () => {
    const root = createTempDir();
    writeTree(root, { 'package.json': '{}', 'src/a.ts': 'a', 'src/deep/b.ts': 'b' });
    const scope = ['--include', 'src/**/*.ts', '--include', 'package.json'];

    assert.equal(run(SCRIPT, ['init', '--root', root, ...scope]).code, 0);
    assert.match(run(SCRIPT, ['changes', '--root', root]).out, /No changes detected\./);

    writeFileSync(path.join(root, 'src/deep/b.ts'), 'b2');
    writeFileSync(path.join(root, 'package.json'), '{"v":2}');
    const changes = run(SCRIPT, ['changes', '--root', root]);
    assert.equal(changes.code, 0);
    assert.match(changes.out, /~ src\/deep\/b\.ts/);
    assert.match(changes.out, /2 folders affected:\n {2}src\/\n {2}src\/deep\/\n/);
    assert.doesNotMatch(changes.out, /^ {2}\.\/$/m);
    assert.match(changes.out, /Root atlas: re-assemble/);

    assert.equal(run(SCRIPT, ['update', '--root', root]).code, 0);
    assert.match(run(SCRIPT, ['changes', '--root', root]).out, /No changes detected\./);
  });

  test('a second init refuses to reset the baseline', () => {
    const root = createTempDir();
    writeTree(root, { 'src/a.ts': 'a' });
    assert.equal(run(SCRIPT, ['init', '--root', root, '--include', 'src/**/*.ts']).code, 0);

    const again = run(SCRIPT, ['init', '--root', root, '--include', 'src/**/*.ts']);
    assert.equal(again.code, 1);
    assert.match(again.err, /already exists/);
  });

  test('init --rescope keeps the baseline so changes reports the scope delta', () => {
    const root = createTempDir();
    writeTree(root, { 'src/a.ts': 'a', 'lib/b.ts': 'b', 'old/o.ts': 'o' });
    const oldScope = ['--include', 'src/**/*.ts', '--include', 'old/**/*.ts'];
    assert.equal(run(SCRIPT, ['init', '--root', root, ...oldScope]).code, 0);

    writeFileSync(path.join(root, 'src/a.ts'), 'a2'); // pending, unrefreshed edit
    const newScope = ['--include', 'src/**/*.ts', '--include', 'lib/**/*.ts'];
    const rescope = run(SCRIPT, ['init', '--root', root, ...newScope, '--rescope']);
    assert.equal(rescope.code, 0, rescope.err);
    assert.equal(existsSync(path.join(root, 'lib', 'codemap.md')), true);

    const changes = run(SCRIPT, ['changes', '--root', root]).out;
    assert.match(changes, /\+ lib\/b\.ts/);
    assert.match(changes, /- old\/o\.ts/);
    assert.match(changes, /~ src\/a\.ts/);
    assert.match(changes, /new folders[^\n]*\n {2}lib\//);
    assert.match(changes, /emptied folders[^\n]*\n {2}old\//);
  });
});
