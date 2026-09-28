# Gate runs: choosing, running, and reusing verification

Owner of: how to classify a change before paying for gates, which gates a
stack gets, when an earlier result may be reused, how results are recorded,
and how hosted CI is read after a push.

## 1. Classify the change first

Before any expensive gate, sort what the change touches:

- runtime code;
- code the build or test harness executes (build scripts, test setup);
- dependencies and lockfiles;
- persistence and migrations;
- public schemas and wire formats;
- CI and release plumbing;
- docs and metadata only.

The classes decide which gates apply and whether reuse is even possible.

## 2. Iterate small, gate once

- While iterating, run focused checks: the suites and linters for the
  touched area.
- Run the full set of relevant gates **one time**, against the final candidate tree.
- External acceptance suites also run once, on the final integration
  candidate; focused tests carry the loop.

## 3. Evidence record (write it before the costly run)

For each gate: commit SHA; hash of the relevant files or tree; toolchain,
features, and config in use; `fresh` or `reused` (and, if reused, which run).

## 4. Reusing an earlier result

All four must hold, and the report must say so:

1. The earlier green run is tied to an immutable commit whose inputs for
   that gate are byte-identical to the current head.
2. Toolchain, lockfile, feature set, test config, and relevant environment
   are equivalent.
3. Nothing changed since then could affect that gate. Plain prose docs
   cannot change a compiled artifact; manifests, build scripts, workflows,
   fixtures, migrations, and generated inputs can.
4. Provenance is explicit: focused checks on the current head cover every
   touched surface, and the report names the exact run being reused.

Reuse is **never** allowed across changes to runtime or build code,
lockfiles or dependencies, schemas, migrations, security policy, or the
workflow that is itself under judgment.

A change that only bumps the version still needs metadata resolution and a
quick compile or package smoke check; unchanged behavior tests need not run
again.

## 5. Picking gates

Use only gates backed by files that exist in the trusted base and relevant
to the touched components. Prefer the command or CI job the repository
documents. Typical signals:

| Manifest | Usual gates |
| --- | --- |
| `Cargo.toml` | `cargo fmt --check`, `cargo clippy`, `cargo test`; `cargo deny`/`cargo audit` if configured |
| `package.json` | the format, lint, typecheck, and test scripts, via the repo's package manager and committed lockfile |
| `pyproject.toml` / `setup.cfg` / `setup.py` | the configured formatter, linter, type checker, test runner — after reviewing the build backend and plugins |
| `go.mod` | `gofmt -l`, `go vet`, `go test`; generators only when trusted and needed |
| `Gemfile` | the documented entry point for tests, lint, and security checks |
| `pom.xml` / `build.gradle*` | wrapper tasks (`./mvnw`, `./gradlew`) after reviewing plugins |
| `*.sln` / `*.csproj` | `dotnet format --verify-no-changes`, `dotnet build`, `dotnet test` |
| `mix.exs` | `mix format --check-formatted`, lint tasks, `mix test` |

Several stacks present: root gates plus those of the touched components.
Never assume a stack the repo does not contain.

Where configured, coverage includes: lint, format, static analysis, type
checks; the full test suite on the final candidate plus targeted high-risk
tests while iterating; license, advisory, and dependency policy; release or
package builds for each supported platform; drift checks for generated docs,
schemas, and artifacts; hosted CI and security scanning pinned to the
audited SHA.

## 6. PR head vs. main

A green PR head does not prove main. It may support evidence for a component
that is demonstrably unchanged since, but workflow, security, and
composition checks must run on the merge commit itself.

## 7. Reporting status honestly

- Skipped, cancelled, or pending jobs are never reported as passed.
- When a newer head is queued, cancel hosted runs of the obsolete head,
  except the final required candidate and any one-of-a-kind platform or
  security job.

## 8. Gate, then act — separately

Never chain a gate to a merge or push with `&&` or `;`. Run the gate as its
own step, read its exit status, then take the next action in a separate
step.

## 9. After a push

Check hosted CI for that exact SHA: `gh pr checks N`, or without a PR
`gh run list --commit <SHA>`. Poll about once a minute for up to roughly 15
minutes; whatever is still running is reported as pending, not green.
