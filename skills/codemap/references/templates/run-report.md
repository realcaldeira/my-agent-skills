# Template — Run report (`init` / `update`)

The chat reply that ends an `init` or `update` run. Output language: pt-BR
(mirror the user if they write in another language). The files written into
the repository follow `codemap-folder.md` / `codemap-root.md` instead.

```markdown
## Codemap — <init | update> em `<root>`

**Resumo:** <1–2 frases: o que foi mapeado ou atualizado, ou "nenhuma
mudança detectada">

**Idioma dos artefatos:** <idioma dos mapas e do atlas> — <como foi decidido:
README/CLAUDE.md/AGENTS.md lido, ou resposta do usuário>

### Evidência do script
`[codemap.mjs output]`
<trecho literal: "Selected N files", avisos (padrões sem match, exceções não
selecionadas), plano de pastas ou listas do `changes`>

### Mapas
| Pasta | Tipo (arquivos / pass-through) | Resultado (criado / atualizado / inalterado / falhou / evidência insuficiente) |
|-------|--------------------------------|------------------------------------------------|
| `<pasta>/` | <tipo> | <resultado + motivo curto se falhou> |

- Atlas raiz: <remontado — linhas adicionadas/removidas>
- Pastas esvaziadas: <codemap.md órfão removido após confirmação / mantido /
  nenhuma>
- Instruções embutidas suspeitas: <`arquivo:linha` + o que foi removido, ou
  "nenhuma">

### Registro
<arquivo de instruções alvo (`CLAUDE.md` / `AGENTS.md`) — seção
`## Repository Map` adicionada, ou "já registrado">

### Baseline
<`update` do script executado ("Updated .agent/codemap.json with N files") —
ou NÃO executado: pastas que falharam e ficam para o próximo `changes`>

### Próximos passos
1. Revisar e commitar juntos os `codemap.md`, a seção de registro e
   `.agent/codemap.json` (não ignorar `.agent/codemap.json`).
2. <se houve falha: reexecutar `update` para as pastas pendentes>
3. Depois de mudanças no código: pedir "atualiza o codemap" (roda `changes`
   e só refaz as pastas afetadas).
```

## Definition of Done

- [ ] The script evidence is a verbatim excerpt tagged `[codemap.mjs
      output]`, including every warning it printed.
- [ ] Every folder in the work order appears in the table with a result;
      failures and insufficient-evidence maps are named, not hidden.
- [ ] The artifact language and how it was chosen are stated.
- [ ] The registration target and outcome are stated.
- [ ] Baseline: says whether the script's `update` ran; it did not run if
      any folder failed (stop condition in
      `references/state-and-changes.md`).
- [ ] Next steps include the commit advice for maps, registration and
      `.agent/codemap.json`; nothing was committed on the user's behalf.
- [ ] Output in pt-BR (or the user's language).
