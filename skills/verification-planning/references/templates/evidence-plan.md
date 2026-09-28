# Template — Plano de evidência (`plan`)

Output language: pt-BR. Canonical terms stay in English with the Portuguese
equivalent on first use. Built from `references/evidence-path.md` steps 1–5 +
verification budget. Section order is fixed.

```markdown
# Plano de evidência — <mudança em uma linha>

## Afirmação (claim)
<o que precisa passar a ser verdade, em uma frase testável>

### O que deve mudar
- <bullets — comportamentos observáveis que passam a valer>

### O que deve permanecer verdadeiro
- <bullets — invariantes e comportamentos que não podem mudar>

### Fronteiras atravessadas
- <limites relevantes: módulo, processo, rede, dados, tempo, ownership>

### Falha que mais importa
- <qual falha tornaria uma conclusão confiada incorreta, e por quê>

## Caminho de evidência (evidence path)
| # | Evidência | Estabelece / limita / refuta | Como observar | Repetível / reversível |
| --- | --- | --- | --- | --- |
| 1 | ... | ... | ... | ... |

### Alternativas consideradas
| Alternativa | Por que não foi escolhida (ou quando voltar a ela) |
| --- | --- |

## Affordances de verificação
| Affordance | Torna controlável/observável | Ciclo de vida (temporário / durável) | Destino |
| --- | --- | --- | --- |
| ... | ... | ... | ... |

_Sem affordance necessária → "Nenhuma affordance: <por que o caminho atual basta>"_

## Orçamento de verificação (verification budget)
| Afirmação | Dono da evidência (evidence owner) | Evidência mínima | Condição de reuso |
| --- | --- | --- | --- |
| ... | ... | ... | <o que invalida esta evidência> |

## Critérios de pronto
- [ ] <condição observável que encerra o trabalho>

## Passos seguintes (faseado)
1. **Fase 1 — <nome>** (uma sprint): <ações> → <resultado esperado>
2. **Fase 2 — <nome>**: ...
```

## Definition of Done

- [ ] The claim is one testable sentence; "o que deve mudar" and "o que deve
      permanecer verdadeiro" are both non-empty.
- [ ] The failure that matters most is named, not implied.
- [ ] The evidence path is derived from the [sistema sob análise] (controllable
      inputs, observable effects, state transitions, invariants, boundaries,
      artifacts, repeatability/reversibility), not from a generic technique.
- [ ] At least one alternative is considered, with a reason and a "when to
      revisit" condition.
- [ ] Every distinct claim has exactly one evidence owner; no duplicated
      evidence; reuse conditions are explicit.
- [ ] Every affordance has a lifecycle (temporário / durável) and a destino.
- [ ] Phase 1 fits one sprint; sources tagged (`[sistema sob análise]`,
      `[specs/docs do projeto]`, `[prática pós-2020]`); unbacked claims marked
      `[sem fonte verificada]`.
- [ ] Output in pt-BR; template sections preserved in order.
