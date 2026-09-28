# Template — Release gate report (`post-audit`)

Output language: pt-BR (mirror the user otherwise). Replace every
placeholder, keep the section order, add no sections. Range and per-merge
checks per `references/merged-batch-review.md`; changelog and semver per
`references/changelog-and-versioning.md`; severity per
`references/severity.md`.

```markdown
# Auditoria pós-merge — `<BASE_SHA>..<HEAD_SHA>`

> Gate final de qualidade e segurança antes de deploy/release. Este relatório não faz release nem deploy.

- **Range:** <release: última tag pública → HEAD | incremental: último post-audit → HEAD | lote nomeado: <base> → HEAD>
- **Cobertura:** <N merges first-parent (#PRs) + M commits diretos (SHAs curtos)>
- **Estado dos tickets:** <issue/PR → aberto/fechado [gh query]; divergências>
- **Gates no commit de merge:** <comando → resultado [local gate]>; <job → resultado [hosted CI run] <URL>>
- **Trust gate:** <clear | blocked by <achado>>

## Achados
- **[CRÍTICO|ALTO|MÉDIO|BAIXO|INCERTO]** <título>
  - Evidência: `path:line` — `<trecho curto>` <tag>
  - Impacto entre PRs: <quais mudanças interagem e como>
  - Correção exigida: <mudança mínima + teste>

## Segurança e supply chain
- Resultado do trust gate sobre o range e a árvore final: <…>
- Dependências e workflows: <mudanças, riscos, pinning>
- Composição como superfície de ataque: <combinações analisadas>
- Escopo residual: <o que não foi coberto; lacunas de ambiente ou pentest>

## Claims e regressões

| PR | Claim ou achado | Evidência na árvore final | Status |
| --- | --- | --- | --- |
| #<N> | <claim/achado da auditoria original> | <`path:line` / run URL + tag> | <verified \| regressed \| uncertain> |

## Ledger de documentação e release
- Superfícies (derivadas do diff): <superfície → completa \| desatualizada \| ausente, com local da doc>
- Changelog: seção <pendente?> ; categoria <Fixed/Added/Changed/Breaking> ; entrada órfã em seção já lançada: <verificado — resultado> ; resíduos de merge (`|||||||`, bullets duplicados): <verificado — resultado> [changelog]
- Recomendação semver: <patch | minor | major> — entrada que força: <…>; convenção 0.x aplicada: <se aplicável>

## Prós
- <o que o lote faz bem, com evidência; ou "Nenhum ponto forte sustentado por evidência encontrado">

## Prontidão de release
<ready | blocked by <achados>> — <1 frase; mesmo com resultado limpo, listar lacunas restantes de ambiente/pentest>

## Próximos passos
1. **Fase 1 — <nome>** (cabe em uma sprint): <ações> → <resultado esperado>
2. **Fase 2 — <nome>**: <ações> → <resultado esperado>
3. **Fase 3 — <nome>**: <ações> → <resultado esperado>

Ordem de release (quando o usuário pedir): deploy do commit auditado → verificação ao vivo (comportamento, saúde, sinais de rollback) → tag e push da tag. Antes de qualquer tag, a matriz completa de plataformas precisa estar verde no SHA exato do candidato.

## Definition of Done
- [ ] Range imutável registrado (BASE_SHA, HEAD_SHA); cada merge first-parent e cada commit direto coberto
- [ ] Estado dos tickets obtido por consulta, não por texto de commit
- [ ] Uma linha de reconciliação por claim/achado material
- [ ] Inspeção pré-execução sobre o range e a árvore final, com composição tratada como superfície de ataque
- [ ] As sete classes de interação, a lista de falhas comuns e as armadilhas de plataforma revisadas
- [ ] Os dois riscos de changelog verificados; semver dado com a entrada que o força
- [ ] Gates executados no commit de merge (nunca substituídos pelo head do PR); pending/skipped nunca contados como verde
- [ ] Linha de prontidão presente
- [ ] Fase 1 cabe em uma sprint
- [ ] Saída em pt-BR; seções na ordem do template
```
