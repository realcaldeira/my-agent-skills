# Template: verification note (`verify`)

One candidate, one outcome. Follow `verification.md` (single-agent fallback:
this mode never fans out). Render in pt-BR; keep the sections and their
order; keep only the outcome block that applies; delete these instruction
lines.

```markdown
# Verificação adversarial — <afirmação em uma linha>

- **Afirmação candidata:** <ator, entrada, sink, efeito alegado>
- **Origem:** <scanner | leitura manual | modo anterior (audit/review/surface)> @ <commit>
- **Evidência recebida:** `arquivo:linha` — `<trecho>`
- **Limite relevante:** <nome> `[boundaries §N]`

## Re-derivação independente

- **Caminho reconstruído:** <um passo por linha, cada um com `arquivo:linha`>
- **Controles verificados no caminho:** <validação upstream, permissões, tipagem, limites, defaults do framework — com `arquivo:linha`>
- **Pré-requisitos reais do atacante:** <…>
- **Caminhos e chamadores alternativos rechecados:** <…>

## Desfecho

### CONFIRMADO
- **Severidade:** <CRÍTICO|ALTO|MÉDIO|BAIXO|INFORMATIVO> · **Confiança:** <proven|probable|possible>
- **Impacto / raio de alcance:** <…>
- **Remediação mínima (limite dono):** <…>
- **Teste de regressão sugerido:** <… + caso de controle legítimo>

### NECESSITA VALIDAÇÃO
- **Fato ausente:** <…>
- **Por que não foi possível estabelecer:** <…>
- **O que resolve / plano seguro:** <…>

### CANDIDATO REJEITADO
- <refutação em uma linha, nomeando o controle que bloqueia> — `arquivo:linha`

## Risco residual desta verificação

<O que esta verificação não cobre: outros chamadores, outros ambientes, fatos assumidos.>
```

## Definition of Done (check before answering)

- [ ] Exatamente um desfecho, sem hedge ("provavelmente confirmado" não existe).
- [ ] A re-derivação traz evidência própria (`arquivo:linha`), não repete o raciocínio recebido.
- [ ] Controles upstream e chamadores alternativos verificados antes de confirmar.
- [ ] CONFIRMADO: severidade conforme a escala, confiança, impacto, remediação e teste com controle legítimo.
- [ ] NECESSITA VALIDAÇÃO: sem severidade; fato ausente, motivo e o que resolve.
- [ ] CANDIDATO REJEITADO: afirmação mantida + refutação com `arquivo:linha`.
- [ ] Nenhuma execução de código do alvo sem confirmação e isolamento; se pulada, "não executado — motivo".
- [ ] pt-BR; seções na ordem do template.
