# Attack playbooks by domain

Owner of: domain-specific attack classes that go deeper than the boundary
checklists — how to hunt, and what a candidate must show before it counts.
Adapted from cloudflare/security-audit-skill (MIT; see NOTICE.md); cite as
`[cloudflare hunting]`. Load **only** the sections whose "Use when" matches a
surface in the threat model (`audit`) or the scope under review (`review`).
Section A applies to every audit.

Every playbook shares one rule: a candidate names the lower-trust actor, the
accepted input or action, the control that should have stopped it, the
boundary crossed, the affected principal or resource, and a concrete result.
A missing best practice, a guessed deployment behavior, or harm limited to
the attacker's own account is not a finding. When the decisive fact lives
outside the repository (proxy, IdP, cloud policy, OS packaging), the outcome
is `needs-validation` with that exact fact named.

---

## A. Cross-cutting hunting (always)

**Access control in depth.** Do not stop at "a check exists". Ask whether it
checks the right permission, on the right resource, through the right
mechanism: a second path to the same state change with a weaker check; a
body field that overrides what the permission meant to restrict; endpoints
that authenticate but never authorize; one resource reachable through several
routes with inconsistent checks; bulk/export/import without per-item checks.

**Business logic.** Scanners do not find these. For each major workflow:
skip, reorder or replay steps; partial failure (step 2 of 3 fails — is step 1
undone?); check-then-act races with money or approval impact (double spend,
double approve, lost update); numeric abuse (negative, zero, overflow,
precision, string/number coercion); time logic (expiry at the exact boundary,
clock skew, time zones); the security posture when config is missing, a
feature flag is off, a dependency is down, or a migration is half done.

**Feature abuse and leakage.** Export/backup as exfiltration (other users,
deleted or draft content, pruned history); import/restore as injection
(overwriting, bypassing validation, writing into collections the user cannot
write); search, filter and sort as an oracle for hidden fields or objects;
enumeration via error text, status codes, timing or size; preview/draft
tokens that unlock more than one item; cache headers that let a CDN serve
private content; user-set notification/webhook URLs as SSRF.

**Chains and second-order use.** Map what a low-privilege principal can
read, write, invoke and retain, then connect only concrete outputs to later
trust decisions. Compare what component A guarantees with what component B
assumes (truncation, coercion, normalization, tenant scope). Stored-safe data
becomes dangerous elsewhere: a field name becomes a JSON path, a slug a file
path, escaped text is rendered raw, a string becomes a URL, regex, template
or policy expression. Capabilities that grow after delegation, refresh,
caching or role change. Undelete, restore and rollback must re-apply current
authorization.

**Wildcard pass.** Read the strangest code, half-finished features, API calls
the UI never makes, undocumented parameters and headers, feature
combinations nobody designed together, reverted security fixes and
commented-out checks in history, and what the tests do *not* test. If a
comment explains why something is safe, verify the explanation.

**Obvious sweep.** Literal and thorough: hard-coded credentials and private
keys; security TODO/FIXME/HACK comments; debug or dev mode switchable in
production; seed/test credentials that work in prod; unprotected
`/debug`, `/admin`, `/metrics`, `/env`, `/config`; committed `.env`, `*.pem`,
`*.key`; wildcard CORS with credentials; cookie flags on session cookies;
parameters named `redirect`, `next`, `url`, `return` feeding redirects;
production errors with stack traces or SQL. Each flag still needs its
impact traced before it becomes a candidate.

## B. Web protocol and identity

Use when: HTTP apps and APIs, proxies/CDNs/gateways, custom HTTP parsing,
sessions, JWT, OAuth/OIDC, SAML, MFA, passkeys, recovery, API keys, mTLS.

- **Framing and caches.** Desync needs two components that disagree on the
  same bytes (`Content-Length` vs `Transfer-Encoding`, header normalization,
  HTTP/2 downgrade); name both. Cache poisoning needs an unkeyed input that
  changes the response; cache deception needs a private dynamic response
  cached as static. Host and `X-Forwarded-*` are trust decisions: who can
  set them, and does the ingress strip client copies?
- **Browser sessions.** CSRF needs an ambient credential, a state-changing
  route, an accepted cross-site request shape, and no effective token or
  origin check (read-only routes and bearer-token routes do not qualify).
  Session IDs rotate on login, MFA, impersonation and privilege change, and
  die on logout, password change and disable. Cookie scope and prefix
  conflicts matter only when a less-trusted origin or network position gains
  or replaces the credential.
