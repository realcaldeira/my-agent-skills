# Template — Deepening plan (`deepen`)

Output language: pt-BR. Canonical terms stay in English (seam, adapter,
leverage, locality, port), Portuguese equivalent on first use. Replace every
placeholder; delete nothing. The plan is the output of the grilling loop —
every field reflects a decision made *with* the user or is explicitly marked
`em aberto — assumido: <padrão recomendado>` (see `deepening.md` §Grilling
loop for when the loop ends).

```markdown
# Plano de aprofundamento — <candidato, nome do glossário do domínio>

## Candidato
- **Módulo(s):** <o que será aprofundado — arquivos/módulos atuais>
- **Fricção resolvida:** <qual sinal de `friction-signals.md`, com evidência
  `arquivo:linha`>
- **Resultado do deletion test:** <merge/inline — pass-through, complexidade
  some; dobrar em <caller/callee> | aprofundar no lugar — complexidade
  reaparece em N callers, onde>

## Categoria de dependência
- **Categoria:** <1 in-process | 2 local-substitutable | 3 remote-but-owned
  (Ports & Adapters) | 4 true external (Mock)> — <justificativa em 1 frase>
- **Dependências:** <lista + categoria de cada uma>

## Posicionamento da seam
- **Onde vive a seam:** <o que os callers passam a ver — o contrato, não o
  tipo só>
- **O que fica atrás da seam:** <o que a implementação passa a esconder>
- **Seams internas vs externas:** <quais existem e por que não vazam para a
  interface>

## Adaptadores necessários
| Adaptador | Justificativa | Produção/Teste |
| --- | --- | --- |
| <ex.: in-memory> | <...> | teste |
| <ex.: HTTP> | <...> | produção |
- **Regra dos dois adaptadores:** <a seam é real? quem são os 2+ adaptadores?
  se só existe 1, não introduzir a seam>

## Plano de substituição de testes (replace, don't layer)
- **Testes que morrem:** <quais testes antigos dos módulos rasos são
  deletados — paths>
- **Testes que os substituem:** <quais testes na nova interface os tornam
  redundantes — o que cada um asserta (resultados observáveis)>
- **O que nunca se testa:** <estado interno / além da interface>

## Primeiro incremento (uma sprint)
1. <passo concreto e reversível> → <resultado esperado>
2. <...>
- **Definição de pronto do incremento:** <o que está verde ao fim da sprint>

## Glossário e ADRs propostos
- **Entradas de glossário:** <termo — definição; escrita após confirmação?
  sim/não; ou "sem glossário no projeto — proposta apenas"; ou "nenhuma">
- **ADR proposto:** <título + motivo load-bearing; gravado após confirmação?
  sim/não; ou "nenhum">

## Riscos e trade-offs
- <o que pode piorar no curto prazo; o que foi deliberadamente deixado de fora
  (ex.: segunda interface, migração completa de testes)>
```

## Definition of Done

Self-check before answering; not part of the output.

- [ ] Dependency category classified (1–4) and consistent with the test
      strategy.
- [ ] Seam placed; internal seams not exposed through the interface.
- [ ] Two-adapters rule respected (or the seam deferred, with a reason).
- [ ] Test plan is "replace, don't layer": lists what dies and what replaces
      it.
- [ ] First increment fits in one sprint and is reversible.
- [ ] Every field is a user decision or marked `em aberto — assumido: …`.
- [ ] Domain glossary terms used in names; no forbidden substitutes from
      `vocabulary.md`.
- [ ] Risks stated; no "rewrite everything".
- [ ] No glossary/ADR written without explicit user confirmation; no code or
      test file edited.
- [ ] Output in pt-BR; template sections kept in order.
