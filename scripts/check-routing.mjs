#!/usr/bin/env node
// Routing eval: asks a headless Claude Code session each prompt in
// evals/routing.json and records which skill it loads first.
// Usage: node scripts/check-routing.mjs [--model <id>] [--only <skill>] [--limit N]
// Costs tokens (one short session per case). The session only has the Skill
// tool, so it cannot touch files. Exit 1 if any case misroutes.

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_SKILLS = new Set(
  JSON.parse(readFileSync(path.join(ROOT, 'evals/routing.json'), 'utf8')).cases.map((c) => c.expect),
);
REPO_SKILLS.delete('none');

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const known = new Set(['--model', '--only', '--limit']);
for (let i = 0; i < args.length; i += 2) {
  if (!known.has(args[i]) || args[i + 1] === undefined) {
    console.error(`usage: node scripts/check-routing.mjs [--model <id>] [--only <skill>] [--limit N] (bad argument: ${args[i]})`);
    process.exit(2);
  }
}
const model = opt('--model');
const only = opt('--only');
const limit = Number(opt('--limit') || Infinity);
const TIMEOUT_MS = 120_000;

let cases = JSON.parse(readFileSync(path.join(ROOT, 'evals/routing.json'), 'utf8')).cases;
if (only) cases = cases.filter((c) => c.expect === only);
cases = cases.slice(0, limit);

function firstSkill(prompt) {
  return new Promise((resolve) => {
    const argv = [
      '-p', prompt, '--output-format', 'stream-json', '--verbose', '--tools', 'Skill',
      '--no-session-persistence', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
    ];
    if (model) argv.push('--model', model);
    const child = spawn('claude', argv, { stdio: ['ignore', 'pipe', 'ignore'], cwd: tmpdir() });
    let buffer = '';
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      child.kill('SIGTERM');
      resolve(value);
    };
    const timer = setTimeout(() => finish({ skill: null, error: 'timeout' }), TIMEOUT_MS);
    child.stdout.on('data', (chunk) => {
      buffer += chunk;
      let nl;
      while ((nl = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        let event;
        try { event = JSON.parse(line); } catch { continue; }
        const blocks = event?.message?.content;
        if (!Array.isArray(blocks)) continue;
        for (const block of blocks) {
          if (block.type === 'tool_use' && block.name === 'Skill') {
            const name = String(block.input?.skill || block.input?.name || '').replace(/^\//, '');
            return finish({ skill: name });
          }
        }
      }
    });
    child.on('error', (e) => finish({ skill: null, error: e.message }));
    child.on('close', () => finish({ skill: null }));
  });
}

let failures = 0;
for (const c of cases) {
  const { skill, error } = await firstSkill(c.prompt);
  const loadedRepoSkill = skill && REPO_SKILLS.has(skill) ? skill : 'none';
  const ok = loadedRepoSkill === c.expect;
  if (!ok) failures++;
  const got = error ? `error: ${error}` : skill || '(no skill)';
  console.log(`${ok ? 'ok  ' : 'FAIL'} expect=${c.expect.padEnd(30)} got=${got.padEnd(30)} ${c.prompt.slice(0, 70)}`);
}
console.log(`\n${cases.length - failures}/${cases.length} routed as expected`);
process.exit(failures ? 1 : 0);
