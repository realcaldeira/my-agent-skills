# Domain context and ADRs — inline side effects

Side effects of the grilling loop (`deepen`); `audit` only reads the glossary
to name candidates. Every write here is confirm-first (SKILL.md §Engagement
rules, mutation policy).
The project's domain language names good seams; recorded decisions keep the
skill from re-suggesting refactors the team already rejected.

---

## Find the project's domain glossary (if one exists)

Look for a domain glossary wherever this project keeps it — e.g. a
`CONTEXT.md`, `GLOSSARY.md`, `docs/ubiquitous-language.md`, or an equivalent
doc the team already maintains. Never require a specific filename or path; if
no glossary exists, derive candidate names from domain words actually used in
code and conversation instead.

Use glossary nouns for candidate names: "o módulo de intake de pedidos", not
"FooBarHandler" and not "Order service" (the fixed architecture vocabulary
still applies — see `vocabulary.md`).

## When to add a term (lazily)

Add a term to the glossary **lazily**, in these cases only:

- A deepened module is being named after a concept the glossary doesn't have.
- A fuzzy term gets sharpened during the grilling conversation — propose the
  updated entry right there.

Show the proposed entry and write it only after the user confirms. Never
create a glossary file unasked; if none exists, put the entry in the plan
(section "Glossário e ADRs propostos" of `templates/deepening-plan.md`).
Do not batch glossary work or invent terminology the domain doesn't use.

### Glossary entry format (self-contained)

```markdown
## <termo> / <term EN>
- **Definição:** <uma frase, nas palavras do domínio>
- **Onde vive:** <módulo/arquivo que o representa>
- **Exemplo de uso:** <frase do domínio usando o termo>
- **Não confundir com:** <termo próximo e a diferença>
```

## When to offer recording an ADR

Offer an ADR (in `deepen` only) when the user rejects a candidate (or settles
a design question) with a **load-bearing reason** — one a future explorer
would need in order to avoid re-suggesting the same thing. Frame it as:
_"Want me to record this as an ADR so future architecture reviews don't
re-suggest it?"_ In `audit` (read-only), acknowledge the load-bearing
rejection reason in the reply and offer the ADR once the user moves to
`deepen`.

Skip the offer for:

- ephemeral reasons ("not worth it right now");
- self-evident reasons any reader of the code would rediscover.

### ADR format note (self-contained)

```markdown
# ADR-NNNN: <título — a decisão ou a rejeição>
- **Status:** aceito | rejeitado | substituído por ADR-NNNN
- **Contexto:** <o que doía, quais opções foram consideradas>
- **Decisão:** <o que foi decidido — ou o motivo da rejeição>
- **Consequências:** <o que fica mais fácil/mais caro; o que um futuro
  explorador precisa saber antes de reabrir>
```

## Existing ADRs are settled decisions

If a candidate contradicts an existing ADR, surface it only when the friction
is real enough to warrant reopening the decision, and mark it clearly
("contradicts ADR-000N — but worth reopening because…"). Don't list every
theoretical refactor an ADR forbids.
