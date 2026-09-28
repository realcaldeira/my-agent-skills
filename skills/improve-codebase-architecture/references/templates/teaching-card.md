# Template — Teaching card (`explain`)

Output language: pt-BR. Canonical terms stay in English (depth, seam,
leverage, locality, adapter), Portuguese equivalent on first use.

```markdown
## <Conceito>

**Definição:** <paráfrase fiel à referência carregada — ex. `[Ousterhout]`,
`[Feathers]` — 2–3 frases>

**Por que importa:** <o problema que resolve — 2–3 frases>

**Quando usar:**
- <bullets curtos>

**Quando NÃO usar / sinais de má aplicação:**
- <bullets>

**Exemplo:**
<pseudocódigo curto, agnóstico de stack, sem framework>

**Contra-exemplo:**
<o mesmo problema resolvido sem o conceito — o custo fica visível>

**Relaciona-se com:** <outros conceitos deste skill — links para as
referências>

**Aprofundar:** <referência deste skill onde o conceito é dono>

**Fontes:** <tags usadas>
```

## Definition of Done

- [ ] Definition cites a loaded reference; no invented quotes or chapters.
- [ ] "Quando NÃO usar" is present and concrete.
- [ ] A counter-example is present and shows the cost of *not* using the
      concept (or the cost of misusing it).
- [ ] Example and counter-example are short and stack-agnostic (no
      Spring/EF/Django).
- [ ] Answer is direct — the concept first, no preamble.
- [ ] Output in pt-BR.
