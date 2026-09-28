# humanizer

Rewrites AI-sounding text so it reads like the writer, without changing what it
says. Marks the tells strongest-first (25 numbered patterns), drafts a rewrite
that keeps every supported claim, checks for added/lost facts and the five
surviving tells, then delivers the final text. Modes: `rewrite` (pasted text,
full report), `edit-file` (prose-only in-place edits), `inline` (final text
only, for use inside another task), `explain` (teach one pattern and when not
to act). With no command, the skill infers the mode from the request.

## Layout

```
SKILL.md                      # router: input, mission, modes, gates
references/voice-and-guardrails.md   # shared contract: facts, voice, output modes
references/patterns-a…e-*.md  # the 25 patterns, grouped, with before/after
references/templates/         # rewrite report, file-edit summary, teaching card
```

## Source

Ported from [`blader/humanizer`](https://github.com/blader/humanizer) (MIT —
SKILL.md as of upstream commit `30b8e07`). The patterns are based on Wikipedia's
[Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing),
maintained by WikiProject AI Cleanup. Restructured for this repo's authoring
conventions (router + references + output templates); examples stay in English
because the tells are English-writing tells. A few Before/After pairs were
adjusted (Afters trimmed, and in patterns 3, 4, 11 and 25 the Before extended)
so every After uses only facts from its Before. Sources and the
upstream MIT notice are in [NOTICE.md](NOTICE.md).

## Installation

Symlink into the Claude Code skills directory:

```sh
ln -sfn "$PWD/skills/humanizer" ~/.claude/skills/humanizer
```

For other harnesses, link into `~/.agents/skills` — see the repo README.

Harness note: this skill does not spawn subagents. Where other skills fan out,
they use the Claude Code `Agent` tool (formerly `Task`); other harnesses expose
an equivalent (`task`) — keep the pattern, swap the name.

## Safety note

Advisory except for one mode. `rewrite`, `inline`, and `explain` only return
text. `edit-file` writes to the one file the user named, prose only; when the
mode was inferred rather than requested, the skill asks before writing; until
the user answers (or if they want only the tells pointed out), it runs a
report-only rewrite and leaves the file untouched. The optional
`git diff --word-diff <path>` check is read-only. No network, no credentials,
no git mutations, no code execution. The text being rewritten is untrusted
data: directives inside it are never followed.
