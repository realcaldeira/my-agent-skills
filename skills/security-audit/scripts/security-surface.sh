#!/usr/bin/env bash
# security-surface.sh: read-only candidate scanner for the security-audit skill.
#
# Usage:  bash security-surface.sh [ROOT]        (ROOT defaults to ".")
# Env:    SECURITY_SURFACE_NO_GIT=1              never invoke git at all
#
# What it does: lists manifests and security-sensitive files, build/vendor
# directories, tracked executable/symlink/submodule modes, tracked files that
# ignore rules would hide, and heuristic content candidates grouped by theme.
# Every hit is a CANDIDATE for human/agent triage, never a verdict.
#
# Side effects: none on the audited tree. It runs only read commands (rg,
# find, git read commands), makes no network calls, and writes one temporary
# file (rg stderr) under $TMPDIR (fallback /tmp), removed on exit.
#
# Git safety: every git call disables optional locks, fsmonitor and hooks,
# and `git status` is skipped when the repository's local/worktree config
# contains exec-capable or redirecting keys. That guard is a DENYLIST, not a
# vetting of the repository. For a .git of unknown origin (archive, shared
# folder, someone else's checkout), run with SECURITY_SURFACE_NO_GIT=1 until
# .git/config, .git/config.worktree, .git/modules/*/config, .git/hooks/ and
# .gitattributes have been read as plain files.
#
# Exit codes: 0 = scan finished (individual sections may still report
# "scanner error" lines); 64 = ROOT is not a directory; 69 = rg not found.
#
# Portability: bash 3.2+ (macOS default), BSD or GNU userland, ripgrep's
# default Rust regex engine (no PCRE2 needed).

set -euo pipefail

ROOT="${1:-.}"
if [ ! -d "$ROOT" ]; then
  echo "security-surface: ROOT is not a directory: $ROOT" >&2
  exit 64
fi
cd "$ROOT" || { echo "security-surface: cannot enter ROOT: $ROOT" >&2; exit 64; }

if ! command -v rg >/dev/null 2>&1; then
  echo "security-surface: ripgrep (rg) not found on PATH; install it and retry" >&2
  exit 69
fi

export LC_ALL=C

TMPBASE="${TMPDIR:-/tmp}"
ERRFILE="$(mktemp "${TMPBASE%/}/security-surface.XXXXXX" 2>/dev/null || mktemp "/tmp/security-surface.XXXXXX")"
trap 'rm -f "$ERRFILE"' EXIT

ERRORS=0
CONTENT_CAP=75
LIST_CAP=150
DIR_CAP=50
MAX_LINE=300

# ---------------------------------------------------------------- helpers

section() {
  printf '\n## %s\n' "$1"
}

note() {
  printf '%s\n' "$*"
}

first_err_line() {
  if [ -s "$ERRFILE" ]; then
    head -n 1 "$ERRFILE" | cut -c 1-240
  else
    printf 'no stderr output'
  fi
}

# print_capped CAP UNIT: stdin lines (already sorted) -> at most CAP lines
# plus a truncation marker that carries the total.
print_capped() {
  local cap="$1" unit="$2" data total
  data="$(cat)"
  if [ -z "$data" ]; then
    return 0
  fi
  total="$(printf '%s\n' "$data" | wc -l | tr -d ' ')"
  # sed reads all input (no SIGPIPE under pipefail, unlike head).
  printf '%s\n' "$data" | sed -n "1,${cap}p"
  if [ "$total" -gt "$cap" ]; then
    note "... truncated after $cap of $total $unit"
  fi
}

shorten_lines() {
  awk -v max="$MAX_LINE" '{ if (length($0) > max) print substr($0, 1, max) " ...[line cut]"; else print }'
}

# ---------------------------------------------------------------- rg scopes

RG_BASE=(--no-config --hidden --no-ignore --color never)

# Excluded at any depth. Trailing "/" = directories only, so a file named
# "build" or "out" is still scanned.
GLOBAL_EXCLUDES=(
  -g '!.git/' -g '!.agent/' -g '!node_modules/' -g '!.venv/'
  -g '!__pycache__/' -g '!coverage/' -g '!target/' -g '!vendor/'
  -g '!dist/' -g '!build/' -g '!.next/' -g '!out/' -g '!.terraform/'
  -g '!.tox/' -g '!*.min.js' -g '!*.map'
)

