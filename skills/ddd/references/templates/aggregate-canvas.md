# Template — Aggregate design canvas (`model`)

Output language: pt-BR. Sections 1–7 follow the DDD Crew Aggregate Design
Canvas (name, description, state transitions, enforced invariants, corrective
policies, handled commands, created events, throughput and size; commands
and events share section 6) `[DDD Crew]`; sections 8–11 are this skill's
additions. One canvas per aggregate. For a feature spanning several
aggregates, write one canvas each and fill section 9 once, in the first
canvas.

Apply Vernon's rules from `aggregate-design.md` while filling it: start with
one entity plus value objects, add children only for a real invariant.

```markdown
# Aggregate Design Canvas — <Nome do agregado>

**Premissas:** <o que foi assumido sem confirmação, ou "nenhuma">

## 1. Nome
<termo da linguagem ubíqua; bounded context a que pertence>

## 2. Descrição
<1–2 frases: responsabilidade e por que é um agregado (qual invariante o justifica)>

## 3. Transições de estado
<estados e transições, ex.: Rascunho → Confirmado → Enviado | Cancelado>

## 4. Invariantes garantidas
| Invariante | Por que exige consistência imediata | Origem (regra de negócio) |
| --- | --- | --- |

## 5. Políticas corretivas
<regras que podem ficar eventualmente consistentes: evento → política → correção/compensação>

## 6. Comandos tratados e eventos criados
| Comando (imperativo) | Pré-condições | Evento(s) criado(s) (passado) | Rejeição |
| --- | --- | --- | --- |

## 7. Vazão e tamanho
- Comandos por <período>; usuários concorrentes na mesma instância: <estimativa | desconhecido — perguntar a quem?>
- Tamanho: <entidades filhas, crescimento esperado>; risco de contenção: <baixo/médio/alto>

## 8. Referências a outros agregados (por ID)
| Agregado | Identificador | Por que não está dentro |
| --- | --- | --- |

## 9. Coordenação entre agregados (feature com vários agregados)
<eventos + process manager/saga; janela de consistência aceita pelo negócio; ou "n/a">

## 10. Cenários Given-When-Then
- **Dado** <eventos/estado anterior> **Quando** <comando> **Então** <eventos criados | rejeição>

## 11. Primeiro incremento (uma sprint)
- <ação> → <resultado verificável>
```

## Definition of Done

- [ ] Every invariant is a business rule that needs immediate consistency, not
      a database convenience (Rule 1); the rest sits under políticas corretivas.
- [ ] Each child entity is justified by an invariant (Rule 2).
- [ ] Other aggregates referenced by ID only (Rule 3); cross-aggregate rules go
      through events (Rule 4) or cite a documented reason to break the rules.
- [ ] Commands are imperative, events past tense; every command has at least
      one Given-When-Then scenario, and at least one scenario is a rejection.
- [ ] Throughput and size estimated, or marked "desconhecido" with who to ask.
- [ ] Source tags from the citation vocabulary; no internal skill file names in
      the output. Output in pt-BR.
