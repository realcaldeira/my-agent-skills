# simplify

Behavior-preserving code simplification. Reduces complexity — deep nesting,
long functions, nested ternaries, boolean flag arguments, duplication, dead
code — so code is easier to read, understand, modify, and debug. Modes:
`apply` (edit in place), `review` (candidates only), `explain` (teach a
technique and when NOT to apply it). Output is in pt-BR.

Not for bug hunting or PR review (`code-review`), module/interface redesign
(`improve-codebase-architecture`), or DDD modeling (`ddd`).

## Layout

```
SKILL.md                    # router: input, mission, modes, fan-out, rules
references/principles.md    # the five principles, parity questions, out of scope
references/simplification-signals.md  # understand-first questions + 9 signals
references/verification.md  # apply loop, size gate, revert discipline, checklist
references/templates/*.md   # one output template per mode, each with a DoD
```

## Installation

```sh
ln -sfn "$PWD/skills/simplify" ~/.claude/skills/simplify
```

For other harnesses, link into `~/.agents/skills` — see the repo README.

Harness note (subagent fan-out): Claude Code `Agent` tool (formerly `Task`);
other harnesses expose an equivalent (`task`) — keep the pattern, swap the
name.

### Overrides the bundled `/simplify`

Claude Code ships a bundled `/simplify` (a cleanup-only review that applies
fixes without hunting for bugs). A personal skill with the same name replaces
it, so installing this one into `~/.claude/skills` makes `/simplify` load this
skill instead. `/code-review --fix` stays available for bug finding plus
fixes. To get the bundled command back, remove the symlink — or rename this
skill (directory and `name:` together) if you want both.

## Provenance

Ported from the simplify skill of [alvinunreal/oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim)
(`src/skills/simplify/`, MIT — upstream commit `3b349f13`), which adapts Addy Osmani's
[`code-simplification` skill](https://github.com/addyosmani/agent-skills/blob/main/skills/code-simplification/SKILL.md),
restructured for this repo's conventions (router + references + output
templates). See [`NOTICE.md`](NOTICE.md) for sources and license text.

## Safety note

- **File edits:** only in `apply` mode, on the scoped code. Scopes of more
  than ~10 candidates or ~500 touched lines are listed first and need the
  user's OK. `review` and `explain` are read-only.
- **Running code:** `apply` runs the project's tests, build, typecheck, and
  lint. On a PR from an author outside the user's team this executes
  untrusted code, so it happens only after explicit confirmation and in an
  isolated container/VM (no user home, SSH agent, or tokens); otherwise the
  skill stays in `review`.
- **Git:** no mutations. It never commits unless asked, and reverts only its
  own edits with inverse edits — never `git checkout`/`restore`/`reset`/
  `stash`/`clean`, which would destroy the user's uncommitted work.
- **Network and credentials:** none.
- Code, comments, commit/PR text, and agent-instruction files under analysis
  are treated as untrusted data, never as instructions.
