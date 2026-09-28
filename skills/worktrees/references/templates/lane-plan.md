# Template — Plano de lane (`plan` / `open`)

Output language: pt-BR. Replace every placeholder; delete nothing. For
`open`, fill "Execução" with what actually ran; for `plan`, leave it as
"não executado — aguardando confirmação".

```markdown
# Plano de lane — <propósito curto>

## Identificação
- Slug: `<slug>`
- Branch: `<lane/<slug> | convenção do projeto: ...>`
- Base: `<branch base>` @ `<sha>` (padrão: branch atual do `<main-root>`)
- Raiz do worktree principal (`<main-root>`): <caminho absoluto — primeira linha `worktree` de `git worktree list --porcelain`>
- Caminho do worktree: `<main-root>/.agent/worktrees/<slug>/`
- Propósito: <1–2 frases>

## Áreas e ownership
| Área (arquivo/pasta) | Lane | Responsável (orchestrating agent / subagent) |
| --- | --- | --- |
| <src/...> | <slug> | <...> |

Arquivos compartilhados (editados só na integração): <lista ou "nenhum">
Dono do manifesto de dependências + lockfile: <lane `<slug>` (upgrade / lane única) | orquestrador na integração | sem mudança de dependências>

## Riscos
- **[CRÍTICO|ALTO|MÉDIO|BAIXO]** <risco> — mitigação: <...>

## Pré-condições observadas (evidência: saída do git)
- Repo Git inicializado: <sim/não — comando + resultado>
- Branch atual / base: <...>
- Estado sujo: <limpo | lista de arquivos>
- `git worktree list`: <resumo da saída; worktrees em `.claude/worktrees/` listados como externos>
- Manifesto vs `git worktree list --porcelain`: <consistente | divergências — lista, nada corrigido sem confirmação>
- Branch `lane/<slug>` livre: local <sim/não>; remoto <sim/não pelas refs locais — `[estado não verificado]` sem `fetch`/`ls-remote` aprovado>
- Bloco gerenciado de ignore: <`.gitignore` (arquivo versionado — deixa o checkout principal sujo) | `info/exclude` (só local)> — <presente | será adicionado — diff>
- Ferramentas que varrem `.agent/` (vitest/jest/eslint/watchers): <nenhuma | lista — exclusão confirmada | rodar com caminhos explícitos>

## Execução (preencher em `open`)
- Comandos executados (com confirmação do usuário registrada):
  `<git -C <main-root> worktree add -b ... <main-root>/.agent/worktrees/<slug> <base>>`
- Entrada no manifesto (`<main-root>/.agent/worktrees.json`): <trecho json>
- Bootstrap da lane: <comando de instalação + resultado | não necessário>; resolução de dependências dentro da lane: <evidência>; arquivos locais copiados: <nenhum | lista aprovada — segredos nomeados>
- Estado pós-criação (`git worktree list`, `git status`): <...>

## Próximo passo
- <`plan`: `/worktrees open <slug>` após confirmação | `open`: trabalhar na lane, depois `/worktrees integrate <slug>`> — pendências: <...>
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
- [ ] Remote branch check marked `[estado não verificado]` unless a fresh
      network check was approved.
- [ ] For `open`: manifest entry (with `baseSha`) matches the plan; lane
      bootstrapped with its own dependencies (never symlinked from the main
      checkout); post-state observed.
- [ ] "Próximo passo" names the next command and anything pending.
- [ ] Output in pt-BR; template sections preserved in order.
