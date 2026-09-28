# Template — Teaching card (`explain`)

Output language: pt-BR. Canonical terms stay in English with the Portuguese
equivalent on first use. Teach what a codemap is, when it is worth the cost,
and what to do instead — including when NOT to use it.

```markdown
## <Conceito — ex. codemap, atlas raiz, detecção de mudanças por hash>

**Definição:** <o que é, em 1–2 frases, com a fonte — ex. `[codemap.mjs output]`>

**Para que serve:** <o problema que resolve — navegação/onboarding barato em
repositórios desconhecidos>

**Quando vale a pena:**
- <bullets curtos — ex. repositório desconhecido, muitas pastas, onboarding>

**Custo:**
- <ex. uma operação cara: um subagent por pasta para escrever os mapas;
  atualizações só nas pastas cujo hash mudou>

**Quando NÃO usar / alternativas:**
- <bullets — ex. repo pequeno (< ~10 pastas): leia o código direto; repositório
  já conhecido: não re-mapear; dúvida pontual: explique o módulo, não mapeie
  o repo; só navegação: `repo tree`>

**Exemplo genérico:**
<trecho curto — ex. um mapa de pasta ou a saída do `changes`>

**Aprofundar:** <referência deste skill>
```

## Definition of Done

- [ ] Definition and "para que serve" are direct — concept first, no
      preamble.
- [ ] Cost is stated explicitly (expensive; one subagent per folder; refresh
      only changed folders).
- [ ] "Quando NÃO usar / alternativas" is present and concrete.
- [ ] Example is short and generic (no product or project-specific names).
- [ ] Any claim about script behavior cites `[codemap.mjs output]` or the
      skill's references; nothing invented.
- [ ] Output in pt-BR.