# Code scope: everything except prose. Code files under docs/ stay in scope.
CODE_SCOPE=(
  "${GLOBAL_EXCLUDES[@]}"
  -g '!README*' -g '!CHANGELOG.md' -g '!*.md'
  -g '!**/docs/**/*.mdx' -g '!**/docs/**/*.rst'
  -g '!**/docs/**/*.txt' -g '!**/docs/**/*.adoc'
)

# Doc scope: prose and agent-instruction files. Include globs come first so
# the global excludes (later = higher precedence in rg) still win.
DOC_SCOPE=(
  -g 'README*' -g 'CHANGELOG.md' -g '**/docs/**' -g '*.md'
  -g '.cursorrules' -g '**/.cursor/rules/**' -g '.mcp.json' -g '**/.claude/**'
  "${GLOBAL_EXCLUDES[@]}"
)

# Unicode scope: code and docs, only the global exclusions.
ALL_SCOPE=("${GLOBAL_EXCLUDES[@]}")

# scan TITLE SCOPE_NAME [rg pattern args...]
scan() {
  local title="$1" scope="$2" out rc
  shift 2
  section "$title"
  rc=0
  case "$scope" in
    code) out="$(rg "${RG_BASE[@]}" -n --no-heading --with-filename --max-count 3 "${CODE_SCOPE[@]}" "$@" . 2>"$ERRFILE")" || rc=$? ;;
    docs) out="$(rg "${RG_BASE[@]}" -n --no-heading --with-filename --max-count 3 "${DOC_SCOPE[@]}" "$@" . 2>"$ERRFILE")" || rc=$? ;;
    all)  out="$(rg "${RG_BASE[@]}" -n --no-heading --with-filename --max-count 3 "${ALL_SCOPE[@]}" "$@" . 2>"$ERRFILE")" || rc=$? ;;
    *)    note "... scanner error: unknown scope $scope"; ERRORS=$((ERRORS + 1)); return 0 ;;
  esac
  if [ -n "$out" ]; then
    printf '%s\n' "$out" | sed 's#^\./##' | sort -t: -k1,1 -k2,2n | shorten_lines \
      | print_capped "$CONTENT_CAP" "candidate lines (max 3 per file)"
  elif [ "$rc" -lt 2 ]; then
    note "no candidates matched"
  fi
  if [ "$rc" -ge 2 ]; then
    note "... scanner error (rg exit $rc): $(first_err_line)"
    ERRORS=$((ERRORS + 1))
  fi
  return 0
}

# ---------------------------------------------------------------- git

GIT_OK=0
GIT_SKIP_REASON=""

g() {
  git --no-pager --no-optional-locks -c core.fsmonitor=false -c core.hooksPath=/dev/null "$@"
}

detect_git() {
  if [ "${SECURITY_SURFACE_NO_GIT:-0}" = "1" ]; then
    GIT_SKIP_REASON="SECURITY_SURFACE_NO_GIT=1"
    return 0
  fi
  if ! command -v git >/dev/null 2>&1; then
    GIT_SKIP_REASON="git not found on PATH"
    return 0
  fi
  local inside
  inside="$(g rev-parse --is-inside-work-tree 2>/dev/null || true)"
  if [ "$inside" != "true" ]; then
    GIT_SKIP_REASON="not inside a git work tree (or git refused the repository)"
    return 0
  fi
  GIT_OK=1
}

# Config keys (lowercased section/key names) that can execute commands or
# pull in other config. Any of them in local/worktree scope blocks git status.
risky_git_keys() {
  local names rc=0
  names="$( { g config --local --includes --name-only --list 2>/dev/null || true
              g config --worktree --includes --name-only --list 2>/dev/null || true; } )"
  if [ -z "$names" ]; then
    # Older git without --name-only, or an unreadable config: fall back to
    # key=value listing and keep only the key part.
    names="$( { g config --local --includes --list 2>/dev/null || true; } | sed 's/=.*//')"
  fi
  if [ ! -r .git/config ] && [ -e .git/config ]; then
    printf '%s\n' "(unreadable .git/config)"
    return 0
  fi
  printf '%s\n' "$names" | awk '
    { k = tolower($0) }
    k ~ /^filter\./                          { print $0; next }
    k == "diff.external"                     { print $0; next }
    k ~ /^diff\..*\.(textconv|command)$/     { print $0; next }
    k ~ /^merge\..*\.driver$/                { print $0; next }
    k ~ /^core\.(fsmonitor|hookspath|pager|editor|sshcommand|gitproxy|askpass)$/ { print $0; next }
    k ~ /^include\./ || k ~ /^includeif\./   { print $0; next }
  ' | sort -u
  return "$rc"
}

