# Template — Rewrite report (`rewrite`, pasted-text mode)

Output language: pt-BR for the meta commentary. The rewritten text stays in the
language of the source text; never translate it. Replace every `<…>`
placeholder; delete nothing. Strength labels come from the tiers in
`references/voice-and-guardrails.md`.

```markdown
# Relatório de reescrita — <título ou primeiras palavras do texto>

## Texto com marcas

| # | Padrão | Trecho | Força |
| --- | --- | --- | --- |
| <n> | <nome do padrão, em inglês> | `<trecho exato>` | <forte · padrão · fraca sozinha> |

## Rascunho

<primeira reescrita, integral, no idioma da fonte>

## Padrões remanescentes

- <padrão ainda perceptível no rascunho + onde + o que falta resolver>
- <detalhe que faltou na fonte: pergunta ao autor + frase mais simples usada no lugar; omitir se não houver>

## Reescrita final

<versão final, integral, no idioma da fonte; comprimentos de frase variados>

## Definição de pronto (DoD)

- [ ] Todo trecho marcado foi resolvido na versão final ou justificado.
- [ ] Nenhum fato, nome, número, data, citação ou referência foi inventado ou perdido.
- [ ] Os cinco sobreviventes (`references/voice-and-guardrails.md`) foram revistos após o rascunho.
- [ ] A versão final está no idioma do texto de origem, com a ortografia e a pontuação desse idioma; a voz foi preservada.
- [ ] Frases de comprimentos variados; metacomentários em pt-BR.
```

## Definition of Done

- [ ] All four sections present, in this order: marcas, rascunho, restantes, final.
- [ ] Every tell row carries a real quote from the text, a real pattern number (1–25), and that pattern's tier label.
- [ ] Draft and final are the full text, not excerpts, and stay in the source language.
- [ ] Fact audit was run: no added or dropped claims (shape edits under 6, 9, 19 checked first).
- [ ] Where a detail was missing, the simpler sentence was used and the missing detail is listed as a question under Padrões remanescentes.
- [ ] DoD block inside the report is completed before answering.
