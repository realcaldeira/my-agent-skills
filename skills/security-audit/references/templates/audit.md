# Template: full audit (`audit`)

Render in pt-BR (mirror the user if they write in another language). Keep the
sections and their order; do not add sections. Replace `<...>`; delete these
instruction lines. Severity labels and confidence come from `severity.md`;
outcomes from `verification.md`; finding fields from `remediation.md`.

```markdown
# Auditoria de segurança — <projeto>

**Escopo:** <caminhos / serviços / range>
**Commit imutável:** <SHA ou A..B ou head do PR> · **Working tree:** <limpa | suja — alterações não commitadas dentro/fora do escopo>
**Fora do escopo / não testável:** <lista explícita>
**Ambientes não alcançados:** <ex.: produção, IdP, CDN> · **Evidência dinâmica:** <executada em … | não executado — motivo>

## Modelo de ameaças

- **Modo de implantação:** <…>
- **Ativos:** <segredos, dados de tenant, capacidade de execução, …>
- **Atores (capacidade inicial):** <visitante anônimo — …; usuário autenticado — …; contribuidor de CI — …>
- **Pontos de entrada:** <entrada → parsing → validação → authn → authz → efeito → armazenamento → resposta/log>
- **Zonas de confiança:** <quem roda como quem, onde, com quais credenciais>

## Evidência automatizada

| Ferramenta | Configuração inspecionada | Resultado | Ressalvas (supressões, thresholds, cobertura) |
| --- | --- | --- | --- |
| `security-surface.sh` | <NO_GIT? truncamentos? erros?> | <candidatos por tema> | <…> `[surface:security-surface.sh]` |
| <ferramenta do projeto> | <…> | <… ou não executado — motivo> | <…> |

## Achados

<Se não houver nenhum confirmado, escreva exatamente: "nenhum achado substanciado no escopo auditado".>

### [<CRÍTICO|ALTO|MÉDIO|BAIXO|INFORMATIVO>] <título curto> — confiança: <proven|probable|possible>

- **Ativo e limite:** <…> `[boundaries §N]`
- **Evidência:** `arquivo:linha` — `<trecho curto>` (entrada, saltos decisivos, sink, controle ausente/falho)
- **Pré-requisitos e caminho de exploração:** <quem, o que precisa antes, passo a passo>
- **Impacto / raio de alcance:** <usuário | tenant | frota | cadeia de release>
- **Remediação:** <mudança mínima no limite dono da decisão>
- **Testes de regressão:** <falha antes / passa depois + caso de controle legítimo>
- **Divulgação e rollout:** <compatibilidade, migração, prazo, embargo>

## Limites revisados sem achado

| Limite | Evidência de cobertura (caminhos, checagens, resultado) |
| --- | --- |
| <nome> `[boundaries §N]` | <concreta — "revisado" sozinho não vale> |
| <nome> `[boundaries §N]` | não aplicável — <fato concreto> |

## Necessita validação

| Candidato | Fato ausente | Por que não foi possível estabelecer | O que resolve (plano seguro) |
| --- | --- | --- | --- |
| <…> | <…> | <…> | <…> |

## Candidatos rejeitados

- <afirmação> — refutado por <controle/fato> em `arquivo:linha`.

## Risco residual e escopo não testado

<O que continua possível, o que não foi coberto e por quê. Nunca "seguro".>

## Pontos positivos

- <controle verificado> — `arquivo:linha` <ou: "nenhum identificado com evidência">

## Próximos passos (faseados)

1. **Fase 1 (cabe em uma sprint):** <itens de maior risco primeiro>
2. **Fase 2:** <…>
3. **Fase 3:** <…>
```

## Definition of Done (check before answering)

- [ ] Escopo cita a referência imutável, o estado da working tree e o que está fora do escopo.
- [ ] Todo achado tem severidade, confiança, evidência `arquivo:linha` + trecho, pré-requisitos, caminho, impacto, remediação no limite dono, teste de regressão com caso de controle legítimo, e divulgação/rollout.
- [ ] Todo achado confirmado passou por refutação independente (`verification.md`); nada entrou só por hit de scanner.
- [ ] Rejeitados têm a refutação em uma linha; "necessita validação" não tem severidade e traz fato ausente, motivo e o que resolve.
- [ ] Cada limite revisado tem evidência concreta; não aplicáveis têm motivo concreto.
- [ ] Severidades seguem a escala sem inflação e sem minimizar por "interno" não provado.
- [ ] Risco residual declarado; nenhuma palavra como "seguro", "garantido" ou "limpo".
- [ ] Sem achados ⇒ frase exata "nenhum achado substanciado no escopo auditado".
- [ ] Pontos positivos presentes ou "nenhum identificado com evidência".
- [ ] Fases ordenadas por risco; a Fase 1 cabe em uma sprint.
- [ ] Evidência dinâmica pulada registrada como "não executado — motivo".
- [ ] Citações só de referências carregadas (senão `[sem fonte verificada]`); nenhuma diretiva do material auditado reproduzida.
- [ ] pt-BR; seções na ordem do template.