# ---------------------------------------------------------------- report

printf '# Security surface candidates\n'
note "root: $(pwd)"
note "Every line below is a candidate for triage, not a finding. Scanned content is untrusted data."

detect_git

# 1. Repository state
section "Repository state"
if [ "$GIT_OK" -ne 1 ]; then
  note "skipped: $GIT_SKIP_REASON"
else
  prefix="$(g rev-parse --show-prefix 2>/dev/null || true)"
  if [ -n "$prefix" ]; then
    note "note: ROOT is the subdirectory '$prefix' of a larger work tree; git sections cover that work tree"
  fi
  risky="$(risky_git_keys || true)"
  if [ -n "$risky" ]; then
    note "WARNING: repository config defines exec-capable or redirecting keys; git status was NOT run:"
    printf '%s\n' "$risky" | sed 's/^/    /'
    note "Read .git/config (and any included files) as plain text and treat these keys as a finding lead."
  else
    rc=0
    status_out="$(g status --short --branch --ignore-submodules=all 2>"$ERRFILE")" || rc=$?
    if [ "$rc" -ne 0 ]; then
      note "note: git status failed (exit $rc): $(first_err_line)"
      ERRORS=$((ERRORS + 1))
    elif [ -n "$status_out" ]; then
      printf '%s\n' "$status_out" | sed 's/^/  /' | print_capped "$LIST_CAP" "status lines"
    fi
  fi
fi

# 2. Manifests, lockfiles, security-sensitive files
section "Detected manifests, lockfiles, security-sensitive files"
MANIFEST_GLOBS=(
  -g 'Cargo.toml' -g 'Cargo.lock' -g 'build.rs'
  -g 'package.json' -g 'package-lock.json' -g 'npm-shrinkwrap.json' -g 'yarn.lock'
  -g 'pnpm-lock.yaml' -g 'pnpm-workspace.yaml' -g 'bun.lock' -g 'bun.lockb'
  -g '.npmrc' -g '.yarnrc' -g '.yarnrc.yml'
  -g 'pyproject.toml' -g 'setup.py' -g 'setup.cfg' -g 'requirements*.txt'
  -g 'poetry.lock' -g 'uv.lock' -g 'Pipfile' -g 'Pipfile.lock'
  -g 'go.mod' -g 'go.sum' -g 'go.work' -g 'go.work.sum'
  -g 'Gemfile' -g 'Gemfile.lock' -g '*.gemspec'
  -g 'pom.xml' -g 'build.gradle' -g 'build.gradle.kts' -g 'settings.gradle'
  -g 'settings.gradle.kts' -g 'gradle.lockfile'
  -g '*.csproj' -g '*.sln' -g 'Directory.Build.props' -g 'Directory.Build.targets'
  -g 'packages.lock.json'
  -g 'composer.json' -g 'composer.lock'
  -g 'mix.exs' -g 'mix.lock' -g 'rebar.config' -g 'rebar.lock'
  -g 'Dockerfile' -g 'Dockerfile.*' -g '*.Dockerfile' -g 'Containerfile'
  -g 'docker-compose*.yml' -g 'docker-compose*.yaml' -g 'compose.yml' -g 'compose.yaml'
  -g 'Makefile' -g 'GNUmakefile' -g 'Jenkinsfile'
  -g '.gitlab-ci.yml' -g '**/.circleci/config.yml' -g '**/.github/workflows/*.yml'
  -g '**/.github/workflows/*.yaml'
  -g 'Chart.yaml' -g '*.tf'
  -g '.pre-commit-config.yaml' -g '.gitmodules' -g '.gitattributes'
  -g '.mcp.json' -g 'CLAUDE.md' -g 'AGENTS.md' -g '.cursorrules'
  -g '**/.claude/settings*.json' -g '**/.cursor/rules/**'
  -g '**/.github/copilot-instructions.md'
)
rc=0
files_out="$(rg "${RG_BASE[@]}" --files "${MANIFEST_GLOBS[@]}" "${GLOBAL_EXCLUDES[@]}" . 2>"$ERRFILE")" || rc=$?
if [ -n "$files_out" ]; then
  # Collapse Terraform files to one "<dir>/*.tf" line per directory.
  printf '%s\n' "$files_out" | sed 's#^\./##' | awk '
    /\.tf$/ { n = split($0, p, "/"); if (n < 2) { print "*.tf"; next } d = p[1]; for (i = 2; i < n; i++) d = d "/" p[i]; print d "/*.tf"; next }
    { print }
  ' | sort -u | print_capped "$LIST_CAP" "files"