- **Federated identity.** JWT: verify signature with a server-pinned key and
  algorithm, then `exp`/`nbf`/`aud`/`iss`; `kid`/`jku`/`x5u` are untrusted
  selectors; a token for another service is invalid here. OAuth/OIDC: exact
  redirect URIs (when you are the authorization server), session-bound
  `state`, PKCE, ID-token nonce/audience, and IdP binding in multi-provider
  flows. SAML: the signed element must be the element used as identity.
- **MFA, passkeys, account transitions.** Enrollment, replacement, recovery
  codes and trusted devices require the intended prior assurance; step-up
  binds to session, principal, action and expiry; WebAuthn binds challenge,
  RP ID, origin and credential to the initiating session; account linking
  requires proof of the new identity and state bound to the initiator;
  recovery tokens are random, single-use, bound, expiring, and revoke older
  tokens and sessions.
- **API keys and mTLS.** Keys authenticate only their recorded scope;
  publishable vs secret key confusion; keys in bundles, URLs or logs. mTLS
  identity headers are trusted only from the terminating proxy, which strips
  client-sent copies; certificate failures must not fall back to weaker
  auth.

## C. Client-side and browser

Use when: SPAs, extensions, webviews, service workers, browser storage,
`postMessage`, CORS, WebSockets, DOM rendering.

- A candidate needs a controllable source (`location`, `window.name`,
  messages, storage) and an executing or disclosing sink (`innerHTML`,
  `document.write`, string evaluation, executable URLs, framework escape
  hatches), with impact on a victim's session, another origin, or shared
  persistence. Self-XSS is not a finding.
- Prototype pollution needs a recursive write reached by an attacker key
  **and** a gadget that turns the polluted property into an authorization,
  execution, navigation or rendering change. DOM clobbering needs surviving
  markup and a security-relevant use of the shadowed value.
- `postMessage` handlers need an exact origin allowlist (substring, prefix
  and unanchored regex checks are not checks) and, with several frames, the
  expected `event.source`; sending sensitive data to `*` is the mirror bug.
- Credentialed CORS that reflects or loosely matches `Origin`; WebSocket
  upgrades that accept ambient cookies without an origin check.
- Service workers: who controls the script URL, scope and imports; caches
  keyed without account/tenant that serve another user's data after logout.
- Browser storage is a finding only with a realistic lower-authority reader
  or use after logout/revocation. XS-Leaks need one concrete secret-bearing
  predicate. Clickjacking needs a framed state-changing action.

## D. AI, LLM, and agents

Use when: chatbots, RAG, persistent memory, tool-calling agents, MCP clients
or servers, prompt assembly from untrusted input, code acting on model
output.

- Prompt injection alone is not a finding. It becomes one when untrusted
  content reaches another principal's context, invokes authority the
  requester lacks, discloses data they cannot read, or drives a sink they
  could not reach directly.
- A guardrail prompt is not a boundary. Count only deterministic checks,
  resource-scoped authorization, isolation, binding, and scoped credentials.
- **Context and memory.** Who can write each retrieved source, how retrieval
  is scoped, whose session consumes it. Tenant/ACL filters must be in the
  query and in every cache key (conversation history, embeddings, prompt
  caches). Memory writes from low-trust content that later steer another
  user or a privileged session. Untrusted text impersonating system, tool or
  memory roles through string concatenation or lost provenance labels.
- **Tools and actions.** Treat tool arguments as untrusted input all the way
  to the sink (schema validation narrows shape, not authority). Confused
  deputy: the agent uses a broad service identity and the handler never
  re-checks the requester's permission on that resource. Action binding: an
  approval must bind tool name, full argument object, requester, target,
  amount and expiry — changed arguments, retries or later turns must not
  reuse it; content that triggers an unrequested action under the victim's
  valid authority is an action-binding failure. Schema/handler disagreement
  (aliases, extra fields, coercion). Unbounded delegated loops spending
  quota or money.
- **MCP and sub-agents.** Delegates receive least authority; returned
  results are untrusted. Calls and results bind to the authenticated
  connection and outstanding request, not to model-chosen names; tool
  descriptions and schemas from a peer guide the model but never grant
  capability.
