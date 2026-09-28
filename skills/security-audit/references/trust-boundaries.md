# Trust boundaries (coverage ledger)

Owner of: the twelve boundaries, what each control must guarantee, and the
ledger rules. Cite as `[boundaries §N]`. Load in `audit` (all sections the
threat model makes applicable), `review` (only the sections the scope
touches), and `explain` (exactly one section). Deeper attack classes per
domain live in `attack-playbooks.md`; stack-specific checks in
`ecosystems.md`.

## Ledger rules

Mark every boundary with exactly one state:

| State | Required content |
| --- | --- |
| `applicable` | Why it applies (asset, actor, entry point); still to be reviewed |
| `not-applicable (reason)` | The concrete fact that removes it (no network listener, single-user CLI, no persistence) |
| `reviewed (evidence)` | Paths/components read, checks run, and the result |
| `finding` | Link to the finding(s) |

- A bare "reviewed" is not evidence. "§2 reviewed: all 14 routes in
  `api/routes.ts` pass through `requireMembership` (`api/mw.ts:40`); the two
  export jobs re-check at `jobs/export.ts:88`" is.
- The ledger supplements tracing real flows (`surface-mapping.md` §5); it
  never replaces it. Twelve ticks with no traced flow is an empty audit.
- A document claiming a control exists elsewhere does not make a boundary
  not-applicable; unverified claims become `needs-validation`.

**Named-control fallacy.** Pointing at a sanitizer, middleware, wrapper, or
policy object does not make a path safe. Show that *every* path reaching the
sink goes through it, that it is applied after the final value is known
(post-decode, post-merge), and that it fails closed on error. A control that
only runs on the happy path does not count.

---

## §1 Authentication and session

- Use vetted libraries and protocols; homemade token formats and ad-hoc
  signing are candidates by default.
- Verify the signature or MAC **before** reading any claim. Then check
  issuer, audience, subject, expiry, not-before, and a server-pinned
  algorithm.
- Hunt: algorithm confusion, unsigned (`none`) tokens accepted, `kid`/`jku`
  used for path traversal or SSRF, replay, session fixation, downgrade to a
  weaker method, insecure fallback when the identity provider is down.
- Tokens come from a CSPRNG with enough entropy; stored hashed or otherwise
  protected; never logged.
- Expiry, rotation, revocation, logout, and compromise handling actually
  invalidate server state (sessions, refresh tokens, caches, websockets).
- Secret comparisons are constant-time.
- Sessions, OAuth callbacks, and device flows are bound to the initiator
  (state/nonce/PKCE, session binding) so another party cannot complete them.

## §2 Authorization and capabilities

- One central, deny-by-default policy. Every route, method, message type,
  background job, and alternate protocol (gRPC, websocket, GraphQL, admin
  CLI) passes through it.
- Object ownership plus tenant/workspace/project scope are checked on read,
  search, mutate, export, backup, restore, and delete — not only on the
  primary read path.
- Hunt: IDOR/BOLA, mass assignment (a body field overriding role, owner, or
  tenant), self-promotion, confused deputy (a privileged service acting on a
  caller-chosen resource), capability reuse beyond its intended resource,
  TOCTOU between check and use.
- Administrative and root actions are separated in both the UI and the API
  and helper layers; hiding a button is not authorization.
- Bulk, batch, export and import operations authorize **per item**.

## §3 Tenant and data isolation

- A complete scoped identity (tenant + owner + resource) accompanies data
  through storage, indexes, caches, search, file paths, and queue messages.
- Fail closed when identity is missing, partial, ambiguous, stale, or
  conflicting — never fall back to a global or default scope.
- Keys are fully scoped: cache keys, object-storage paths, uniqueness
  constraints, search document IDs, temp files, dedup keys.
- No cross-user inference through counts, existence errors, timing, logs,
  ranking, embeddings, generated summaries, backups, handoffs, or background
  jobs.

## §4 Injection

Sinks: shell/argv, SQL and other query languages, templates, file paths
(traversal, symlinks), headers and host, SSRF, open redirect, CRLF and log
injection, regex (ReDoS), deserialization, archives, prompts and tool calls,
HTML/JS, formula/CSV, XPath/LDAP and other query DSLs.

Controls to look for:

- Normalize once, at a typed boundary, and validate **after** decoding.
- Bound length, depth, count, numeric range, recursion, and encoding.
- Parameterized queries and query builders; argv arrays without a shell.
- Escaping that matches the exact output context (HTML body, attribute, JS,
  URL, header, CSV, log line, terminal, template).
- Path confinement against a canonical root, including symlinks and races.
- Archive entries validated (no absolute paths, no `..`, no links out) with
  caps on expanded size and entry count.
- SSRF restrictions on scheme, host, port, redirects, and the resolved IP
  (loopback, RFC1918, link-local, metadata), checked after DNS resolution.
- No unsafe native or polymorphic deserialization of untrusted data.
- LLM paths: prompts, retrieved text, and tool output are data; tool policy
  is enforced outside the model; context sent outward is sanitized. See the
  AI section of `attack-playbooks.md` for the full class list.

Also look for second-order injection: data stored safely and later used in a
dangerous context by different code, and injection through keys, field
names, headers and metadata rather than values.

## §5 Secrets and privacy

- No secrets in source, history, fixtures, docs, images, build artifacts,
  logs, error messages, metrics, telemetry, crash dumps, command lines, or
  process listings.
- Configuration resolution is centralized and distinguishes *absent* from
  *empty* (an empty key must not mean "no auth").
