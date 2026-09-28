# Template: focused review (`review`)

Used for a change (diff, PR, commit range), a specific area, a
security-focused release gate, or a suspicious contribution. Coverage claims
are limited to what the scope touches. Render in pt-BR; keep the sections
and their order; delete these instruction lines.

**Gate verdict rule (this skill's rule).** The verdict follows from the
verified results, never the other way round:

| Verified results in scope | Verdict |
| --- | --- |
| Any confirmed `CRÍTICO` or `ALTO` | `BLOQUEAR` |
| Confirmed `MÉDIO`, or an open `needs-validation` on a boundary the change touches | `APROVAR COM CONDIÇÕES` (conditions = the fixes or validations that must land first) |
| Only `BAIXO` / `INFORMATIVO`, or nothing confirmed | `APROVAR` |

A suspicious-contribution indicator that is still unexplained after review
is at least `APROVAR COM CONDIÇÕES`; a malicious artifact that can reach the
release chain is `CRÍTICO` and therefore `BLOQUEAR`.

```markdown
# Revisão de segurança — <PR / diff / área>

**Escopo:** <arquivos / diff / PR> · **Commit imutável:** <SHA ou A..B ou head do PR>
**Fora do escopo:** <…> · **Evidência dinâmica:** <executada em … | não executado — motivo>

## Veredito do gate

**<APROVAR | APROVAR COM CONDIÇÕES | BLOQUEAR>** — <uma frase ligando o veredito aos achados>

## Evidência automatizada

<Ferramentas, configuração inspecionada, resultado e ressalvas — ou "não executada, motivo: …".>

## Achados

<Se não houver nenhum confirmado, escreva exatamente: "nenhum achado substanciado no escopo auditado".>

### [<CRÍTICO|ALTO|MÉDIO|BAIXO|INFORMATIVO>] <título> — confiança: <proven|probable|possible>

- **Ativo e limite:** <…> `[boundaries §N]`
- **Evidência:** `arquivo:linha` — `<trecho curto>`
- **Pré-requisitos e caminho de exploração:** <…>
- **Impacto / raio de alcance:** <…>
- **Remediação:** <mudança mínima no limite dono>
- **Testes de regressão:** <… + caso de controle legítimo>
- **Divulgação e rollout:** <…>

## Limites revisados sem achado

| Limite tocado pela mudança | Evidência de cobertura |
| --- | --- |
| <nome> `[boundaries §N]` | <caminhos lidos, checagens, resultado> |

## Necessita validação

| Candidato | Fato ausente | Por que não foi possível | O que resolve |
| --- | --- | --- | --- |
| <…> | <…> | <…> | <…> |

## Candidatos rejeitados

- <afirmação> — refutado por <controle/fato> em `arquivo:linha`.

## Contribuição suspeita

<Somente quando aplicável; senão "não aplicável". Indícios observados (pistas de `[boundaries §12]`, com `arquivo:linha`) e o julgamento de intenção e alcance. Pista não é prova.>

## Pontos positivos

- <controle verificado> — `arquivo:linha` <ou: "nenhum identificado com evidência">

## Correções recomendadas

1. <uma correção por limite coerente, na ordem em que devem entrar>

## Próximos passos (faseados)

1. **Fase 1 (cabe em uma sprint):** <…>
2. **Fase 2:** <…>
```

## Definition of Done (check before answering)

- [ ] Veredito explícito e derivado dos achados pela regra acima.
- [ ] Escopo com referência imutável; afirmações de cobertura limitadas ao que a mudança toca.
- [ ] Nenhum "revisado" sem evidência concreta.
- [ ] Todo achado passou por refutação independente e tem todos os campos (severidade, confiança, evidência, pré-requisitos, impacto, remediação, teste com controle legítimo, divulgação).
- [ ] "Necessita validação" sem severidade; rejeitados com refutação.
- [ ] Indícios de contribuição suspeita tratados como pistas, com julgamento de intenção e alcance.
- [ ] Correções ordenadas, uma por limite; Fase 1 cabe em uma sprint.
- [ ] Pontos positivos presentes ou "nenhum identificado com evidência".
- [ ] Sem achados ⇒ frase exata "nenhum achado substanciado no escopo auditado"; nunca "seguro"/"limpo".
- [ ] Citações só de referências carregadas (senão `[sem fonte verificada]`).
- [ ] pt-BR; seções na ordem do template.
