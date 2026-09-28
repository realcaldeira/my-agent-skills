# Template — Registro de limpeza (`cleanup`)

Output language: pt-BR. Replace every placeholder; delete nothing. The user
approval record is mandatory — no removal is reported without it.

```markdown
# Limpeza da lane `<slug>`

## O que foi removido / arquivado
- Worktree `.agent/worktrees/<slug>/`: <removido (lane limpa — `git status --porcelain` vazio) | mantido — motivo>
- Arquivos ignorados apagados junto com o worktree (dependências, `.env` copiado): <lista | nenhum>
- Branch `<lane/<slug>>`: <deletada (git branch -d) | deletada (-D, com evidência abaixo) | mantida (arquivada) | já não existia>
- Evidência de integração da branch: <merge em `<base>` | `git cherry -v <base> <lane/<slug>>` só com `-` | PR `<URL>` mergeado | commits não integrados — branch mantida>
- Commits não integrados: <nenhum | lista — preservados na branch `<lane/<slug>>` | tag `archive/<slug>`>
- Bloco gerenciado de ignore (`.gitignore` | `info/exclude`): <mantido | ajustado — diff>

## Manifesto
- `.agent/worktrees.json` atualizado: <lane marcada `archived` (padrão) | entrada removida a pedido do usuário>
- Entrada resultante: <trecho json, com `integratedAs`>

## Aprovação do usuário
- Confirmação para remover o worktree: <sim — trecho/data>
- Confirmação para deletar a branch (se aplicável): <sim | não solicitada>
- Confirmação para `-D` (só com a evidência acima): <sim | não necessária>
- Confirmação para `git worktree prune` (só se havia entrada `prunable`): <sim | não necessária>
- Comandos executados: `<git worktree remove ...>`, `<git branch -d ...>`

## Estado final
- `git worktree list`: <...>
- `git status`: <...>
- Trabalho preservado: <merge commit sha | PR URL | branch/tag arquivada — ou "nada pendente">

## Próximo passo
- <"nada pendente" | branch `<lane/<slug>>` arquivada com commits não integrados | outras lanes `active`: <lista>>
```

## Definition of Done

- [ ] Uncommitted or unintegrated work never destroyed: the worktree was
      removed only when clean, and unintegrated commits stay on a kept
      branch or tag, listed with a reason.
- [ ] `git worktree remove` ran only with recorded user approval and a clean
      lane (observed via `git status`).
- [ ] Branch deletion recorded with its own approval; `git branch -D` only
      with explicit destructive approval backed by `git cherry` output or a
      merged PR.
- [ ] Manifest updated (`archived` by default; removed only on request) and
      the result shown.
- [ ] Final `git worktree list` / `git status` observed and reported.
- [ ] "Próximo passo" states what is pending, or "nada pendente".
- [ ] Output in pt-BR; template sections preserved in order.
