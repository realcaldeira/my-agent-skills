# Template — Relatório de fechamento (`close`)

Output language: pt-BR. Step 6 output of `references/evidence-path.md`: the
record of following the planned evidence path after implementation. Exactly
one outcome per claim — established / limited / refuted — no hedge wording
between them. Claims keep the plan's C1..Cn IDs.

```markdown
# Fechamento do caminho de evidência — <mudança em uma linha>

Fonte do plano: <`.agent/verification/<slug>.md` | conversa | **fechamento retroativo — afirmações formuladas após a implementação** (confirmadas pelo usuário antes da evidência)>

## Resultado por afirmação

### C1 — <afirmação>
- Desfecho: **ESTABELECIDA** | **LIMITADA** | **REFUTADA**
- Evidência executada: `arquivo:linha` / <comando e artefato> — `<snippet ou saída curta>`
- Execução confirmada: <alvo certo; nº de testes/casos executados > 0; nada pulado ou filtrado>
- Discriminação: <fail-first observado (antes do fix / commit base) | sinal de falha que teria aparecido | não mostrada → LIMITADA: motivo>
- Leitura: <como a evidência lida contra a afirmação suporta o desfecho>
- Dono da evidência (evidence owner): <o que cumpriu o papel no orçamento>

<repetir por afirmação>

## Desvios do plano
- <evidência planejada → executada, e por quê; evidência reutilizada cuja condição de reuso a implementação quebrou → re-executada ou LIMITADA>

_Sem desvios → "Nenhum desvio: o caminho foi seguido como planejado"_

## Fatos conhecidos
- <o que a evidência estabelece diretamente — cada item com sua fonte>

## Incerteza remanescente
- <o que está fora do alcance desta evidência e o que a resolveria; em fechamento retroativo, registrar que as afirmações foram formuladas após a implementação>

## Affordances e suporte — destino
| Affordance / suporte | Ciclo de vida | Ação tomada |
| --- | --- | --- |
| ... | temporário / durável | removida / retida em ... |

## Passos seguintes (faseado)
1. **Fase 1 — <nome>** (uma sprint): <ações> → <resultado esperado>
2. **Fase 2 — <nome>**: ...
```

## Definition of Done

- [ ] "Fonte do plano" names the file or the conversation, or the report is
      marked fechamento retroativo and the reconstructed claims were
      confirmed by the user before any evidence ran.
- [ ] Every claim from the evidence plan has exactly one outcome:
      ESTABELECIDA / LIMITADA / REFUTADA — no hedging between them.
- [ ] Every ESTABELECIDA shows discrimination (fail-first or an observable
      failure signal) and a confirmed execution (target, count > 0, nothing
      skipped); otherwise the outcome is LIMITADA with the reason.
- [ ] LIMITADA states the exact missing fact and what would resolve it; it is
      never a quiet success.
- [ ] "Desvios do plano" is filled or uses the placeholder line; reused
      evidence with a broken reuse condition was re-run or is LIMITADA.
- [ ] "Fatos conhecidos" and "Incerteza remanescente" are separated; no fact
      appears in both.
- [ ] Every evidence line carries its artifact (`arquivo:linha`, command
      output) — not a restatement of the plan's reasoning.
- [ ] Temporary affordances and support removed or scheduled; durable ones
      retained deliberately, with their location. Committed code, or code
      this session did not add, was deleted only after the user confirmed;
      the user's uncommitted work was never discarded, stashed, or reverted.
- [ ] Every check that needed confirmation (router Engagement rule 3:
      shared/staging/prod writes, migrations, external calls or messages, new
      dependencies, extra checkouts/worktrees, evidence-only support files,
      deletions) and did not get it is LIMITADA, with the exact command for
      the user to run.
- [ ] Phase 1 fits one sprint; sources tagged (`[sistema sob análise]`,
      `[specs/docs do projeto]`, `[doc oficial: <URL>]`, `[suposição]`);
      unbacked claims marked `[sem fonte verificada]`; a claim resting on an
      unverified `[suposição]` is at most LIMITADA.
- [ ] Output in pt-BR; template sections preserved in order.