elif [ "$rc" -lt 2 ]; then
  note "none"
fi
if [ "$rc" -ge 2 ]; then
  note "... scanner error (rg exit $rc): $(first_err_line)"
  ERRORS=$((ERRORS + 1))
fi

# 3. Excluded directories present
section "Excluded directories present (not content-scanned; review vendored or first-party code under these names deliberately)"
rc=0
dirs_out="$(find . \( -name .git -o -name .agent -o -name node_modules -o -name .venv \) -prune -o \
  -type d \( -name vendor -o -name dist -o -name build -o -name target -o -name coverage \
  -o -name .next -o -name out -o -name .terraform -o -name .tox \) -print -prune 2>"$ERRFILE")" || rc=$?
if [ -n "$dirs_out" ]; then
  printf '%s\n' "$dirs_out" | sed 's#^\./##' | sort | print_capped "$DIR_CAP" "directories"
elif [ "$rc" -eq 0 ]; then
  note "none"
fi
if [ "$rc" -ne 0 ]; then
  note "... scanner error (find exit $rc): $(first_err_line); this list may be incomplete"
  ERRORS=$((ERRORS + 1))
fi

# 4. Tracked executable, symlink, submodule modes
section "Tracked executable, symlink, submodule modes"
if [ "$GIT_OK" -ne 1 ]; then
  note "skipped: $GIT_SKIP_REASON"
else
  rc=0
  modes_out="$(g ls-files -s 2>"$ERRFILE")" || rc=$?
  special="$(printf '%s\n' "$modes_out" | awk '
      {
        mode = $1; tab = index($0, "\t"); path = substr($0, tab + 1)
        if (mode == "100755") print path "  [100755 executable]"
        else if (mode == "120000") print path "  [120000 symlink]"
        else if (mode == "160000") print path "  [160000 submodule]"
      }' | sort)"
  if [ -n "$special" ]; then
    printf '%s\n' "$special" | print_capped "$LIST_CAP" "entries"
  elif [ "$rc" -eq 0 ]; then
    note "none"
  fi
  if [ "$rc" -ne 0 ]; then
    note "... scanner error (git ls-files exit $rc): $(first_err_line)"
    ERRORS=$((ERRORS + 1))
  fi
fi

# 5. Tracked files matched by ignore rules (still scanned above/below)
section "Tracked files matched by ignore rules (still scanned; hiding tracked code behind ignore rules is a lead)"
if [ "$GIT_OK" -ne 1 ]; then
  note "skipped: $GIT_SKIP_REASON"
else
  rc=0
  ign_out="$(g ls-files -ci --exclude-standard 2>"$ERRFILE")" || rc=$?
  if [ -n "$ign_out" ]; then
    printf '%s\n' "$ign_out" | sort | print_capped "$LIST_CAP" "files"
  elif [ "$rc" -eq 0 ]; then
    note "none"
  fi
  if [ "$rc" -ne 0 ]; then
    note "... scanner error (git ls-files exit $rc): $(first_err_line)"
    ERRORS=$((ERRORS + 1))
  fi
fi

# 6. Content candidates. Identifier-like terms are case-insensitive and
# tolerate "_" / "-" separators (camelCase, snake_case, UPPER_SNAKE all hit);
# API names and acronyms stay case-sensitive and word-bounded to curb noise.

