# Template — Relatório de fechamento (`close`)

Output language: pt-BR. Step 6 output of `references/evidence-path.md`: the
record of following the planned evidence path after implementation. Exactly
one outcome per claim — established / limited / refuted — no hedge wording
between them.

```markdown
# Fechamento do caminho de evidência — <mudança em uma linha>

## Resultado por afirmação

### <afirmação 1>
- Desfecho: **ESTABELECIDA** | **LIMITADA** | **REFUTADA**
- Evidência executada: `arquivo:linha` / <comando e artefato> — `<snippet ou saída curta>`
- Leitura: <como a evidência lida contra a afirmação suporta o desfecho>
- Dono da evidência (evidence owner): <o que cumpriu o papel no orçamento>

<repetir por afirmação>

## Fatos conhecidos
- <o que a evidência estabelece diretamente — cada item com sua fonte>

## Incerteza remanescente
- <o que está fora do alcance desta evidência e o que a resolveria>

## Affordances — destino
| Affordance | Ciclo de vida | Ação tomada |
| --- | --- | --- |
| ... | temporário / durável | removida / retida em ... |

## Passos seguintes (faseado)
1. **Fase 1 — <nome>** (uma sprint): <ações> → <resultado esperado>
2. **Fase 2 — <nome>**: ...
```

## Definition of Done

- [ ] Every claim from the evidence plan has exactly one outcome:
      ESTABELECIDA / LIMITADA / REFUTADA — no hedging between them.
- [ ] LIMITADA states the exact missing fact and what would resolve it; it is
      never a quiet success.
- [ ] "Fatos conhecidos" and "Incerteza remanescente" are separated; no fact
      appears in both.
- [ ] Every evidence line carries its artifact (`arquivo:linha`, command
      output) — not a restatement of the plan's reasoning.
- [ ] Temporary affordances removed or scheduled; durable ones retained
      deliberately, with their location. Committed code, or code this session
      did not add, was deleted only after the user confirmed.
- [ ] Every check that needed confirmation (router Engagement rule 3:
      shared/staging/prod writes, migrations, external calls or messages, new
      dependencies, evidence-only support files, deletions) and did not get
      it is LIMITADA, with the exact command for the user to run.
- [ ] Phase 1 fits one sprint; sources tagged (`[sistema sob análise]`,
      `[specs/docs do projeto]`, `[prática pós-2020]`); unbacked claims marked
      `[sem fonte verificada]`.
- [ ] Output in pt-BR; template sections preserved in order.
