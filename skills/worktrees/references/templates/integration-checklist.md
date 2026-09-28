# Template — Checklist de integração (`integrate`)

Output language: pt-BR. Replace every placeholder; delete nothing. The diff
vs base MUST be shown to the user before confirmation is asked; the
confirmation record is mandatory.

```markdown
# Integração da lane `<slug>`

## Pré-condições
- Branch da lane: `<lane/<slug>>` (head: `<sha>`) vs base: `<base>` (head: `<sha>`)
- Estado sujo na lane: <limpo | lista de arquivos — não integrar se sujo>
- Checkout principal intocado pelos subagentes (`git -C <main-root> status --porcelain`): <sem mudanças novas desde o snapshot anterior à delegação | lista — violação de isolamento>
- Verificação final pedida pelo usuário: <sim/não — o quê>

## Plano de verificação (proporcional ao comportamento alterado)
| Comportamento/limite | Verificação (comando/teste) | Resultado |
| --- | --- | --- |
| <...> | <...> | <pass/fail + contagem> |

Gates exigidos pelo repositório (`[repo policy]`), executados dentro da lane: <comandos + resultados>

## Diff vs base (mostrado ao usuário antes da confirmação)
```text
<resumo de git diff <base>...<lane/<slug>> --stat + trechos relevantes>
```
Arquivos alterados fora das áreas declaradas: <nenhum | lista — justificar>

## Confirmação do usuário
- Confirmação para integrar: <sim — trecho/data da mensagem>
- Estratégia aprovada: <merge | cherry-pick>

## Registro da integração
- Comando executado: `<git merge ... | git cherry-pick ...>`
- Commits resultantes: <sha + assunto>
- Conflitos: <nenhum | lista + como foram resolvidos>

## Estado pós-integração
- `git status`: <...>
- `git log --oneline -5`: <...>
- Manifesto atualizado (se aplicável): <...>
```

## Definition of Done

- [ ] Verification plan covers the changed behavior and its important
      boundaries; required repo gates ran inside the lane with results
      recorded.
- [ ] Main checkout observed clean of lane work after delegation.
- [ ] Diff vs base generated and displayed before asking for confirmation.
- [ ] No file outside the lane's declared areas without a justification.
- [ ] User confirmation recorded before the merge/cherry-pick ran.
- [ ] Integration command, resulting commit SHAs, and conflicts recorded.
- [ ] Post-integration `git status` / `git log` observed and reported.
- [ ] Output in pt-BR; template sections preserved in order.