- **Output.** Model output reaching HTML/Markdown/template/URL/command
  sinks needs that sink's encoding; context holding secrets or other users'
  data can be exfiltrated through output (including auto-loaded images).
- Hunt from side-effecting tools backward to ingestion, and from durable
  memory reads backward to every writer.

## E. Memory safety, native, and binary

Use when: C/C++/Objective-C, Rust `unsafe`, FFI, parsers and decoders,
daemons, kernel modules, loaders, runtimes, JITs, firmware.

- Re-derive every bound and lifetime from attacker input across all callers,
  against the worst accepted case.
- Classes: out-of-bounds read/write (headroom after prefixes, padding,
  terminators); integer overflow, underflow, truncation and signedness before
  allocation or copy (`count * size`, `a - b` with `b > a`, 64→32 narrowing,
  `-1` sentinels); unit confusion (bytes vs elements vs code units);
  uninitialized data crossing a boundary; use-after-free and double free on
  error, cancel and teardown paths; type confusion and stale tags; refcount
  and ownership races; TOCTOU on shared state.
- FFI/ABI: who allocates, frees and how long a pointer lives; bytes vs
  elements; layout, alignment, enum width, calling convention; unwinding
  across an ABI that forbids it.
- Loading: library/plugin search paths writable by a lower-trust principal;
  verifying one file but mapping another; malformed metadata trusted before
  range checks; JIT/interpreter disagreement; unload with live callbacks.
- Kernel/privileged interfaces: double fetch from user memory; unbalanced
  object lifecycles; powerful device nodes or admin sockets without per-caller
  authority.
- A crash or sanitizer report proves a defect only when realistic untrusted
  input reaches it; do not claim code execution from a label. Stop at the
  violated invariant — no exploitation technique development.

## F. Protocols, RPC, and messaging

Use when: gRPC, GraphQL transports, Protobuf/Thrift/Cap'n Proto, custom
protocols, streaming RPC, webhooks, queues, brokers, pub/sub.

- "Internal" is not authentication: name the peer identity at every hop and
  how it becomes the application principal.
- Schema validation proves shape, not provenance, authority or order.
- Classes: parser disagreement between two consumers (duplicate/unknown
  fields, numeric width, envelope vs body precedence — name both and the
  divergent value); unknown enum/union variants hitting default branches;
  authorization on envelope metadata while the handler acts on body fields;
  interceptors that skip streams, reflection, health or gateway-transcoded
  paths; per-item authorization missing inside streams and batches;
  predictable correlation IDs letting one caller satisfy another's pending
  call; topic/routing-key/consumer-group selection across tenants; dead-letter
  and trace copies with secrets; message bodies claiming to be control-plane
  events; duplicate delivery without idempotency; stale or reordered
  messages overwriting newer state; ack-before-commit and commit-before-ack.

## G. Data isolation and lifecycle

Use when: multi-tenant stores, caches/search/indexes, object links,
analytics, export/backup, migrations, deletion, retention, restore.

- A tenant field on a record is not isolation: find the query, key, path or
  row policy that enforces it on each read and write path.
- Classes: missing tenant/owner binding in direct, nested, background, admin,
  import or legacy paths; composite keys missing tenant or environment;
  row-level policy vs ORM scope vs raw/service client disagreeing; signed
  URLs and share links broader than the issuer's access or surviving ACL
  changes; search/cache/index copies not invalidated on ACL change or
  deletion; analytics, logs and traces as broader readers; aggregate and
  existence oracles; export/backup scope expansion; import/restore bypassing
  ownership and validation; migrations with missing defaults; soft-delete
  bypass; stale authorization in sessions, caches and subscriptions after
  membership removal; deletion undone by queued work or restores.
- Follow one protected record through primary write, query, cache, index,
  event, export, backup, deletion and restore, marking principal and tenant
  on every edge.

## H. Cloud and deployment

Use when: IAM, IaC, containers/Kubernetes, service mesh, serverless/edge,
ingress, object storage, environment-specific configuration.

- A manifest is intent, not live fact: establish which environment consumes
  it and what overlays change it; render each maintained environment.