- Data minimization, including what is sent to model providers and other
  third parties.
- Sanitize before persisting, transporting, or logging; redaction works on
  structured and nested data, not only top-level strings.
- Exports and backups are protected; default destinations are safe; browser
  storage holds nothing that outlives the session unexpectedly.
- External and cross-border disclosure is visible to the user.
- Retention and deletion are tested across canonical data, caches, logs,
  exports, backups, embeddings, and model context — separately per tenant.

## §6 Execution and extensibility

- Subprocesses: allowlisted programs, bounded time/output/resources,
  cancellation and cleanup.
- Plugins, hooks, MCP servers, and tools get least capability; their
  executable path and provenance are validated; dynamic loading is treated as
  an authority boundary.
- Scrub env, working directory, inherited file descriptors, and credentials
  before spawning.
- Least-privilege users and a restrictive umask; look for sandbox escapes.
- Compilers, macros, build scripts, lifecycle hooks, test discovery, and
  migrations **are** code execution — for the auditor too.
- Update channels verify checksums/signatures against a pinned root, support
  rollback, and refuse downgrades.

## §7 Persistence, consistency, and integrity

- Validate before mutating; authorize inside the transaction or race window,
  not before it.
- Transactions, atomic writes, fsync/rename where durability matters.
- Derived indexes commit with canonical data or can be rebuilt from it.
- Ownership and scope survive read, write, delete, move, and restore.
- Temp paths are unpredictable and opened atomically; symlink and hardlink
  races are closed.
- One ownership model for concurrent writers.
- Destructive operations are explicit, scoped, confirmed, audited, and
  recoverable.
- Migrations run forward and back on representative data; backups are
  restore-tested.
- Audit attribution cannot be forged; tamper evidence exists where the
  product claims it.

## §8 Network and web

- Bind to the least-exposed interface.
- Authenticate before parsing costly or sensitive bodies.
- Limits on body size, headers, time, and concurrency.
- Host and proxy headers validated against an explicit trusted-proxy list.
- Narrow CORS; CSRF protection for cookie-authenticated mutations; cookie
  flags; security headers where they defend something real.
- No cross-user leakage through redirects or caches.
- Webhooks: signature over the raw bytes plus replay protection.
- Errors do not leak stack traces, secrets, paths, tenant existence, or
  internal URLs.
- TLS certificate and hostname validation on; plaintext only when explicit.
- Request smuggling / desync when a proxy and a custom parser disagree.

## §9 Cryptography and randomness

- Standard, maintained primitives; no custom crypto or custom formats.
- CSPRNG for anything security-relevant; unique nonces/IVs.
- Separate keys per purpose; rotation that does not break old data unsafely.
- Authenticated encryption, covering the metadata that matters.
- Signatures verified before the signed content is used, against a pinned
  trust root.
- No weak hashes/ciphers/modes (MD5/SHA-1 for security, DES/3DES/RC4, ECB),
  no certificate-validation bypass, no negotiable downgrade.
- What happens when a crypto operation fails — does the error path fall back
  to no crypto?

## §10 Availability and abuse

- Caps on size, counts, depth, recursion, regex cost, allocation,
  decompression ratio, output, log cardinality, and disk.
- Bounded queues, tasks, threads, connections, and pools — per user and
  global.
- Timeouts, cancellation, retry limits, backoff with jitter; no retrying
  non-idempotent effects without deduplication.
- Lock starvation, deadlocks, long transactions on hot paths.
- Rate limits on authentication, search, generation, upload, export, and
  webhooks.
- Predictable degradation without cascading failure; paid APIs and quotas
  are part of availability.

## §11 Supply chain, CI, and release

- Every new dependency or registry change is justified.
- Check lockfiles, checksums, git revisions, path dependencies, features,
  build scripts, lifecycle hooks, vendored code, and licenses.
- Hunt: typosquats, maintainer or provenance changes, stale packages, known
  advisories that are actually reachable.
- CI: minimal permissions; actions pinned per the project's policy; untrusted
  PR code never runs with secrets or write tokens; review
  `pull_request_target`, dynamic matrices, shell interpolation of event data,
  artifact names and paths, caches, and reusable-workflow inputs.
- Build is separated from publish; publish only the exact tagged and tested
  commit; versions and tags agree; signatures/attestations and provenance are
  produced and verified; the registry destination is right; rollback exists.
- Deploy credentials stay out of logs and out of reach of contributor code.

## §12 Malicious-code review

Indicators are **leads**, not verdicts. Judge intent and reachability:

- New network destinations, DNS lookups, telemetry, webhooks, tunnels, or
  uploads.
- Discovery of credentials, home directories, browser profiles, or cloud
  metadata.
- Shell, eval, dynamic loading, or execution of downloaded content.
- Encoded, compressed, or encrypted blobs; staged decode-then-execute.
- Bidi controls, homoglyphs, invisible conditions; minified or generated
  code without source; unexplained binaries.
- Triggers keyed to time, user, host, CI, or region; delayed activation.
- Hidden accounts, static keys, debug or admin bypasses, permissive
  fallbacks.
- Persistence: startup files, cron/services, package hooks, plugins,
  workflows, images, update channels.
- Disabling security tools, tests, logging, audit, TLS, signature checks,
  auth, sandboxing, or limits.
- Tests or mocks that hide side effects or assert nothing.
- Destructive cleanup outside the project root.
- Anti-analysis: environment checks that behave differently under CI,
  debuggers, or sandboxes.
