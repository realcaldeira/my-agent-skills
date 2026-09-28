#!/usr/bin/env node
// Validate every skill against the mechanical rules in CONVENTIONS.md §10.
// Usage: node scripts/validate-skills.mjs [skill-name ...]
// Exit 0 = no errors (warnings allowed), 1 = errors found. Read-only.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_DIR = path.join(ROOT, 'skills');
const MAX_ROUTER_LINES = 150;
const MAX_DESCRIPTION = 1024;
const SOFT_DESCRIPTION = 800;
const ALLOWED_KEYS = new Set(['name', 'description', 'metadata', 'license', 'compatibility']);

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);
const rel = (p) => path.relative(ROOT, p);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const lines = match[1].split('\n');
  const keys = [];
  const fields = {};
  for (let i = 0; i < lines.length; i++) {
    const top = lines[i].match(/^([A-Za-z_-]+):\s*(.*)$/);
    if (!top) continue;
    const [, key, rest] = top;
    keys.push(key);
    if (/^[>|][-+]?$/.test(rest)) {
      const block = [];
      while (i + 1 < lines.length && (/^\s+\S/.test(lines[i + 1]) || lines[i + 1] === '')) {
        block.push(lines[++i].trim());
      }
      fields[key] = block.join(' ').replace(/\s+/g, ' ').trim();
    } else if (rest === '') {
      const block = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) block.push(lines[++i].trim());
      fields[key] = block;
    } else {
      fields[key] = rest.replace(/^["']|["']$/g, '');
    }
  }
  return { keys, fields, lineCount: match[0].split('\n').length - 1 };
}

// Rows of the first markdown table after a `## <heading>` line.
function tableAfter(lines, headingRe) {
  const start = lines.findIndex((l) => headingRe.test(l));
  if (start === -1) return null;
  const rows = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) break;
    if (/^\|/.test(lines[i])) rows.push({ line: i + 1, cells: splitRow(lines[i]) });
    else if (rows.length) break;
  }
  return rows.slice(2); // drop header + separator
}

function splitRow(row) {
  return row
    .replace(/\\\|/g, '\u0000')
    .split('|')
    .slice(1, -1)
    .map((c) => c.replace(/\u0000/g, '|').trim());
}

