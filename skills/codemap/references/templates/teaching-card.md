# Template — Teaching card (`explain`)

Output language: pt-BR. Canonical terms stay in English with the Portuguese
equivalent on first use. Teach what a codemap is, when it is worth the cost,
and what to do instead — including when NOT to use it.

```markdown
## <Conceito — ex. codemap, atlas raiz, detecção de mudanças por hash>

**Definição:** <o que é, em 1–2 frases, com a fonte — ex. `[codemap refs]`>

**Para que serve:** <o problema que resolve — navegação/onboarding barato em
repositórios desconhecidos>

**Quando vale a pena:**
- <bullets curtos — ex. repositório desconhecido, muitas pastas, onboarding>

**Custo:**
- <ex. uma operação cara: um subagent por pasta com arquivos próprios para
  escrever os mapas; atualizações só nas pastas com arquivos alterados>

**Quando NÃO usar / alternativas:**
- <bullets — ex. repo pequeno (< ~10 pastas): leia o código direto; repositório
  já conhecido: não re-mapear; dúvida pontual: explique o módulo, não mapeie
  o repo; só navegação: `git ls-files | head -50` ou `tree -L 2`>

**Exemplo genérico:**
<trecho curto — ex. um mapa de pasta ilustrativo; saída do `changes` só se
o script foi de fato executado nesta conversa (senão, descreva o formato
citando `[codemap refs]`)>

**Aprofundar:** <referência deste skill, ex. `references/content-spec.md`>
```

## Definition of Done

- [ ] Definition and "para que serve" are direct — concept first, no
      preamble.
- [ ] Cost is stated explicitly (expensive; one subagent per folder with
      files of its own; refresh only folders with changed files).
- [ ] "Quando NÃO usar / alternativas" is present and concrete.
- [ ] Example is short and generic (no product or project-specific names).
- [ ] Claims about the skill or script cite `[codemap refs]`;
      `[codemap.mjs output]` only for output actually produced in this
      conversation; nothing invented.
- [ ] Output in pt-BR.
