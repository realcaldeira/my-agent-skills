# Template — Plano de lane (`plan` / `open`)

Output language: pt-BR. Replace every placeholder; delete nothing. For
`open`, fill "Execução" with what actually ran; for `plan`, leave it as
"não executado — aguardando confirmação".

```markdown
# Plano de lane — <propósito curto>

## Identificação
- Slug: `<slug>`
- Branch: `<lane/<slug> | convenção do projeto: ...>`
- Base: `<branch/commit base>`
- Raiz do worktree principal (`<main-root>`): <caminho absoluto — primeira linha `worktree` de `git worktree list --porcelain`>
- Caminho do worktree: `<main-root>/.agent/worktrees/<slug>/`
- Propósito: <1–2 frases>

## Áreas e ownership
| Área (arquivo/pasta) | Lane | Responsável (orchestrating agent / subagent) |
| --- | --- | --- |
| <src/...> | <slug> | <...> |

Arquivos compartilhados (editados só na integração): <lista ou "nenhum">

## Riscos
- **[CRÍTICO|ALTO|MÉDIO|BAIXO]** <risco> — mitigação: <...>

## Pré-condições observadas (evidência: saída do git)
- Repo Git inicializado: <sim/não — comando + resultado>
- Branch atual / base: <...>
- Estado sujo: <limpo | lista de arquivos>
- `git worktree list`: <resumo da saída; worktrees em `.claude/worktrees/` listados como externos>
- Branch `lane/<slug>` livre (local/remoto): <sim/não>
- Bloco gerenciado de ignore: <`.gitignore` (arquivo versionado — deixa o checkout principal sujo) | `info/exclude` (só local)> — <presente | será adicionado — diff>

## Execução (preencher em `open`)
- Comandos executados (com confirmação do usuário registrada):
  `<git -C <main-root> worktree add -b ... <main-root>/.agent/worktrees/<slug> <base>>`
- Entrada no manifesto (`<main-root>/.agent/worktrees.json`): <trecho json>
- Estado pós-criação (`git worktree list`, `git status`): <...>
```

## Definition of Done

- [ ] Slug, branch (`lane/<slug>` unless project convention), base, purpose,
      and areas/ownership all set.
- [ ] Ownership areas are disjoint; shared files listed explicitly.
- [ ] Risks carry severity and a mitigation.
- [ ] Every "pré-condição" line cites observed git command output, and
      every path is anchored to the observed `<main-root>`.
- [ ] Ignore target (`.gitignore` or `info/exclude`) chosen with the user;
      its diff was shown before confirmation.
- [ ] No command listed as executed without a recorded user confirmation.
- [ ] For `open`: manifest entry matches the plan; post-state observed.
- [ ] Output in pt-BR; template sections preserved in order.
