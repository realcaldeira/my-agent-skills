# Severity and confidence (fast lookup)

Owner of: severity labels, confidence labels, and the anti-inflation rules.
Cite as `[severity-scale]`. Verification outcomes live in `verification.md`;
this file only says how a **confirmed** finding is ranked.

## Scale

Output uses the Portuguese label; the English term is for cross-reference.

| Label | English | Typical shape (all require proven impact) |
| --- | --- | --- |
| `CRÍTICO` | Critical | Realistic remote code execution needing no or low privilege; leaked live secrets or a broad multi-tenant breach; tampered release artifacts; attacker-driven data destruction |
| `ALTO` | High | Meaningful authentication bypass; reading or writing another tenant's data; privilege escalation; exploitable injection; a lasting foothold (backdoor, persistence); a dependable outage of a shared service |
| `MÉDIO` | Medium | A real boundary violation with constrained reach (uncommon preconditions, narrow resource set), or a defense-in-depth gap likely to chain into something worse |
| `BAIXO` | Low | Limited hardening issue with small realistic impact |
| `INFORMATIVO` | Informational | Noted with evidence but not exploitable on its own; useful context or a prerequisite for another finding |

Discriminator between `ALTO` and `MÉDIO`, adapted from
`[cloudflare verification model]`: does the demonstrated result **fully defeat**
an explicit control for an action with real consequences, or only weaken it?
If you cannot name the concrete damage, the severity is lower than it feels.

## Confidence (separate axis)

| Label | Meaning |
| --- | --- |
| `proven` | The full path was re-derived from code and, where executed, reproduced in an isolated environment |
| `probable` | The full path was re-derived statically; one non-decisive fact (for example an exact default) was not observed |
| `possible` | The path holds under a stated assumption that is plausible but unverified |

A decisive unknown is not low confidence: it makes the candidate
`needs-validation` (see `verification.md`). High confidence never lifts a
minor issue above `BAIXO`.

## Rules

1. **Impact and prerequisites, not wording.** Rank by what the attacker gains
   and what they need first. A scary payload, a CVE label, or a scanner's
   "critical" does not set severity.
2. **"Internal" is an assumption.** Do not downgrade because a service is
   internal until the threat model shows who can actually reach it.
3. **Layered defense.** If another layer that is *enforced* (in code or in
   configuration you have seen) demonstrably blocks the path, the missing
   layer is `INFORMATIVO` or `BAIXO` — unless you show the first layer's
   coverage is incomplete (another caller, another protocol, a fallback).
4. **Availability.** A reliably triggerable outage by a low-privilege
   attacker can reach `ALTO`; an inconvenience with no leverage stays
   `BAIXO`/`INFORMATIVO`. Never validate availability against a live system.
5. **Release chain.** A malicious or tampered artifact that can reach the
   release chain is `CRÍTICO` regardless of how small the diff is.
6. **No severity without confirmation.** `needs-validation` items and
   rejected candidates carry no severity and are never listed as findings.
   `surface` mode assigns no severity at all.
7. **Self-impact is not a finding.** Harm confined to the attacker's own
   account, data, or process with no crossed boundary is at most
   `INFORMATIVO`.
