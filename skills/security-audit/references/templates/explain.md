# Template: teaching card (`explain`)

Teach one concept: a boundary, a vulnerability class, a severity term, or a
hardening control. Load `severity.md` plus **exactly one** section of
`trust-boundaries.md`, chosen with the lookup below. Start with the concept —
no preamble. Render in pt-BR; delete these instruction lines.

## Concept → section lookup

| Keywords in the question | Load |
| --- | --- |
| auth, authentication, session, token, login, JWT, OAuth, MFA, rotation | `[boundaries §1]` |
| authorization, permission, capability, IDOR, BOLA, mass assignment, admin, confused deputy | `[boundaries §2]` |
| tenant, multi-tenancy, workspace isolation, data isolation | `[boundaries §3]` |
| injection, XSS, SSRF, SQL, command injection, path traversal, prompt injection, deserialization, archive / zip slip, ReDoS | `[boundaries §4]` |
| secrets, privacy, PII, redaction, telemetry, retention, logging secrets | `[boundaries §5]` |
| subprocess, plugin, hook, MCP, sandbox, update channel, build script | `[boundaries §6]` |
| persistence, migration, backup, integrity, TOCTOU, race, destructive operation | `[boundaries §7]` |
| HTTP, TLS, CORS, CSRF, cookie, webhook, proxy, header, request smuggling | `[boundaries §8]` |
| crypto, cipher, hash, signature, nonce, IV, randomness, certificate | `[boundaries §9]` |
| DoS, availability, rate limit, timeout, queue, backpressure | `[boundaries §10]` |
| supply chain, dependency, typosquat, CI, workflow, release, lockfile, provenance | `[boundaries §11]` |
| backdoor, malware, exfiltration, obfuscation, trojan source, bidi | `[boundaries §12]` |
| severity terms (CRÍTICO … INFORMATIVO, confidence, needs-validation) | `severity.md` only |
| anything else | `severity.md` first, then ask which boundary the user has in mind |

````markdown
# <Conceito> (<termo em inglês, se houver>)

**Definição:** <1–2 frases> `[boundaries §N]` (ou `[severity-scale]`)

## Por que importa

<2–3 frases: o que o atacante ganha e quem perde.>

## Quando se aplica

- <situações concretas em que o conceito é relevante>

## Quando NÃO se aplica / armadilhas

- <casos concretos em que não é problema — ex.: impacto só na própria conta>
- <armadilha — ex.: falácia do controle nomeado: apontar um sanitizer não prova que todo caminho passa por ele>

## Exemplo agnóstico

```text
<pseudocódigo curto, sem framework, mostrando o caminho de autoridade:
entrada → decisão (ou falta dela) → sink>
```

## Como auditar

- <2–3 bullets derivados da seção carregada ou da regra de severidade>

## Relaciona-se com

- <outras seções, citadas por tag: `[boundaries §N]`>

## Aprofundar

`references/trust-boundaries.md` (§N) · `references/attack-playbooks.md` (<seção, se houver>)

## Fontes

<tags usadas nesta resposta>
````

## Definition of Done (check before answering)

- [ ] Definição citada com a tag da seção carregada; nenhuma citação, seção, CVE ou número inventado (senão `[sem fonte verificada]`).
- [ ] "Quando NÃO se aplica" é concreto, não genérico.
- [ ] Exemplo curto, agnóstico de stack, mostrando o caminho de autoridade.
- [ ] Termos de severidade exatamente como na escala.
- [ ] Começa pelo conceito, sem preâmbulo; exatamente uma seção de limite carregada.
- [ ] pt-BR.
