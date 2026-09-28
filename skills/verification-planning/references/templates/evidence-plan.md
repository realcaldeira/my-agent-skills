# Template — Plano de evidência (`plan`)

Output language: pt-BR. Canonical terms stay in English with the Portuguese
equivalent on first use. Built from `references/evidence-path.md` steps 1–5 +
verification budget. Section order is fixed; optional sections keep their
heading and use the placeholder line.

```markdown
# Plano de evidência — <mudança em uma linha>

## Afirmação (claim)
<frase-título: o que precisa passar a ser verdade, em uma frase testável>

### Afirmações distintas
- **C1** — <uma frase testável, que pode falhar sozinha>
- **C2** — ...

### O que deve mudar
- <bullets — comportamentos observáveis que passam a valer>

### O que deve permanecer verdadeiro
- <bullets — invariantes e comportamentos que não podem mudar>

### Fronteiras atravessadas
- <limites relevantes: módulo, processo, rede, dados, tempo, ownership>

### Falha que mais importa
- <qual falha tornaria uma conclusão confiada incorreta, e por quê>

## Pesquisa e premissas
| Pergunta | Conclusão | Fonte |
| --- | --- | --- |
| ... | ... | `[doc oficial: <URL>]` / `[specs/docs do projeto]` |

_Sem pesquisa necessária → "Nenhuma pesquisa: <por que as capacidades já são conhecidas>"_

- Premissas `[suposição]`: <o que não pôde ser confirmado> → afirmações afetadas: <Cn>

## Caminho de evidência (evidence path)

### Superfície de verificação existente
- <testes perto da mudança, comandos de CI/teste/lint/typecheck, ambientes — cada um com `arquivo:linha`>

| # | Afirmação (Cn) | Evidência | Sinal de falha (se Cn fosse falsa) | Repetível / reversível |
| --- | --- | --- | --- | --- |
| 1 | C1 | ... | ... | ... |

### Alternativas consideradas
| Alternativa | Por que não foi escolhida (ou quando voltar a ela) |
| --- | --- |

## Affordances de verificação
| Affordance | Torna controlável/observável | Ciclo de vida (temporário / durável) | Destino |
| --- | --- | --- | --- |
| ... | ... | ... | ... |

_Sem affordance necessária → "Nenhuma affordance: <por que o caminho atual basta>"_

## Orçamento de verificação (verification budget)
| Cn | Dono da evidência (evidence owner) | Fail-first | Condição de reuso |
| --- | --- | --- | --- |
| C1 | <# do caminho> | <antes do fix / commit base em checkout separado / inviável: motivo / n.a. (não é bug fix)> | <o que invalida esta evidência> |
| Baseline | <checagens obrigatórias do repo/CI> | n.a. | <quando rodar de novo> |

## Como executar o caminho
- Pré-condições / estado inicial: <...>
- Comandos exatos: `<comando>` — ou "requer confirmação: `<comando>`"
- Onde observar: `arquivo:linha` / log / query
- Como interpretar: <resultado observado → desfecho por Cn>
- Como resetar: <...>
- Suporte: <arquivo:linha — construído nesta sessão | a construir no fechamento (aprovação pendente)>

## Critérios de pronto
- [ ] <condição observável que encerra o trabalho>

## Passos seguintes (faseado)
1. **Fase 1 — <nome>** (uma sprint): <ações> → <resultado esperado>
2. **Fase 2 — <nome>**: ...
```

## Definition of Done

- [ ] The headline claim is one sentence; each Cn is one testable sentence
      that can fail independently; "o que deve mudar" and "o que deve
      permanecer verdadeiro" are both non-empty.
- [ ] The failure that matters most is named, not implied.
- [ ] "Superfície de verificação existente" lists what was inspected, with
      `arquivo:linha`, before any question was asked.
- [ ] The evidence path is derived from the [sistema sob análise] (controllable
      inputs, observable effects, state transitions, invariants, boundaries,
      artifacts, repeatability/reversibility), not from a generic technique.
- [ ] Every evidence row names its Cn and its failure signal; every bug-fix
      claim states how fail-first is shown, or why it is not feasible.
- [ ] At least one alternative is considered, with a reason and a "when to
      revisit" condition.
- [ ] Every Cn has exactly one evidence owner, keyed by the same ID in the
      evidence table and the budget; no duplicated evidence; reuse conditions
      are explicit; a Baseline row names the required checks.
- [ ] Every affordance and every support file has a lifecycle (temporário /
      durável) and a destino; no product change was built.
- [ ] Research conclusions cite their source, or the placeholder line is
      used; every `[suposição]` names the Cn it affects.
- [ ] "Como executar o caminho" leaves nothing to guess: initial state, exact
      commands, where to observe, how to interpret, how to reset.
- [ ] Phase 1 fits one sprint; sources tagged (`[sistema sob análise]`,
      `[specs/docs do projeto]`, `[doc oficial: <URL>]`, `[suposição]`);
      unbacked claims marked `[sem fonte verificada]`.
- [ ] Output in pt-BR; template sections preserved in order.