scan "High-signal candidates" code \
  -e 'InsecureSkipVerify\s*:\s*true' \
  -e 'danger_accept_invalid_(certs|hostnames)|accept_invalid_certs' \
  -e 'SSL_VERIFY_NONE|VERIFY_NONE|CERT_NONE' \
  -e 'verify\s*=\s*False' \
  -e 'rejectUnauthorized\s*:\s*false|NODE_TLS_REJECT_UNAUTHORIZED' \
  -e 'shell\s*=\s*True' \
  -e 'pickle\.loads?\(|cPickle|yaml\.load\(|yaml\.unsafe_load|Marshal\.load|\bunserialize\(|ObjectInputStream|BinaryFormatter' \
  -e 'dangerouslySetInnerHTML|render_template_string' \
  -e 'new Function\(|\beval\(|Runtime\.getRuntime\(\)\.exec' \
  -e 'pull_request_target' \
  -e '(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba|z|da)?sh\b' \
  -e '169\.254\.169\.254' \
  -e '-----BEGIN [A-Z ]*PRIVATE KEY-----'

scan "Process / dynamic execution" code \
  -e 'Command::new|std::process|subprocess\.|\bPopen\b|child_process|\bexecFile|\bexecSync|\bspawnSync|\bspawn\(' \
  -e '\bsystem\(|Open3|ProcessBuilder|System\.cmd|"os/exec"|exec\.Command|\bexecv?p?e?\(|\bpopen\(|\bos\.system' \
  -e 'constantize|Class\.forName|Assembly\.Load|\bdlopen|importlib\.import_module|__import__\(' \
  -e 'unsafe\s*\{'

scan "Network / redirect / webhook / SSRF" code \
  -e 'reqwest|hyper::|ureq::|\bfetch\(|axios|requests\.(get|post|put|patch|delete|head|request|Session)|httpx|urllib|urlopen' \
  -e 'Net::HTTP|Faraday|HTTPoison|Finch|HttpClient|WebClient|RestTemplate|http\.NewRequest|http\.(Get|Post|Head)\(' \
  -e '(?i:redirect|webhook|callback[_-]?url)' \
  -e 'Location\s*:|metadata\.google\.internal|\blocalhost\b|127\.0\.0\.1|0\.0\.0\.0'

scan "Authn / authz / tenant scope" code \
  -e 'Authorization|Bearer ' \
  -e '(?i:authori[sz]|permission|capabilit|tenant|api[_-]?key|auth[_-]?token|session[_-]?id|is[_-]?admin|is[_-]?root|superuser|workspace[_-]?id|project[_-]?id|user[_-]?id|user[_-]?role)' \
  -e '(?i:\b(role|roles|scope|scopes)\b)'

scan "Query / template / injection" code \
  -e '\.(execute|executemany|query|raw|exec_query|find_by_sql)\s*\(' \
  -e '(?i:\b(select|insert\s+into|update|delete\s+from)\b[^;]*["'"'"'`]\s*(\+|%|\.format|\$\{|#\{|\|\|))' \
  -e 'format!\(\s*"(?i:\s*(select|insert|update|delete)\b)' \
  -e 'f"(?i:\s*(select|insert|update|delete)\b)' \
  -e 'innerHTML|outerHTML|insertAdjacentHTML|document\.write|template\.HTML\(|html_safe|\|\s*safe\b|mark_safe'

scan "Filesystem / archive / upload / path" code \
  -e 'canonicalize|realpath|read_link|readlink|symlink|hard_link|os\.link' \
  -e 'tempfile|mktemp|NamedTempFile|TempDir|tmpnam' \
  -e '\.\./|path\.join|path\.resolve|os\.path\.join|filepath\.Join|Path::new|PathBuf|File\.join' \
  -e '(?i:extract|unpack|unzip|untar)|tarfile|zipfile|ZipFile|ZipArchive|archive/(tar|zip)' \
  -e '(?i:upload|multipart)' \
  -e 'remove_dir_all|remove_file|rmtree|File\.delete|rm_rf|rm -rf|fs\.rm\(|unlinkSync|os\.RemoveAll'

scan "Secrets / logs / telemetry / env" code \
  -e 'std::env|env::var|process\.env|os\.environ|os\.Getenv|ENV\[|ENV\.fetch|System\.getenv|GetEnvironmentVariable|\bgetenv\(' \
  -e '(?i:secret|passw(or)?d|private[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|credential|api[_-]?key)' \
  -e '(?i:telemetry|analytics|sentry|tracing)' \
  -e 'println!|eprintln!|console\.(log|error|warn|info|debug)|logger\.|\blog\.|logging\.|Logger\.'

