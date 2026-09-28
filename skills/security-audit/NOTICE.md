# Notices — security-audit

## This skill

The `security-audit` skill (SKILL.md, README.md, `references/`,
`references/templates/`, and both scripts in `scripts/`) is original work
written in this repository and is covered by the repository's root
[LICENSE](../../LICENSE), except for the adapted portions listed below, which
keep the upstream copyright notice and MIT license reproduced at the end of
this file. Keep this file with the skill when copying or symlinking it.

The overall idea of a security-audit skill paired with a surface scanner was
inspired by [akitaonrails/my-skills](https://github.com/akitaonrails/my-skills);
no text or code from that project is used here.

## Portions adapted from cloudflare/security-audit-skill

Source: [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill),
`skills/security-audit/`, commit `c1c8a8c1` (2026-09-14). The material was
reorganized, condensed, and rewritten to fit this skill's modes and
templates; none of the upstream files is copied whole.

| File in this skill | Adapted from (upstream file) | What was adapted |
| --- | --- | --- |
| `references/verification.md` | `VALIDATION-AND-REPORTING.md`, `SKILL.md` | The verification model: refute-first independent verifiers, the confirmed / needs-validation / rejected outcomes, the needs-validation record (missing fact + resolution plan), and not passing the finder's reasoning to the verifier. Tag `[cloudflare verification model]` |
| `references/attack-playbooks.md` | `ATTACK-CLASSES.md`, `WEB-PROTOCOL-AND-AUTH.md`, `CLIENT-SIDE.md`, `AI-AND-LLM.md`, `MEMORY-SAFETY-AND-BINARY.md`, `PROTOCOLS-RPC-AND-MESSAGING.md`, `DATA-ISOLATION-AND-LIFECYCLE.md`, `CLOUD-AND-DEPLOYMENT.md`, `DESKTOP-MOBILE-AND-LOCAL-IPC.md`, `SUPPLY-CHAIN-AND-RELEASE.md`, `RESOURCE-EXHAUSTION-AND-AVAILABILITY.md` | Domain attack classes and their "what a candidate must show" rules, condensed. Tag `[cloudflare hunting]` |
| `references/severity.md` | `SKILL.md` ("Separate priority from certainty") | The high-vs-medium discriminator and "no severity without confirmation" |
| `references/dynamic-testing.md` | `SKILL.md` ("Universal execution safety", "Use bounded local evidence") | Stopping at the minimum observable effect; synthetic data only |

## Upstream license

### [cloudflare/security-audit-skill](https://github.com/cloudflare/security-audit-skill)

```text
MIT License

Copyright (c) 2025-2026 Cloudflare, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
