# Ecosystem checks

Owner of: stack-specific places to look and sample gates. Load **only** the
sections whose detection signal appears in the scanner's manifest list or the
threat model. Cite as `[ecosystem:<key>]` using the key in each heading.

Rules for every section:

- The project's own CI definitions and contributor instructions override the
  sample commands here — they are the gate the owners trust.
- Any command that builds, tests, installs, or otherwise runs project code
  (including "just" a linter with plugins) needs the user's confirmation and
  a disposable environment, per SKILL.md. Until then the section is a
  reading list.
- Tool output is evidence to verify, not a verdict (`tool-evidence.md`).

---

## rust — Rust (`Cargo.toml`)

- **Runs at build time:** `build.rs`, procedural macros, `.cargo/config.toml`
  (aliases, runners, `rustflags`), git and path dependencies, feature
  unification, `links`, native libraries, vendored crates.
- **Unsafe surface:** `unsafe` blocks and `unsafe impl Send/Sync`, changes to
  `#![allow(...)]`/lint levels, FFI declarations (see playbook E in
  `attack-playbooks.md`).
- **Code sinks:** `Command::new` and shell wrappers, env handling, temp files
  and path joins, custom or `untagged` serde, `regex` built from input,
  archive extraction, async channels without bounds.
- **Robustness:** integer conversions (`as`), allocation sized by untrusted
  length, blocking calls in async code, cancellation safety, lock ordering,
  `panic!`/`unwrap`/`expect`/indexing on request paths.
- **Sample gates:** `cargo clippy`, `cargo test`, `cargo deny`,
  `cargo audit`, existing `cargo fuzz` targets.

## js — JavaScript / TypeScript (`package.json`)

- **Supply chain:** the committed package manager and lockfile; `preinstall`/
  `install`/`postinstall`/`prepare` scripts; `overrides`/`resolutions`;
  git and `file:` dependencies; new registries in `.npmrc`/`.yarnrc.yml`;
  surprising transitive additions.
- **Code sinks:** `child_process`, `eval`/`Function`, dynamic `import()`,
  prototype pollution through merge/`set` helpers, mass assignment, regex
  from input, `fs` paths, `fetch` to user URLs, template and DOM sinks,
  serialization, source maps shipped to production.
- **Node servers:** proxy trust (`trust proxy`), body limits, CORS/CSRF,
  cookie flags, redirects, security headers, uploads, SSRF, unhandled promise
  rejections leaving resources open.
- **Browser code:** XSS sinks, token storage, `postMessage` origin checks,
  CSP, third-party scripts, service workers, OAuth callbacks, authorization
  decisions made only on the client.
- **Sample gates:** the project's lint/typecheck/test scripts; `npm audit`
  (or the pnpm/yarn equivalent) — its severity is not exploitability.

## python — Python (`pyproject.toml`, `setup.cfg`, `setup.py`, `requirements*.txt`)

- **Supply chain:** build backend, `setup.py` code, entry-point plugins,
  editable/path/VCS requirements, extra index URLs, constraints and lock
  files, native extensions.
- **Code sinks:** `subprocess` with `shell=True` or string commands,
  `os.system`, `eval`/`exec`, `pickle`, `yaml.load`, template rendering from
  strings, raw SQL in ORMs (`.raw`, `.extra`, `text()`), file and archive
  handling (`tarfile` members), outbound requests to user URLs, regex,
  `importlib` with user input.
- **Frameworks:** debug mode, `SECRET_KEY` handling, `ALLOWED_HOSTS`,
  CORS/CSRF/session settings, object-level authorization in views and
  serializers, uploads, redirects, proxy headers.
- **Sample gates:** the project's tests; dependency audit and Bandit only if
  already configured or trusted, in isolation, after confirmation.

## go — Go (`go.mod`)

- **Supply chain:** `replace` directives, vanity/private module paths,
  generated code, cgo, assembly, `//go:linkname`, plugins, `//go:generate`
  (never run it automatically).
- **Code sinks:** `os/exec` and shell wrappers, `html/template` vs
  `text/template`, `template.HTML` conversions, `unsafe`, file and archive
  paths, HTTP clients following redirects, SQL string building, regex.
- **Robustness:** goroutine and channel bounds, `context` cancellation,
  data races, integer conversions and allocation sizes.
- **Sample gates:** `go vet`, `go test -race`, existing fuzz tests,
  `govulncheck`.

## ruby — Ruby / Rails (`Gemfile`, `*.gemspec`)

- **Supply chain:** gem sources, git/path gems, native extensions, install
  hooks, Rake tasks, initializers, engines, `Gemfile.lock` changes.
- **Code sinks:** `system`, backticks, `Open3`, `eval`/`send`/
  `constantize`, `YAML.load`/`Marshal.load`, raw SQL fragments, ERB
  `html_safe`/`raw`, redirects, file and archive handling, regex, mass
  assignment.
