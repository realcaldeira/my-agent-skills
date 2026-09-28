# Template — Registro de limpeza (`cleanup`)

Output language: pt-BR. Replace every placeholder; delete nothing. The user
approval record is mandatory — no removal is reported without it.

```markdown
# Limpeza da lane `<slug>`

## O que foi removido / arquivado
- Worktree `.agent/worktrees/<slug>/`: <removido | mantido — motivo>
- Branch `<lane/<slug>>`: <deletada (git branch -d) | mantida | já não existia>
- Commits não integrados: <nenhum | lista — arquivados em <ref/patch>>
- Bloco gerenciado de ignore (`.gitignore` | `info/exclude`): <mantido | ajustado — diff>

## Manifesto
- `.agent/worktrees.json` atualizado: <lane marcada `archived` | entrada removida>
- Entrada resultante: <trecho json>

## Aprovação do usuário
- Confirmação para remover o worktree: <sim — trecho/data>
- Confirmação para deletar a branch (se aplicável): <sim | não solicitada>
- Confirmação para `git worktree prune` (só se havia entrada `prunable`): <sim | não necessária>
- Comandos executados: `<git worktree remove ...>`, `<git branch -d ...>`

## Estado final
- `git worktree list`: <...>
- `git status`: <...>
- Trabalho preservado: <merge commit sha | tag | patch — ou "nada pendente">
```

## Definition of Done

- [ ] Uncommitted or unmerged work never destroyed: everything not merged is
      archived and listed with a reason.
- [ ] `git worktree remove` ran only with recorded user approval and a clean
      lane (observed via `git status`).
- [ ] Branch deletion recorded with its own approval; `git branch -D` only
      with explicit destructive approval.
- [ ] Manifest updated (`archived` or entry removed) and the result shown.
- [ ] Final `git worktree list` / `git status` observed and reported.
- [ ] Output in pt-BR; template sections preserved in order.
