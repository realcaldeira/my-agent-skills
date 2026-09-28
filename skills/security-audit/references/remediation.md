# Finding fields, fixes, and rollout

Owner of: the fields every confirmed finding carries, how to write the fix,
and how fixes should roll out. Load in `audit`; `review` follows the same
fields through its template. Severity and confidence labels come from
`severity.md`.

## 1. Required fields per confirmed finding

| Field | What it must say |
| --- | --- |
| Severity + confidence | Label from `severity.md`, plus `proven` / `probable` / `possible` |
| Asset and boundary | What is at risk and which `[boundaries §N]` is crossed |
| Prerequisites and exploit path | Who the attacker is, what they need first, and the realistic path, step by step |
| Evidence | `arquivo:linha` + short snippet for the entry point, each decisive hop, the sink, and the missing/failing control |
| Impact / blast radius | One user, one tenant, all tenants (fleet), or the release chain |
| Remediation | The minimal change at the **owning boundary** — the last trusted decision point — not a patch on the symptom |
| Regression tests | Tests that fail before and pass after, including a legitimate control case |
| Compatibility and rollout | Migration, config or client impact; how to ship it safely |
| Disclosure | Timing and audience (internal fix, coordinated disclosure, advisory), and any embargo the user stated |

A candidate missing any field is not ready; either complete it or send it
back to verification.

## 2. Writing the fix

- Name the invariant the code must enforce ("every read of a document
  checks the caller's membership in the document's workspace"), then the
  narrowest change that enforces it where the decision is made.
- Prefer fixing the shared control over adding checks to each caller —
  unless callers legitimately differ; then say why.
- Advice without a reachable boundary violation (generic hardening) goes to
  positives or next steps, not to the confirmed list.
- The audit describes fixes; it does not edit the audited project.

## 3. Fix and rollout discipline

- One coherent boundary per change. Do not bundle unrelated fixes; a
  reviewer must be able to reason about each.
- One regression test per fix, including the legitimate control case.
- Iterate with focused gates (the affected tests and scanners); run the full
  trusted gate once on the final changed candidate.
- After the fix: rerun the relevant scanners and re-audit **all** callers
  of the touched control, not only the reported path.
- Reuse earlier results only when the immutable inputs and the environment
  are proven equivalent, and say where the result came from. Never reuse
  scanner or policy results whose inputs changed.
- Cancel superseded hosted runs; keep the final exact-tree evidence.
- Preserve history. Rewriting it is the owners' separate decision
  (`tool-evidence.md` §4).
- Weakening tests, lint rules, scanner thresholds or policy to get to green
  is itself a confirmed problem to report.
- Prefer incremental, reversible changes. Phase 1 of the plan fits in one
  sprint and addresses the highest-risk items first.
