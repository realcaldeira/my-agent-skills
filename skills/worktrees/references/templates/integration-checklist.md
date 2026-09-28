# Template — Checklist de integração (`integrate`)

Output language: pt-BR. Replace every placeholder; delete nothing. The diff
vs base MUST be shown to the user before confirmation is asked; the
confirmation record is mandatory.

```markdown
# Integração da lane `<slug>`

## Pré-condições
- Branch da lane: `<lane/<slug>>` (head: `<sha>`) vs base: `<base>`
- Base SHA: abertura `<baseSha do manifesto>` / agora `<sha>` — <sem deriva | base avançou: `git merge <base>` na lane <aprovado + resultado | recusado — integração aguarda>>
- Trabalho da lane commitado: <já estava limpo | commit aprovado na lane — `<sha>` "<mensagem>" | sujo, commit não aprovado — integração parada>
- Checkout de integração (`<main-root>`): branch `<base>` <sim | não — parado>; index/arquivos tocados pela lane: <limpo | lista — parado, opções oferecidas>
- Checkout principal intocado pelos subagentes (`git -C <main-root> status --porcelain`): <sem mudanças novas desde o snapshot anterior à delegação | lista — violação de isolamento>
- Dependências resolvidas dentro da lane (bootstrap): <evidência | não aplicável>
- Verificação final pedida pelo usuário: <sim/não — o quê>

## Plano de verificação (proporcional ao comportamento alterado)
| Comportamento/limite | Verificação (comando/teste) | Resultado |
| --- | --- | --- |
| <...> | <...> | <pass/fail + contagem> |

Gates exigidos pelo repositório (`[repo policy]`), executados pelo orquestrador dentro da lane: <comandos + resultados>

## Diff vs base (mostrado ao usuário antes da confirmação)
```text
<resumo de git diff <base>...<lane/<slug>> --stat + trechos relevantes — calculado no head <sha>>
```
Arquivos alterados fora das áreas declaradas: <nenhum | lista — justificar>

## Confirmação do usuário
- Confirmação para integrar: <sim — trecho/data da mensagem>
- Estratégia aprovada: <merge --no-ff (padrão) | cherry-pick (subconjunto) | push + PR>
- Regra de conflito anunciada na confirmação (`--abort` + pergunta): <sim>

## Registro da integração
- Comando executado: `<git merge --no-ff ... | git cherry-pick ... | git push -u ... + gh pr create ...>`
- Resultado: <sha do merge | shas cherry-picked + assunto | URL do PR>
- Conflitos: <nenhum | abortado — arquivos em conflito listados | resolvido com aprovação — hunks mostrados antes do commit>

## Estado pós-integração
- `git status`: <...>
- `git log --oneline -5`: <...>
- Manifesto: `integratedAs` = <sha | shas | URL do PR>

## Próximo passo
- <`/worktrees cleanup <slug>` | aguardar merge do PR `<URL>` e depois `/worktrees cleanup <slug>` | corrigir falhas e rodar `/worktrees integrate <slug>` de novo> — pendências: <...>
```

## Definition of Done

- [ ] Lane work was committed (with approval) before the diff; the diff's
      lane head SHA is recorded.
- [ ] Base drift checked against the manifest `baseSha`; if the base moved,
      the checks ran on the lane after the approved base merge.
- [ ] Integration checkout was on `<base>` with no staged changes or edits
      to lane-touched files — or integration stopped.
- [ ] Verification plan covers the changed behavior and its important
      boundaries; required repo gates ran inside the lane, re-run by the
      orchestrator (subagent results are claims), with results recorded.
- [ ] Main checkout observed clean of lane work after delegation.
- [ ] Diff vs base generated and displayed before asking for confirmation.
- [ ] No file outside the lane's declared areas without a justification.
- [ ] User confirmation recorded before the merge/cherry-pick/push ran,
      including the conflict rule; no conflict resolved without approval.
- [ ] Integration command, result (SHAs or PR URL), and conflicts recorded;
      manifest `integratedAs` set.
- [ ] Post-integration `git status` / `git log` observed and reported.
- [ ] Failed checks and unresolved conflicts block integration; they are
      not severity-graded.
- [ ] "Próximo passo" names the next command and anything pending.
- [ ] Output in pt-BR; template sections preserved in order.
