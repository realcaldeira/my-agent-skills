# Template: pass-1 report (`pass1`, and the first stop of `check`)

Output language: pt-BR, or the user's language if they wrote in another one.
Quotes from the document and from sources stay in their original language.
Fill every placeholder; keep every section. When a section has nothing, write
"Nenhum." instead of deleting it. The only optional section is "Custos".

Severity labels, auto-fix rules, and queue kinds come from
`references/severity-and-fixes.md`; tier tags from
`references/checker-contract.md`.

````markdown
# Relatório de fact-check — Passe 1 — <título do documento>

## Resumo

- <pior achado, em uma linha>
- <o que já foi corrigido automaticamente>
- <o que espera decisão do autor, com destaque para deal breakers>
- <opcional: 1–2 bullets com outros pontos relevantes>

**Veredictos:** false <n> · imprecise <n> · misleading <n> · unsupported <n> · correct <n> · opinion-skipped <n>
**Severidade:** S1 <n> · S2 <n> · S3 <n> · S4 <n> · S5 <n> · S6 <n>

## Achados por severidade

### S1 — Falsidade flagrante

#### <título curto do achado>
- **Trecho:** "<citação literal do documento, no idioma original>"
- **Veredicto:** `<verdict>` (<claim id>)
- **Evidência:** [Tier <n>] <url> — "<frase exata da fonte>"
- **Correção mínima:** <troca exata, preservando a voz do autor>

### S2 — Erro material
<mesmo formato>

### S3 — Enganoso
<mesmo formato + **O que o enquadramento omite:** <explicação>>

### S4 — Sem sustentação
<mesmo formato; a correção é a fonte que falta ou o corte proposto — nunca aplicado automaticamente>

### S5 — Lógica e consistência
<mesmo formato; achados da auditoria interna não têm URL: em vez da evidência,
**Mapa de argumentos:** <qual argumento/premissa é afetado>>

### S6 — Detalhe
<mesmo formato>

## Correções aplicadas automaticamente

- [x] <claim id> — <antes> → <depois> — fonte reconferida: <url>
- [ ] <claim id> — não aplicada: <motivo; o item está na fila de confirmação>

## Diff das correções

Original preservado em: `<work-dir>/original.<ext>` (use para reverter)

```diff
<diff unificado: original vs. texto atual>
```

## Fila de confirmação

### Deal breakers (fato verificado × premissa do autor)
- **<claim id>:** fato: <fato verificado + [Tier n] url> · premissa afetada: <premissa, citada> · **Pergunta:** <o que o autor quer fazer?>

### Enquadramento ou lógica (S3/S5 que mudariam o argumento)
- **<claim id>:** <problema> · proposta: <correção> · **Pergunta:** <decisão>

### Sem fonte (S4)
- **<claim id>:** proposta: <citação sugerida [Tier n] url> ou <corte do trecho "…">

### Evidência não confirmada
- **<claim id>:** correção proposta: <…> · `evidência não confirmada`: <citação não encontrada na página / link novo morto / link não sustenta a afirmação>

## Custos

<opcional — só se o fan-out informou: tokens de entrada/saída e USD, nativo ou estimado>

## Próximos passos

1. Decidir cada item da fila de confirmação.
2. <se não houver deal breaker pendente> Seguir para o passe 2 sobre o texto corrigido.
   <se houver> O passe 2 fica bloqueado até cada deal breaker ser decidido.
````

## Definition of Done

- [ ] Every finding has an S-level, a verdict with its claim id, a verbatim
      quote, `[Tier N]` evidence (URL + exact source sentence), and a minimal
      fix. S5 items from the audit name the argument-map link instead of a URL.
- [ ] The applied-fixes list holds exactly the S1/S2/S6 fixes that leave
      conclusions intact, one line each, each visible in the current text. No
      S4 item was cut automatically.
- [ ] Every applied fix passed the evidence re-check; every failure is in the
      queue as `evidência não confirmada` with its reason.
- [ ] The original was snapshotted before the first edit, its path is shown,
      and the diff covers every change.
- [ ] The queue contains every deal breaker and every `DISCUSS WITH AUTHOR`
      item; no opinion was edited or offered a replacement.
- [ ] Quotes are untranslated; the rest is pt-BR or mirrors the user.
- [ ] Verdict and severity totals are present; "Custos" appears only with
      reported numbers.
- [ ] Pass 2 is announced only if no deal breaker is pending.