scan "Crypto / randomness" code \
  -e '(?i:\b(md5|sha1)\b)' \
  -e '\b(DES|3DES|TripleDES|RC4|ECB)\b' \
  -e '\brand\(|\brandom\(|thread_rng|Math\.random|math/rand|\bmt_rand\(|random\.randint|random\.choice' \
  -e '(?i:nonce|encrypt|decrypt|signature|constant[_-]?time)|\bverify\b|timingSafeEqual|compare_digest|ConstantTimeCompare'

scan "Bounds / queues / retries / DoS" code \
  -e '(?i:unbounded)|tokio::spawn|thread::spawn|std::thread|go func|Task\.Run|ThreadPool|Executors\.' \
  -e '(?i:retry|retries|backoff|timeout)' \
  -e '(?i:body[_-]?limit|max[_-]?(size|depth|items|connections|conns|tasks|bytes|body[_-]?size)|rate[_-]?limit)' \
  -e 'Semaphore|mpsc|(?i:queue)|(?i:recurs)|(?i:decompress)' \
  -e 'Regex::new|re\.compile|new RegExp|regexp\.(Must)?Compile|(?i:\bregexp?\b)'

scan "Supply chain / download / workflow" code \
  -e 'Invoke-WebRequest|Invoke-Expression|Start-Process|DownloadString|DownloadFile' \
  -e 'npm (install|ci|i)\b|yarn add|pnpm (add|install)|pip3? install|cargo install|go (install|get)\b|bundle install|gem install' \
  -e 'permissions\s*:|secrets\.|github\.event|uses\s*:' \
  -e 'docker login|docker/login-action|setup-buildx|upload-artifact|download-artifact'

scan "Obfuscation / encoded payload / persistence" code \
  -e 'base64|atob\(|btoa\(|b64decode|FromBase64String|decode64|hex\.DecodeString|bytes\.fromhex|unhexlify|fromCharCode' \
  -e '(?i:gzip|zlib|inflate|decompress)' \
  -e '-EncodedCommand|-enc\s|-e(nc)?\s+[A-Za-z0-9+/=]{40,}' \
  -e 'crontab|systemd|systemctl|LaunchAgent|LaunchDaemon|RunOnce|CurrentVersion\\Run|\\Startup\\|autorun|daemonize|nohup'

scan "Docs: install/exec snippets" docs \
  -e '\bcurl\b|\bwget\b|Invoke-WebRequest|\birm\b|\biex\b' \
  -e 'npm (install|ci|i)\b|pip3? install|cargo install|go install|brew install|gem install|bundle install' \
  -e 'docker (run|compose)|docker-compose|\bsudo\b|chmod \+x'

scan "Docs: prompt-injection and secret-handling phrases" docs \
  -e '(?i:(ignore|disregard|forget)\s+(all\s+|any\s+)?(the\s+|your\s+)?(previous|prior|above|earlier|system|developer)\s+(instructions?|prompts?|messages?|rules))' \
  -e '(?i:system prompt|developer message|do not (obey|follow)|override (the |your |all )?instructions|prompt injection|jailbreak)' \
  -e '(?i:api[_ -]?key|auth[_ -]?token|password|private[_ -]?key|credential)'

# Invisible and bidi characters are replaced in the output so the report
# itself cannot be visually reordered.
scan "Unicode bidi and invisible characters" all \
  --replace '<U+invisible/bidi>' \
  -e '[\x{200B}-\x{200D}\x{2060}\x{FEFF}\x{202A}-\x{202E}\x{2066}-\x{2069}\x{E0000}-\x{E007F}]'

# 7. Summary
section "Candidate scan complete"
if [ "$ERRORS" -gt 0 ]; then
  note "WARNING: $ERRORS section(s) reported a scanner error; coverage is incomplete. Read those sections' error lines before relying on them."
fi
note "- Patterns are heuristic: an empty section is not evidence that the pattern is absent."
note "- Before classifying any hit, check reachability, attacker control, authorization, and intent."
exit 0
