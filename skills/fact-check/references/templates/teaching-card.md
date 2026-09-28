# Template: teaching card (`explain`)

Output language: pt-BR (mirror the user otherwise). About 5 to 10 minutes of
reading, no report scaffolding. Canonical English terms (claim, deal breaker,
load-bearing, tier) keep the English word with the Portuguese equivalent on
first use. Teach from the one reference the router's concept lookup picked;
`explain` writes nothing to disk.

```markdown
## <Conceito>

**Definição:** <2–3 frases fiéis à referência carregada> — fonte: `<arquivo de referência>`, seção "<seção>"

**Por que importa:** <o erro ou risco que o conceito evita, em 2–3 frases>

**Como funciona:**
- <passo ou regra>
- <passo ou regra>

**Regras e exceções:**
- <regra concreta> — exceção: <quando não se aplica>

**Exemplo:**
<cenário curto e realista; citações no idioma original>

**Erros comuns:**
- <ex.: extrair opinião como claim>
- <ex.: rodar os dois passes em paralelo>

**Para aprofundar:** `<arquivo de referência>` — seção "<seção>"
```

## Definition of Done

- [ ] The definition cites the loaded reference and section; no invented
      rules, sources, or quotes.
- [ ] "Regras e exceções" and "Erros comuns" are present and concrete.
- [ ] The example is short and generic: no machine-specific tooling or paths.
- [ ] The answer opens with the concept itself, no preamble.
- [ ] pt-BR (or the user's language), with quotes and examples kept in their
      original language.