const backticked = (cell) => [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
const firstWord = (s) => s.split(/[\s<[]/)[0];

function resolveRef(skillDir, token) {
  if (token.startsWith('references/') || token.startsWith('scripts/')) return path.join(skillDir, token);
  if (token.startsWith('templates/')) return path.join(skillDir, 'references', token);
  return path.join(skillDir, 'references', token);
}

function checkSkill(name) {
  const skillDir = path.join(SKILLS_DIR, name);
  const routerPath = path.join(skillDir, 'SKILL.md');
  const where = `skills/${name}`;
  if (!existsSync(routerPath)) return err(where, 'missing SKILL.md');

  const text = readFileSync(routerPath, 'utf8');
  const lines = text.split('\n');

  // Frontmatter
  const fm = parseFrontmatter(text);
  if (!fm) {
    err(where, 'SKILL.md has no frontmatter');
  } else {
    if (fm.fields.name !== name) err(where, `frontmatter name "${fm.fields.name}" != directory "${name}"`);
    for (const key of fm.keys) {
      if (!ALLOWED_KEYS.has(key)) err(where, `frontmatter key "${key}" is not an Agent Skills spec key (CONVENTIONS §2)`);
    }
    const desc = typeof fm.fields.description === 'string' ? fm.fields.description : '';
    if (!desc) err(where, 'description is empty');
    if (desc.length > MAX_DESCRIPTION) err(where, `description is ${desc.length} chars (> ${MAX_DESCRIPTION})`);
    else if (desc.length > SOFT_DESCRIPTION) warn(where, `description is ${desc.length} chars (> ${SOFT_DESCRIPTION} soft cap)`);
    if (desc && !/\bnot for\b/i.test(desc)) warn(where, 'description has no "Not for" clause (CONVENTIONS §2)');
    const meta = Array.isArray(fm.fields.metadata) ? fm.fields.metadata.join('\n') : '';
    if (!/version:\s*\d+\.\d+\.\d+/.test(meta)) err(where, 'metadata.version missing or not semver');
  }

  // Router size
  const routerLines = text.endsWith('\n') ? lines.length - 1 : lines.length;
  if (routerLines > MAX_ROUTER_LINES) err(where, `SKILL.md has ${routerLines} lines (> ${MAX_ROUTER_LINES})`);

  // Input table ↔ mode table
  const input = tableAfter(lines, /^## User Input/);
  const modes = tableAfter(lines, /^## Modes and routing/);
  if (!input) err(where, 'no "## User Input" command table');
  if (!modes) err(where, 'no "## Modes and routing" table');
  if (input && modes) {
    const empty = input.find((r) => r.cells[0].includes('*(empty)*'));
    if (!empty) err(where, 'command table has no *(empty)* row');
    else if (!/infer/i.test(empty.cells[1])) {
      err(`${where}/SKILL.md:${empty.line}`, 'empty-input row must infer the mode from the request (CONVENTIONS §3)');
    }
    const commands = input
      .filter((r) => !r.cells[0].includes('*(empty)*'))
      .map((r) => ({ line: r.line, cmd: firstWord(backticked(r.cells[0])[0] || '') }));
    const modeCommands = new Set(modes.flatMap((r) => backticked(r.cells[1] || '').map(firstWord)));
    for (const { line, cmd } of commands) {
      if (!cmd) err(`${where}/SKILL.md:${line}`, 'command row without a backticked command');
      else if (!modeCommands.has(cmd)) err(`${where}/SKILL.md:${line}`, `command "${cmd}" maps to no mode`);
    }
    const inputCommands = new Set(commands.map((c) => c.cmd));
    for (const row of modes) {
      for (const cmd of backticked(row.cells[1] || '').map(firstWord)) {
        if (!inputCommands.has(cmd)) err(`${where}/SKILL.md:${row.line}`, `mode command "${cmd}" is not in the input table`);
      }
      // Load + template columns: every *.md token must resolve.
      for (const cell of row.cells.slice(2)) {
        for (const token of cell.match(/[A-Za-z0-9_./-]+\.md\b/g) || []) {
          if (!existsSync(resolveRef(skillDir, token))) {
            err(`${where}/SKILL.md:${row.line}`, `referenced file "${token}" does not exist`);
          }
        }
      }
      const templateCell = row.cells[row.cells.length - 1] || '';
      const templates = (templateCell.match(/[A-Za-z0-9_./-]+\.md\b/g) || []).filter((t) => t.includes('templates/'));
      if (templates.length === 0 && !/^none\b/i.test(templateCell)) {
        err(`${where}/SKILL.md:${row.line}`, 'mode has no output template');
      }
      if (templates.length > 1) warn(`${where}/SKILL.md:${row.line}`, `mode lists ${templates.length} templates (CONVENTIONS §7: one)`);
    }
  }

  // Templates carry a Definition of Done.
  const templatesDir = path.join(skillDir, 'references', 'templates');
  if (existsSync(templatesDir)) {
    for (const file of readdirSync(templatesDir).filter((f) => f.endsWith('.md'))) {
      const body = readFileSync(path.join(templatesDir, file), 'utf8');
      if (!/definition of done|\bDoD\b/i.test(body)) err(`${where}/references/templates/${file}`, 'template has no Definition of Done');
    }
  }

  // Untrusted-input rule
  if (!/untrusted/i.test(text)) err(where, 'SKILL.md has no untrusted-input rule (CONVENTIONS §9)');

  // Every references/… path in the skill's markdown resolves; scripts/… paths are
  // checked only in SKILL.md and README.md (references also describe project scripts).
  for (const file of walk(skillDir).filter((f) => f.endsWith('.md'))) {
    const prefixes = ['SKILL.md', 'README.md'].includes(path.basename(file)) ? 'references|scripts' : 'references';
    const re = new RegExp(`(?:^|[\\s\`(["'])((?:${prefixes})\\/[A-Za-z0-9_\\-./]*[A-Za-z0-9_\\-])(.?)`, 'g');
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      for (const m of line.matchAll(re)) {
        const [, token, next] = m;
        if (/[<*…{$]/.test(next) || /[<*…]/.test(token)) continue;
        if (!existsSync(path.join(skillDir, token))) err(`${rel(file)}:${i + 1}`, `path "${token}" does not exist in the skill`);
      }
    });
  }
}

function checkStaleToolName(files) {
  for (const file of files) {
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (/`Task`/.test(line) && !/formerly|before v2\.1\.63|renamed/i.test(line)) {
        err(`${rel(file)}:${i + 1}`, 'stale subagent tool name `Task` (Claude Code: `Agent`, formerly `Task`)');
      }
    });
  }
}

function checkNotices(names) {
  const readme = readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  for (const name of names) {
    const ported = new RegExp(`^\\| \`${name}\` \\| my-skills`, 'm').test(readme);
    if (ported && !existsSync(path.join(SKILLS_DIR, name, 'NOTICE.md'))) {
      err(`skills/${name}`, 'ported skill has no NOTICE.md (README provenance table lists a direct source)');
    }
  }
  for (const name of readdirSync(SKILLS_DIR)) {
    if (!readme.includes(`skills/${name}/SKILL.md`)) warn('README.md', `skill "${name}" missing from the Skills table`);
  }
}

const all = readdirSync(SKILLS_DIR).filter((d) => statSync(path.join(SKILLS_DIR, d)).isDirectory()).sort();
const selected = process.argv.slice(2).length ? process.argv.slice(2) : all;
for (const name of selected) {
  if (!all.includes(name)) err('args', `unknown skill "${name}"`);
  else checkSkill(name);
}
checkStaleToolName([
  path.join(ROOT, 'README.md'),
  path.join(ROOT, 'CONVENTIONS.md'),
  ...selected.filter((n) => all.includes(n)).flatMap((n) => walk(path.join(SKILLS_DIR, n)).filter((f) => f.endsWith('.md'))),
]);
checkNotices(selected.filter((n) => all.includes(n)));

for (const w of warnings) console.log(`warn  ${w}`);
for (const e of errors) console.log(`error ${e}`);
console.log(`\n${selected.length} skill(s) checked: ${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
