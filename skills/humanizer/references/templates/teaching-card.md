# Template — Teaching card (`explain`)

Output language: pt-BR for the commentary. Before/After examples stay in
English, verbatim from the loaded reference (the skill's examples are adapted
from the cited sources, not literal copies of them). Replace every `<…>`
placeholder; delete nothing. With no pattern named, skip the card: list the 25
pattern names grouped as in the Teach lookup in SKILL.md and ask which one.

```markdown
# Padrão <n> — <nome em inglês>

**Definição:** <o que o padrão descreve — paráfrase fiel da referência>

**Sinais (watch for):** <lista da referência; omitir se o padrão não tiver lista>

**Problema:** <por que soa como IA e o que fazer — 2–3 frases>

**Antes:**
> <primeiro exemplo Before da referência, em inglês, verbatim>

**Depois:**
> <o After correspondente, em inglês, verbatim>

**Quando NÃO agir:**
- <quando a construção é humana de propósito: citação, título, nome próprio, uso deliberado>
- Força: <forte · padrão · fraca sozinha — rótulo e regra do nível em `references/voice-and-guardrails.md`>

**Fontes:** <as tags da linha Source do padrão, e só elas>
```

## Definition of Done

- [ ] Definition is a faithful paraphrase; watch list and the first Before/After pair are verbatim from the loaded reference; nothing invented beyond pattern 25.
- [ ] "Quando NÃO agir" is concrete and reflects `references/voice-and-guardrails.md` (quotation/title/proper-name, tier rule, voice sample override, language rules when the user writes pt-BR).
- [ ] Fontes lists exactly the tags on the pattern's Source line; Wikipedia is never cited for a pattern marked "no Wikipedia counterpart".
- [ ] Examples stay in English; commentary in pt-BR.
- [ ] Pattern number matches the file that was loaded (1–5 a, 6–11 b, 12–18 c, 19–21 d, 22–25 e); a pattern asked for by name was resolved through the Teach lookup.
- [ ] Answer is direct — the pattern first, no preamble.
