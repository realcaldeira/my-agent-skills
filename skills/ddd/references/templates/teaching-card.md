# Template — Teaching card (`explain`)

Output language: pt-BR. Canonical terms stay in English with the Portuguese
equivalent on first use.

```markdown
## <Conceito>

**Definição (<fonte>):** <paráfrase fiel + tag do vocabulário de citação, ex. `[Evans Reference]`>

**Por que importa:** <o problema que resolve — 2–3 frases>

**Quando usar:**
- <bullets curtos>

**Quando NÃO usar / sinais de má aplicação:**
- <bullets>

**Exemplo agnóstico:**
<pseudocódigo curto, sem framework>

**Relaciona-se com:** <outros conceitos, pelo nome>

**Aprofundar:** <livro/capítulo ou fonte pública do vocabulário de citação, ex. `[IDDD ch.10]`>

**Fontes:** <tags usadas>
```

## Definition of Done

- [ ] Definition cites a loaded reference; no invented quotes or chapters.
- [ ] Source label matches the concept's origin (not "Evans" by default); no
      internal skill file names in the output.
- [ ] "Quando NÃO usar" is present and concrete.
- [ ] Example is short and stack-agnostic (no Spring/EF/Django).
- [ ] Answer is direct — the concept first, no preamble.
- [ ] Output in pt-BR.
