# Template — File edit summary (`edit-file`)

Output language: pt-BR for the meta commentary. The text written to the file
stays in the language of the source; never translate it. Replace every `<…>`
placeholder; delete nothing. With several files, repeat the block once per
file, in the order they were edited.

```markdown
# Resumo de edição — `<caminho do arquivo>`

## Edições de prosa

- `<trecho antes>` → `<trecho depois>` — padrão <n> (<nome em inglês>): <por quê, 1 frase>
- `<trecho>` — detalhe ausente na fonte: <pergunta ao autor>; usada a frase mais simples `<trecho depois>` <omitir se não houver>

## Elementos preservados

Confirmado sem alteração: blocos de código, código inline, comandos, caminhos,
metadados YAML/frontmatter, dados e destinos de link.
- <itens específicos do arquivo que foram deixados intactos, se houver>

## Definição de pronto (DoD)

- [ ] Somente prosa foi alterada; nenhum bloco de código, código inline, comando, caminho, YAML, dado ou destino de link mudou.
- [ ] O arquivo final está no idioma da prosa original, com a ortografia e a pontuação desse idioma; nada foi traduzido.
- [ ] Nenhum fato, nome, número, data, citação ou referência foi inventado ou perdido.
- [ ] Os cinco sobreviventes (`references/voice-and-guardrails.md`) foram revistos após o rascunho.
- [ ] Frases de comprimentos variados; voz preservada (regras de `references/voice-and-guardrails.md`).
```

## Definition of Done

- [ ] Only the two summary sections are output per file; the final text lives in the file, not in the reply.
- [ ] Each edit line shows before/after and the tell that justified it.
- [ ] The untouched-elements confirmation is explicit and matches what the file actually contains (checked with `git diff --word-diff <path>` when the file is tracked).
- [ ] Fact audit was run; file mode never invents details to fill a gap — it asks, or writes a simpler sentence and flags the missing detail as an edit line.
- [ ] DoD block inside each summary is completed before answering.
