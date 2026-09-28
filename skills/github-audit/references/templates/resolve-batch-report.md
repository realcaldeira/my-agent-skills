# Template — Resolve batch report (`resolve`)

Output language: pt-BR (mirror the user otherwise). Replace every
placeholder, keep the section order, add no sections. Rules per
`references/resolve-playbook.md`. No positives section or phased plan is
required for this mode; a single follow-ups line is allowed at the end of
"Deploy/release".

```markdown
# Lote de resolução — <repo> @ `<SHA final>`

- **Pré-condições:** auditoria nesta conversa: <referência ao relatório> ; aprovação explícita: <citação curta da mensagem do usuário> ; somente tickets aprovados: <sim>
- **Regra do lote:** <N tickets aprovados → fluxo simples (≤3) | post-audit obrigatório (≥4): <resultado, BASE..HEAD>>

## Tickets aprovados tratados (<N>)

| Ticket | Decisão da auditoria | Resultado |
| --- | --- | --- |
| #<N> | <Fix now \| Fix with design caution \| adjust before merge \| ajuste aprovado> | <closed \| merged \| commented> |

### #<N> — <título>
- O que a correção fez: <mudança mínima, arquivos>
- Branch/commits: <branch; SHAs; autoria preservada — commits do mantenedor separados>
- Testes focados: <suite → X passaram / Y falharam; teste novo vermelho na base e verde com a correção>
- Estado final do ticket: <closed | merged | commented> [gh query]

<repetir por ticket>

## Gates finais
- <comando → resultado no SHA `<SHA>` [local gate]>, executado em passo próprio antes do push

## CI remoto
- <run/job → conclusão no SHA exato [hosted CI run] <URL>; pending/skipped reportados como tal>

## Checagem de código limpo
- <"nenhum slop encontrado" | lista: item → correção aplicada>

## Deploy/release
- <feito porque o usuário pediu: <detalhes> | não solicitado>
- Pendências: <uma linha, opcional>

## Deixados intencionalmente sem mexer

| Ticket | Veredito da auditoria ou bloqueio | Motivo |
| --- | --- | --- |
| #<N> | <veredito/bloqueio> | <informação do relator necessária \| recusado \| duplicado \| achado bloqueante \| evidência incerta \| adiado pelo usuário \| fora do lote> |

<!-- nunca omitir; nunca resumir em um número; se vazio, escrever "Nenhum — todos os tickets aprovados da auditoria foram tratados" -->

## Definition of Done
- [ ] As três pré-condições declaradas (auditoria na conversa, aprovação explícita, somente tickets aprovados)
- [ ] Regra do lote aplicada e registrada (post-audit limpo antes do push quando ≥4)
- [ ] Por ticket: resumo da correção, contagem de testes e estado final
- [ ] Close-on-landing respeitado (fechado só com a correção integrada e CI verde; nada segurado aguardando release)
- [ ] Autoria preservada: commits do mantenedor separados, histórico do contribuidor intacto
- [ ] Gate final executado em passo separado e resultado conferido antes do push
- [ ] CI remoto conferido no SHA enviado; pending/skipped nunca contados como verde
- [ ] Lista de slop aplicada e registrada
- [ ] Ledger "Deixados intencionalmente sem mexer" completo, cada linha rastreável ao veredito da auditoria
- [ ] Stop-on-blocker respeitado (nenhum push com gate vermelho, achado reaberto ou evidência faltando)
- [ ] Saída em pt-BR; seções na ordem do template
```