- **Rails only:** authentication filters and `skip_before_action`, policy
  scoping, CSRF, session/cookie/encryption key handling, Active Storage,
  signed IDs, jobs, Action Cable authorization, host/proxy settings,
  production config.
- **Sample gates:** Brakeman, `bundle audit`.

## jvm — Java / Kotlin / Scala (`pom.xml`, `build.gradle`, `build.gradle.kts`)

- **Supply chain:** build plugins, repositories, init/settings scripts,
  wrapper JARs and their checksums, annotation processors, generated code,
  dependency locking and verification metadata.
- **Code sinks:** `Runtime.exec`/`ProcessBuilder`, reflection and class
  loading, scripting engines, Java/XML/YAML deserialization, SpEL/EL, JNDI
  lookups, SQL building, templates, file and archive paths, SSRF, regex,
  pool bounds.
- **Web:** filter-chain coverage of every route, method- and object-level
  authorization, CSRF/CORS, actuator and debug endpoints, error disclosure,
  upload limits, forwarded headers.
- **Sample gates:** the project's build with its configured analyzers;
  dependency-check tooling if already configured.

## dotnet — .NET (`*.sln`, `*.csproj`, `Directory.Build.*`)

- **Supply chain:** NuGet sources and `packages.lock.json`, MSBuild targets
  and inline tasks, analyzers and source generators, pre/post-build events,
  native libraries.
- **Code sinks:** `Process.Start`, reflection and dynamic compilation,
  `unsafe`, `BinaryFormatter` and other polymorphic deserializers, XML
  resolvers, SQL building, Razor raw output, file and archive paths, SSRF,
  regex timeouts, async cancellation, `IDisposable` ownership.
- **ASP.NET:** middleware order, endpoint authorization, antiforgery,
  CORS/cookies, Data Protection key storage, forwarded headers, model binding
  over-posting, upload and request limits.
- **Sample gates:** the project's build with analyzers,
  `dotnet list package --vulnerable`.

## php — PHP (`composer.json`)

- **Supply chain:** Composer scripts and plugins, custom repositories,
  path/VCS packages, autoload changes, `composer.lock` integrity.
- **Code sinks:** `exec`/`system`/`shell_exec`/`proc_open`, dynamic
  `include`/`require`, `unserialize`, SQL building, output escaping, uploads,
  file and archive paths, SSRF, redirects, session handling, regex.
- Framework-specific checks (Laravel, Symfony, WordPress) only when that
  framework is actually present.

## elixir — Elixir / Erlang (`mix.exs`, `rebar.config`)

- **Supply chain:** Mix aliases and tasks, Hex/git/path dependencies, custom
  compilers, NIFs and ports, releases, runtime config.
- **Code sinks:** `System.cmd`, dynamic atom creation, `:erlang.binary_to_term`
  without `:safe`, Ecto `fragment` with interpolation, templates, file paths,
  URL clients.
- **Runtime:** mailbox growth, restart loops, ETS ownership, distribution
  cookie and TLS.
- **Phoenix:** plug pipelines, CSRF, socket/channel authorization, LiveView
  event authorization, uploads, endpoint secrets, proxy headers, limits.

## ci — Shell, Make, CI, containers, infrastructure (whenever these files exist)

- **Shell:** quoting, `eval`, temp files, globbing, `IFS`, traps, pipelines
  without `pipefail`, curl-to-shell, destructive paths built from variables,
  environment leakage, privilege changes.
- **Make and task runners** execute during setup and tests: includes,
  variable expansion, downloaded tools.
- **GitHub Actions / CI:** least-privilege `permissions`, no secrets with an
  untrusted checkout, `pull_request_target` and `workflow_run` usage, event
  data quoted before reaching shell, action pinning per project policy,
  cache and artifact isolation between trust levels, protected environments,
  build separated from publish.
- **Containers:** trusted base images pinned by digest, non-root user,
  minimal capabilities, no host socket or sensitive mounts, build args vs
  build secrets, `COPY` scope, healthcheck, network mode, read-only root
  filesystem, multi-stage provenance.
- **Kubernetes / IaC:** RBAC and service accounts, host namespaces and
  paths, privileged pods, Linux capabilities, seccomp, network policies,
  secrets (including in state and plan files), encryption, internet
  exposure, metadata endpoint reachability, destructive drift.

## native — Native, mobile, desktop (only when those targets exist)

- FFI and unsafe native code (playbook E in `attack-playbooks.md`), IPC and
  local sockets, deep links and custom URL handlers, file-type associations,
  embedded webviews, updater signing, OS permissions, keychain/credential
  stores, sandbox and entitlements, packaging and merged manifests.
- Electron/Tauri preload scripts and IPC bridges are authorization
  boundaries: validate sender and origin, expose a minimal typed API.
- Path and permission models differ per OS; do not generalize a finding
  from one OS to another without checking.
