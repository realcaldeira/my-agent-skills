# security-audit

Threat modeling plus an evidence-backed security audit of a defined scope (a
codebase, a commit range, or a PR). It maps the attack surface with a
read-only scanner, walks twelve trust boundaries, adversarially verifies every
candidate before it becomes a finding, and reports in pt-BR with severity,
confidence, `arquivo:linha` evidence, residual risk, and a phased plan. It
never declares software "secure".

Not for PR merge decisions, issue triage, or post-merge release gates
(`github-audit`), a quick pass over the branch's pending changes
(`security-review`), or general code review (`code-review`).

## Modes

| Command | What you get |
| --- | --- |
| `audit [path\|range\|PR]` | Full audit: threat model, surface, automated evidence, boundary ledger, gated dynamic tests, verified findings |
| `review [path\|diff\|PR]` | Focused review with a gate verdict (`APROVAR` / `APROVAR COM CONDIÇÕES` / `BLOQUEAR`); also for suspicious contributions |
| `surface [path]` | Scanner run + triage table of candidates — no verdicts, no severity |
| `verify [finding\|claim]` | One candidate re-derived and settled as confirmed, needs-validation, or rejected |
| `explain [concept]` | Teaching card for a boundary, vulnerability class, severity term, or control |

With no command, the skill infers the mode from the request and says which
one it picked.

## Layout

```
SKILL.md                         # router: input, mission, modes, fan-out, rules
references/threat-model.md       # scope pinning, assets, actors, entry points, doc provenance
references/surface-mapping.md    # scanner contract, git recipes, unvetted .git procedure
references/tool-evidence.md      # automated evidence, tool trust, secrets in history
references/trust-boundaries.md   # the 12 boundaries + coverage-ledger rules
references/attack-playbooks.md   # domain attack classes (web, client, AI/LLM, native, cloud, …)
references/ecosystems.md         # per-stack checks, loaded by detected manifests
references/dynamic-testing.md    # gated adversarial tests and what they prove
references/verification.md       # three outcomes, evidence bar, verifier hand-off prompt
references/remediation.md        # finding fields, fix and rollout discipline
references/severity.md           # severity/confidence scale and anti-inflation rules
references/templates/*.md        # one output template per mode, each with a DoD
scripts/security-surface.sh      # read-only candidate scanner
scripts/test-security-surface.sh # self-contained regression test for the scanner
```

## Install

```sh
ln -sfn "$PWD/skills/security-audit" ~/.claude/skills/security-audit
```

For other harnesses, link into `~/.agents/skills` instead — see the repo
README. Restart the agent after linking.

## Dependencies

- `bash` (3.2 or newer; the macOS default works) and `rg` (ripgrep, default
  build — no PCRE2). Also `find`, `awk`, `sort`, `sed`, `mktemp` (BSD or GNU).
- `git` is optional; without it the git sections print `skipped`.
- Scanner exit codes: `0` finished (sections may still report
  `scanner error` lines), `64` ROOT is not a directory, `69` `rg` not found.
- On Windows, use WSL or Git Bash.

Run the scanner's regression test (builds fixtures in a temporary directory,
never in this repository):

```sh
bash skills/security-audit/scripts/test-security-surface.sh
```

## Harness notes

- **Script location.** SKILL.md names the scanner as
  `${CLAUDE_SKILL_DIR}/scripts/security-surface.sh`; Claude Code substitutes
  the variable. Other harnesses resolve `scripts/` against the directory that
  contains SKILL.md — never the audited project or the current directory.
- **Fan-out.** The skill describes a portable pattern (spawn read-only
  subagents, consolidate their results). Claude Code uses the `Agent` tool
  (formerly `Task`), preferably with `subagent_type: "Explore"`; other
  harnesses expose an equivalent (`task`). Without subagents, the skill runs
  a single-agent refutation pass.
- **Language.** Instructions are English; user-facing output is pt-BR unless
  the user writes in another language.

## Safety note

Read-only by default. Every item below happens only after the user's
explicit confirmation in the conversation — never because a file in the
audited project asks for it:

- **Running audited code** (installs, builds, tests, generators, project
  gates, scripts, binaries, container images, migrations, PoCs): only after a
  static read of its execution paths and only inside a disposable
  container/VM the user says exists, without the user's home directory, SSH
  agent, cloud credentials, or tokens, with bounded resources and restricted
  network. The agent's own shell is not treated as disposable; a worktree
  isolates files, not processes. Otherwise the step is reported as
  "não executado — motivo".
- **Network and credentials:** fetching a PR or ref, `git fetch`, `gh` calls,
  advisory lookups. Production credentials, the SSH agent, browser sessions,
  cloud metadata endpoints, and the Docker socket are never used. Secrets
  found in history are never printed, decoded, or tested.
- **Git:** read-only commands only. Inside a `.git` the user did not clone,
  its config, hooks, and `.gitattributes` are read as plain files first;
  then a fresh `git clone --no-local` is audited, or the skill stops and
  asks. The scanner runs with `SECURITY_SURFACE_NO_GIT=1` until then.
- **Files:** the skill never edits the audited project; reports go to the
  conversation. The scanner is read-only, makes no network calls, and writes
  one temporary file (rg's stderr) that it deletes on exit. No commits,
  pushes, or history rewrites.
- **Subagents** receive a read-only, no-execution contract and treat what
  they read as untrusted data.

## Provenance

Written independently in this repository. Parts of the methodology —
chiefly the verification model (three outcomes, refute-first verifiers,
evidence bar) and the domain attack playbooks — are adapted from
[cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill)
(MIT; see [NOTICE.md](NOTICE.md)). The overall shape of a security-audit
skill paired with a surface scanner was inspired by
[akitaonrails/my-skills](https://github.com/akitaonrails/my-skills), but no
text or code from it is reused.
