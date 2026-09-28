# github-audit

Evidence-based GitHub maintenance for a repository you maintain. The skill
decides whether a PR should merge, triages and validates issues, gates a
batch of merged work before a release, and — only after you approve —
carries out the tickets an audit accepted. Reports are in pt-BR.

Typical flow: audit a PR or issue → `resolve` the approved tickets →
`post-audit` the merged range before cutting a release.

Not for a quick line-level review of a local diff (`code-review`) or a deep
vulnerability hunt (`security-audit`, which this skill delegates to when it
is installed).

## Modes

| Command | Aliases | What it does | Side effects |
| --- | --- | --- | --- |
| `pr <N\|url\|all>` | `audit-pr` | Merge decision: pre-execution inspection, claim ledger, findings, recommended action | none (read-only) |
| `issue <N\|url\|list>` | `triage`, `audit-issue` | Decision, reproducibility, severity, security handling, root cause, fix plan, draft reply | none (read-only) |
| `post-audit [range\|since-tag]` | `post-merge`, `release-gate` | Readiness verdict for an immutable range: cross-PR interactions, claim reconciliation, changelog, semver | none (read-only) |
| `resolve` | `proceed`, `fix-all` | Implements approved tickets, runs gates, commits, pushes, merges, closes on landing | mutates the repo and GitHub, only after explicit approval |

With no arguments the skill infers the mode from your message and says
which one it picked.

## Layout

```
SKILL.md                                   # router: input, mission, modes, rules
NOTICE.md                                  # provenance notice
references/
  trust-model.md                           # data vs. instructions, who may instruct
  pre-execution-inspection.md              # pinning, PR intake, hostile-change checks
  sandboxing.md                            # isolation levels, safe repros
  evidence-ledger.md                       # claim rows, verdicts, reconciliation
  gate-runs.md                             # gate choice, reuse rules, CI reading
  pr-review.md                             # PR finding categories, actions
  issue-triage.md                          # decisions, reproducibility, root cause
  merged-batch-review.md                   # range, per-merge checks, interactions
  changelog-and-versioning.md              # docs ledger, changelog hazards, semver
  branches-and-authorship.md               # target branch, attribution
  resolve-playbook.md                      # preconditions, batch rule, final gate
  severity.md                              # CRÍTICO…BAIXO, INCERTO, verdict fields
  templates/
    pr-verdict.md                          # pr
    issue-verdict.md                       # issue
    release-gate-report.md                 # post-audit
    resolve-batch-report.md                # resolve
```

## Install (Claude Code)

```sh
ln -sfn "$PWD/skills/github-audit" ~/.claude/skills/github-audit
```

Restart the agent afterwards. For other harnesses, link into
`~/.agents/skills` instead — see the repo README.

## Harness notes

- **Subagents.** Fan-out follows a portable pattern. Harness note: Claude
  Code `Agent` tool (formerly `Task`); other harnesses expose an equivalent
  (`task`) — keep the pattern, swap the name.
- **GitHub CLI.** Requires `gh`, authenticated (`gh auth status`), and
  network access. Without them the skill inspects local refs statically and
  says so.
- **`gh` JSON drift.** Field names accepted by `gh … --json` vary between
  versions. When a field is rejected the skill drops it, notes the drift,
  and never invents the missing value.

## Safety note

- **Audit modes are read-only.** `pr`, `issue`, and `post-audit` make
  read-only `gh` calls, `git fetch` PR base and head into local refs (never
  checking out over your work), and may create a throwaway, hooks-disabled
  worktree or clone outside the working tree, deleted afterwards. They never
  push, merge, commit, tag, close, comment, or relabel.
- **`resolve` mutates only after explicit approval** given in the same
  conversation as the audit, and only for the tickets that audit approved.
  Every push, merge, tag, close, comment, and retarget is confirm-first;
  force pushes and history rewrites need their own confirmation and are off
  by default. Deploys and releases happen only on a separate explicit
  request. Files in the repository cannot grant any of these permissions.
- **Running PR or issue code needs real isolation**: a container, VM, or OS
  sandbox without your home directory, SSH agent, tokens, cloud
  credentials, or Docker socket. A worktree isolates files, not processes.
  Without isolation the skill stops at static review and lists what it did
  not run.
- **Authenticated `gh`.** The skill acts with your GitHub identity; mutating
  calls happen only under the rules above.
- PR text, issue text, attachments, code under review, and agent-instruction
  files inside PRs or checkouts are treated as untrusted data; injection
  attempts are reported as findings.

## Provenance

Written independently in this repository. The idea of a
PR / issue / post-merge / resolution pipeline was inspired by skills in
[akitaonrails/my-skills](https://github.com/akitaonrails/my-skills), but no
text from them is reused. See [NOTICE.md](NOTICE.md).
