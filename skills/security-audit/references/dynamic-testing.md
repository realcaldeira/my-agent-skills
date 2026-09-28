# Dynamic and adversarial testing

Owner of: what to test dynamically, how, and what a test does and does not
prove. Load in `audit`. Everything here runs **only** after the static
review, after the user confirms the exact command and target in this
conversation, and inside a disposable environment the user says exists
(container or VM without the user's home, SSH agent, cloud credentials or
tokens; bounded CPU/memory/time; restricted network). Otherwise record the
test as `não executado — motivo` and keep the static evidence.

Executing target code before reading it is itself the security failure,
not a test.

## 1. Derive tests from the threat model

Tests come from the actors, entry points and boundaries in the threat
model, not from a generic payload list. For each boundary under test, pick
from these categories:

- **Identity and authority:** unauthenticated; wrong role; wrong tenant;
  partial identity (tenant set, user missing, or the reverse); stale or
  revoked credentials; a token for another audience.
- **Input shape:** traversal and symlinks; encoding, case and Unicode
  normalization variants; oversized and malformed input; duplicate or
  conflicting fields; archive edge cases (absolute paths, `..`, links,
  compression bombs within strict limits).
- **Injection:** payloads that must stay inert — including prompt-injection
  content that must not select a privileged tool or leak context.
- **SSRF:** aimed only at harmless canary listeners on loopback, RFC1918 and
  link-local addresses, including redirect and DNS/IP-encoding tricks — and
  only on an isolated network.
- **Concurrency and failure:** check/use races, retry, cancel, crash and
  restart, rollback, partial persistence.
- **Bounds:** queue, body, time, rate and disk limits, and deterministic
  behavior exactly at the limit.

## 2. Discipline

- **Synthetic data only.** Fabricated users, tenants, secrets and
  documents. Never real accounts, never production or shared services.
- **Regression tests fail before and pass after** the fix whenever that is
  feasible; keep them as the finding's suggested test.
- **Always include a legitimate control case.** The right user must still
  succeed. A blanket deny passes every negative test vacuously.
- **Say what each test proves.** One sink tested is one sink; name the
  sinks and callers it does not cover.
- **Mocking the control tests the mock.** If the control under test is
  replaced by a stub, the test proves nothing about the control.
- **Stop at the minimum effect** that establishes the defect: a wrong return
  value, an unauthorized dummy record, a sanitizer report. No persistence,
  no concealment, no post-exploitation.

## 3. Limits of what was shown

- A clean tested area does not clear the untested callers of the same sink.
- Results do not transfer across deployment shapes (local vs container vs
  hosted, one OS vs another, one config overlay vs another). Name the
  environment in which each result was observed.
- Availability is never tested against live or shared systems; use analysis
  and small local growth points (`[boundaries §10]`).
