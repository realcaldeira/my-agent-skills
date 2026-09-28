# Template — Interface comparison (`interfaces`)

Output language: pt-BR. Canonical terms stay in English (seam, leverage,
locality, depth, adapter), Portuguese equivalent on first use. Replace every
placeholder; delete only sections marked "(se houver)" / "(se fizer sentido)"
(and the matching table column) when they do not apply. Present designs sequentially so the user can
absorb each one, then compare. Be opinionated — the user wants a strong read,
not a menu.

```markdown
# Comparação de interfaces — <candidato, nome do glossário do domínio>

## Espaço do problema (reafirmado)
- **Restrições:** <o que qualquer interface precisa satisfazer>
- **Dependências e categoria:** <1–4, ver `deepening.md`>
- **Sketch ilustrativo:** <o pseudocódigo que ancorou as restrições>

## Desenho 1 — <nome curto + a restrição de design do subagente>
- **Interface:** <tipos, métodos, parâmetros + invariantes, ordenação, modos
  de erro>
- **Exemplo de uso:** <como um caller real usa>
- **O que fica atrás da seam:** <o que a implementação esconde>
- **Estratégia de dependência:** <categoria + adaptadores>
- **Trade-offs:** <onde o leverage é alto, onde é fino>

## Desenho 2 — <... mesmo formato>

## Desenho 3 — <... mesmo formato>

## Desenho 4 (se houver) — <... mesmo formato>

## Comparação
| Critério | Desenho 1 | Desenho 2 | Desenho 3 | Desenho 4 |
| --- | --- | --- | --- | --- |
| Depth / leverage | <alto/médio/baixo — o que o caller aprende por ponto de entrada> | | | |
| Locality | <onde mudança/bug/conhecimento concentram> | | | |
| Posicionamento da seam | <onde vive e o que vaza> | | | |

<comparação em prosa: contrastar os desenhos pelos três critérios acima>

## Recomendação
- **Escolha:** <desenho mais forte — 2–3 frases de justificativa>
- **Híbrido (se fizer sentido):** <que elementos de desenhos diferentes se
  combinam, e como>
- **Próximo passo:** <incremento de uma sprint para implementar a escolha>
```

## Definition of Done

Self-check before answering; not part of the output.

- [ ] Every design follows the per-subagent output contract (interface with
      invariants/ordering/errors, usage example, what sits behind the seam,
      dependency strategy, trade-offs).
- [ ] Comparison by depth/leverage, locality, and seam placement.
- [ ] Opinionated recommendation (or hybrid) — no "it depends" as the final
      answer.
- [ ] Names come from the domain glossary; no forbidden substitutes from
      `vocabulary.md`.
- [ ] Next step fits in one sprint.
- [ ] Output in pt-BR; template sections kept in order.
