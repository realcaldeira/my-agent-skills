# Template — Review report (`review`, diagnosis only)

Output language: pt-BR for the commentary; quoted excerpts stay in the source
language. Replace every `<…>` placeholder; delete nothing. This mode **edits
nothing and rewrites nothing**: the deliverable is the list of tells and what
already works. It describes style only and never says who or what wrote the
text. Strength labels come from the tiers in `references/voice-and-guardrails.md`.

```markdown
# Diagnóstico de estilo — <título ou primeiras palavras do texto>

## Marcas encontradas

| # | Padrão | Trecho | Força | Sugestão |
| --- | --- | --- | --- | --- |
| <n> | <nome do padrão, em inglês> | `<trecho exato>` | <forte · padrão · fraca sozinha> | <o que mudar, 1 frase, sem reescrever o texto> |

## O que já soa humano

- `<trecho>` — <por que manter: detalhe específico, sentimento misto, referência datada, aparte genuíno, escolha do autor>

## Leitura geral

<2–3 frases: quais tipos de marca predominam e onde se concentram. Descreve o estilo; não afirma se foi escrito por pessoa ou por IA.>

## Próximo passo

- <`rewrite` para o texto colado, ou `edit-file <caminho>` para o arquivo; ou "nada a mudar" se não houver marcas que justifiquem edição>

## Definição de pronto (DoD)

- [ ] Nenhuma reescrita do texto e nenhum arquivo alterado.
- [ ] Cada marca tem trecho real, número de padrão real (1–25) e o nível correto; marcas fracas sozinhas só aparecem junto de outras na mesma passagem.
- [ ] As regras do idioma da fonte foram aplicadas (ex.: travessão de diálogo e hífen ortográfico em pt-BR não contam).
- [ ] Nenhum veredito sobre autoria; a leitura geral fala só de estilo.
- [ ] Comentários em pt-BR; trechos citados no idioma da fonte.
```

## Definition of Done

- [ ] Sections present in order: marcas, o que já soa humano, leitura geral, próximo passo.
- [ ] No draft, no final rewrite, no file write; a path argument was only read.
- [ ] Every tell row quotes the text exactly and uses a real pattern number with its tier label.
- [ ] The positive section names concrete voice carriers, or says plainly that none were found.
- [ ] If the user asked whether a detector will flag the text, the answer says the skill cannot predict detector results.
- [ ] DoD block inside the report is completed before answering.
