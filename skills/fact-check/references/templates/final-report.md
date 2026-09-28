# Template: final report (`check`, after pass 2)

Output language: pt-BR, or the user's language if they wrote in another one.
Quotes stay in their original language. Fill every placeholder; keep every
section ("Nenhum." when empty). "Custos" is the only optional section.
The pass-1 report (`references/templates/pass1-report.md`) comes before this
one in a `check` run; this report does not repeat its findings.

```markdown
# Relatório final de fact-check — <título do documento>

## Resumo

- <estado geral: pronto para publicar ou não, e por quê>
- <pior achado novo do passe 2>
- <correções do passe 1 que não se sustentaram, se houver>
- <decisões pendentes do autor>

**Severidade — passe 1:** S1 <n> · S2 <n> · S3 <n> · S4 <n> · S5 <n> · S6 <n>
**Severidade — passe 2:** S1 <n> · S2 <n> · S3 <n> · S4 <n> · S5 <n> · S6 <n>

## Achados do passe 2

<ids de `claims-pass2.json`; nada foi aplicado — cada correção aguarda aprovação>

### S1 — Falsidade flagrante

#### <título curto do achado>
- **Trecho:** "<citação literal do texto corrigido>"
- **Veredicto:** `<verdict>` (<claim id do passe 2>)
- **Evidência:** [Tier <n>] <url> — "<frase exata da fonte>"
- **Correção proposta (aguarda aprovação):** <troca mínima>

### S2 — Erro material
<mesmo formato>

### S3 — Enganoso
<mesmo formato + o que o enquadramento omite>

### S4 — Sem sustentação
<mesmo formato; fonte que falta ou corte proposto>

### S5 — Lógica e consistência
<mesmo formato; sem URL quando vem da auditoria interna — cite o mapa de argumentos>

### S6 — Detalhe
<mesmo formato>

## Verificação das correções do passe 1

- [x] <claim id do passe 1> — <antes> → <depois> — **aplicada** e confirmada no texto
- [ ] <claim id do passe 1> — **desviou** / **regrediu**: <o que mudou> — reaberta como achado <id>

## Resultado da fila de confirmação

| Item | Decisão do autor | Ação tomada |
| --- | --- | --- |
| <claim id — resumo> | manter / ajustar / remover | <o que foi feito, ou "nada, por decisão do autor"> |

## Custos

<opcional — por passe e total; marque cada valor como nativo ou estimado>

## Próximos passos

1. Aplicar as correções aprovadas do passe 2, de forma mínima.
2. Reverificar os itens reabertos.
3. Publicar quando não houver S1/S2 em aberto e todo deal breaker estiver resolvido.
```

## Definition of Done

- [ ] Every pass-2 finding has an S-level, a verdict with its pass-2 claim id,
      a verbatim quote, and `[Tier N]` evidence; nothing was applied in pass 2.
- [ ] Every pass-1 fix is marked landed, drifted, or regressed; drifted and
      regressed fixes are reopened as findings.
- [ ] Every confirm-queue item has a recorded decision; no opinion was edited
      without the author's explicit go-ahead.
- [ ] Quotes are untranslated; the rest is pt-BR or mirrors the user.
- [ ] Costs, when shown, are per pass and labelled native or estimated.
- [ ] Ends with phased next steps; the document is called publish-ready only
      when no S1/S2 is open and every deal breaker is resolved.
