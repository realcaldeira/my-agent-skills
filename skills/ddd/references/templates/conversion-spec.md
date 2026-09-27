# Template — Legacy → DDD conversion spec (`spec`)

Output language: pt-BR. Two variants — **choose at the start and say which**:

- **Enxuta (this page)** — 1–2 contexts, small team, "is DDD worth it here?"
  or executive communication. **Default when in doubt.**
- **Completa (12 seções)** — multi-module ERP, compliance, multi-month
  reference document. Use this same template plus one appendix per module,
  with a bounded-context canvas per target context.

```markdown
# Spec de conversão DDD — <projeto>

**Variante:** <enxuta | completa> — **Decisão inicial:** <vale DDD aqui? sim/parcial/não + 1 frase>

## 1. Contexto atual (as-is)
- Domínio e problema em 1 parágrafo
- Principais dores evidenciadas: <bugs, tempo de mudança, linguagem>
- Stack e restrições: <deploy, DB, compliance, time>

## 2. Visão alvo (to-be)
- Domain Vision Statement
- Subdomínios core/supporting/generic

## 3. Bounded contexts alvo
| Contexto | Propósito | Nasce de (módulo legado) | Prioridade |
| --- | --- | --- | --- |

## 4. Context map (to-be + integração com legado)
<diagrama; setas rotuladas; ACLs sobre o legado>

## 5. Migração — faseamento
### Fase 0 — Entender (<tempo>)
<event storming, mapa, decisões>
### Fase 1 — Bubble piloto (<tempo>)
<escopo, contexto, ACL, entregável>
### Fase 2..N — Expandir/estrangular
<...>
### Fase final — Descomissionar
<critérios>

## 6. Dados
- Ownership por contexto
- Estratégia de cutover: <dual write + reconciliação | big bang por contexto>
- Reconciliação e métricas de drift

## 7. Estilo arquitetural e restrições técnicas
<modular monolith, hexagonal por módulo; IDs (ULID/UUID), outbox, versionamento de eventos>

## 8. Camada de aplicação dos contextos novos
<command handlers, sagas/process managers onde houver consistência eventual — ver aggregate-design.md>

## 9. Testes e aceitação
<Cenários Given-When-Then por aggregate crítico>

## 10. Riscos e trade-offs
| Risco | Impacto | Mitigação |
| --- | --- | --- |

## 11. Primeiro incremento (uma sprint)
- <ação> → <resultado verificável>

## 12. Métricas de sucesso
- <lead time, % de regras cobertas por testes de negócio, drift zero, ...>
```

## Definition of Done

- [ ] Variant declared up front.
- [ ] Phase 1 is a real bubble with an ACL — not a rewrite announcement.
- [ ] Data ownership and reconciliation explicitly addressed.
- [ ] Every phase has an exit criterion and a rollback point.
- [ ] First increment sized to one sprint with a verifiable result.
- [ ] Risks include organizational ones (compliance, team skill, release).
- [ ] Output in pt-BR.
