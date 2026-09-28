# Template — Strategic plan (`design`)

Output language: pt-BR.

```markdown
# Plano de Strategic Design — <domínio>

## Visão de Domínio (Domain Vision Statement)
<1 parágrafo: para qual cliente, o que o sistema faz, o que o diferencia>

## Perguntas em aberto
- <2–4 perguntas que travam decisões; quem responde>
- Premissas: <o que foi assumido sem confirmação do usuário, ou "nenhuma">

## Subdomínios identificados
| Subdomínio | Tipo | Justificativa | Esforço sugerido |
| --- | --- | --- | --- |
| ... | Core / Supporting / Generic | ... | alto/médio/baixo |

## Bounded Contexts propostos
### <Nome do contexto>
- **Propósito:** <1 frase>
- **Linguagem ubíqua (amostra):** <termos-chave EN/PT>
- **Responsabilidades:** <bullets>
- **Não responde por:** <bullets — fronteiras explícitas>
- **Owner sugerido:** <time/pessoa>

## Context Map
<mermaid ou ASCII: contextos + setas rotuladas com o padrão (ACL, Customer-Supplier, OHS+Published Language, ...) e direção upstream→downstream>

## Estilo arquitetural recomendado
<modular monolith | hexagonal por módulo | microservices | híbrido>
- Justificativa: <evidência — time, escala, deploy, compliance>
- Alternativa considerada e por que não: <...>

## Workshop de validação — Event Storming
- Formato: <Big Picture | Process Modelling | Software Design>
- Duração e data sugerida: <...>
- Participantes: <papéis>
- Materiais: <stickies pela legenda de cores padrão / board remoto>
- Critério de sucesso: <o que precisa sair do workshop>

## Passo seguinte (uma sprint)
1. <ação concreta>
```

## Definition of Done

- [ ] Vision statement is one paragraph and names a differentiator.
- [ ] Every subdomain classified with a reason (not "feeling").
- [ ] Every proposed context has purpose + sample language + "não responde por".
- [ ] Every context-map arrow is labeled with a pattern and direction.
- [ ] Architecture style justified against the modular-monolith default.
- [ ] Open questions listed with owners.
- [ ] First step fits one sprint. Output in pt-BR.