- Classes: workload identity broader than its role, with request input
  selecting the target; role assumption or federation not bound to source
  account/repo/namespace; apps trusting caller-supplied identity headers or
  labels as if from the control plane; admin/debug/metrics listeners exposed
  to a lower-trust network; backends accepting forwarded identity from peers
  outside the mesh; SSRF reaching metadata or control-plane sockets with
  workload credentials; privileged pods, host namespaces/paths, runtime
  sockets selectable by a lower-trust workload; admission enforced on one
  deploy path but not another; policy keyed on labels a lower-trust user
  sets; dev defaults or overlays disabling auth/TLS/tenancy in a deployed
  environment; secrets in logs, args, broad volumes or build outputs;
  stale credentials or weaker auth modes on renewal failure; signed URLs and
  bucket policies not binding operation/object/expiry; event handlers trusting
  body fields as the event source.
- Secret *references* are not secret disclosure; broad policy is a finding
  only when lower-trust input reaches an unauthorized action.

## I. Desktop, mobile, and local IPC

Use when: native apps, deep links, webview bridges, exported components,
privileged helpers, updaters, local daemons, sockets/XPC/Binder/D-Bus,
native-messaging hosts.

- State the realistic attacker: another app, another OS user, a sandboxed
  child, an opened document, remote web content. Same-user self-harm is not a
  boundary violation.
- Paths, process names, bundle IDs and claimed sender fields are not peer
  authentication; use OS peer credentials, code identity or capability
  handles.
- Classes: deep links and custom schemes that mutate state or complete auth
  without one-time session binding; callbacks returning to the wrong app,
  profile or tenant; file-open/share/clipboard events triggering privileged
  actions; webview bridges reachable after navigation, redirects or
  subframes (origin must be checked at call time); generic bridges exposing
  files, commands or credentials; webview file/universal access joining
  origins; IPC without peer authentication or binding methods to a
  caller-declared identity; exported components doing app-internal work;
  predictable IPC IDs and world-writable socket paths; privileged helpers as
  confused deputies; installers and repair paths reading lower-trust-writable
  inputs after authorization; local TOCTOU on privileged file operations;
  credential stores readable by another app or profile; data surviving
  logout or account switch.

## J. Supply chain and release

Use when: dependency resolution, generated inputs, CI, release/signing,
promotion, updaters, plugins. Complements `[boundaries §11]`.

- A mutable or vulnerable dependency is not a finding by itself: show who
  can influence resolution, which build consumes it, and what boundary
  follows.
- Follow integrity across every handoff: source identity → resolved inputs →
  build worker → artifact → test result → signature/attestation → promotion
  → update consumer.
- Classes: namespace/registry confusion and fallback mirrors; mutable build
  inputs (branches, tags, floating actions, container tags, remote includes);
  generated or vendored content that skipped review; build context pulling
  secrets into artifacts; untrusted code running in privileged workflows;
  event data interpolated into shell or expressions; caches/artifacts written
  by low-trust jobs and consumed by trusted ones; CI identities broader than
  the job; tests, signing and publication referring to different mutable
  names instead of one digest; signatures accepted without checking which
  workflow/branch/key produced them; updaters authenticating payload bytes
  but not version, channel, platform or rollback state; plugins gaining host
  authority beyond their declaration.
- A checksum fetched from the same place as the artifact is not independent
  integrity.

## K. Resource exhaustion

Use when: untrusted work consumes shared CPU, memory, disk, connections,
workers, queues, quotas, or paid spend. Complements `[boundaries §10]`.

- Require an input-to-cost path, a missing effective bound, and impact on
  other users, a shared service, or operator-owned spend. Check body caps,
  concurrency, queues, deadlines, DB constraints, gateways and per-tenant
  quotas before calling a path unbounded.
- Classes: superlinear parsing/matching (regex backtracking, nested parsing,
  template expansion); decompression and representation amplification; query
  fan-out and unbounded pagination; unbounded buffering and cardinality
  (sessions, cache keys, metric labels, subscriptions); leaked handles and
  temp resources on error or cancel; work that continues after the client
  left; expensive work before authentication; quota keyed on a dimension the
  attacker controls; pool and priority starvation; reachable panics and
  deadlocks in shared processes; retry storms; poison messages blocking a
  shared queue; recovery that rebuilds unbounded state.
- Validate by analysis and tiny local growth points under strict limits;
  never by stressing a live or shared system.
