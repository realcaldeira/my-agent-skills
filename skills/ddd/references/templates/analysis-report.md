# Template — Analysis report (`analyze` / `review`)

Output language: pt-BR. Replace every placeholder; delete nothing.

```markdown
# Relatório de análise DDD — <projeto>

## Resumo executivo
- <3–5 bullets: achados mais importantes>
- Grau geral de aderência a DDD: <alto/médio/baixo> — <1 frase>

## Escopo analisado
- <commit/range/arquivos; o que ficou de fora e por quê>

## Achados por categoria

### Agregados e invariantes
- **[CRÍTICO|ALTO|MÉDIO|BAIXO]** <título do achado>
  - Evidência: `arquivo:linha` — `<snippet curto>`
  - Referência: <regra — ex. `[IDDD ch.10]` Regra 3>
  - Correção sugerida: <incremental, 1 sprint>

### Entidades e Value Objects
<mesmo formato>

### Bounded Contexts e Ubiquitous Language
<mesmo formato>

### Serviços, Repositórios e camadas
<mesmo formato>

### Eventos de domínio
<mesmo formato>

### Integração entre contextos
<mesmo formato>

## Anti-padrões identificados
| Anti-padrão | Achados relacionados | Referência |
| --- | --- | --- |

## O que já está bom
- <reforço positivo — o que o time acerta>

## Plano de refatoração (faseado)
1. **Fase 1 — <nome>** (uma sprint): <ações> → <resultado esperado>
2. **Fase 2 — <nome>**: ...
3. **Fase 3 — <nome>**: ...

## Riscos e trade-offs
- <o que pode piorar no curto prazo; o que foi deliberadamente deixado de fora>
```

**Scoping for `review`:** keep only the categories the diff touches; replace
"Plano de refatoração" with "Correções recomendadas" (a short, ordered fix
list); skip repo-wide context mapping unless the diff crosses boundaries.

## Definition of Done

- [ ] Every finding has severity + `path:line` evidence + source tag + fix.
- [ ] No claim without a source tag; unverifiable claims marked
      `[sem fonte verificada]` or removed.
- [ ] At least one positive finding (or an explicit "nenhum encontrado").
- [ ] Phase 1 fits one sprint.
- [ ] Output in pt-BR; template sections preserved in order.
