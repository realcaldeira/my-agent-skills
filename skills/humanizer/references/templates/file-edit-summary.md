# Template — Resumo de edição de arquivo (`edit-file`)

Meta-comentários em pt-BR. O texto gravado no arquivo fica no idioma da fonte —
nunca traduza. Substitua todos os marcadores `<…>`; apague nada.

```markdown
# Resumo de edição — `<caminho do arquivo>`

## Edições de prosa

- `<trecho antes>` → `<trecho depois>` — padrão <n> (<nome em inglês>): <por quê, 1 frase>

## Elementos preservados

Confirmado sem alteração: blocos de código, código inline, comandos, caminhos,
metadados YAML/frontmatter, dados e destinos de link.
- <itens específicos do arquivo que foram deixados intactos, se houver>

## Definição de pronto (DoD)

- [ ] Somente prosa foi alterada; nenhum bloco de código, código inline, comando, caminho, YAML, dado ou destino de link mudou.
- [ ] O arquivo final está no idioma da prosa original; nada foi traduzido.
- [ ] Nenhum fato, nome, número, data, citação ou referência foi inventado ou perdido.
- [ ] Os cinco sobreviventes foram revistos após o rascunho: not-X-but-Y, fecho de uma linha, travessão, tríade forçada, rótulo em negrito.
- [ ] Frases de comprimentos variados; voz preservada (regras de `references/voice-and-guardrails.md`).
```

## Definition of Done

- [ ] Only the two summary sections are output; the final text lives in the file, not in the reply.
- [ ] Each edit line shows before/after and the tell that justified it.
- [ ] The untouched-elements confirmation is explicit and matches what the file actually contains (checked with `git diff --word-diff <path>` when the file is tracked).
- [ ] Fact audit was run; file mode never invents details to fill a gap — it asks instead.
- [ ] DoD block inside the summary is completed before answering.
