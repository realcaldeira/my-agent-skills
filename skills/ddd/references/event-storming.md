# Event storming — facilitation guide

Sources: `[Brandolini]`, `[DDD Crew]` (EventStorming glossary cheat sheet),
`[Distilled ch.7]`.

Event storming is a collaborative workshop for discovering a domain fast.
Domain experts and developers work on one wall (or one board), in the
language of the business.

---

## Three formats `[DDD Crew]`

| Format | Goal | Duration | Participants |
| --- | --- | --- | --- |
| **Big Picture** | discover the whole domain, pain points, boundaries | 2–4h | 8–20 mixed |
| **Process Modelling** | model one business process end to end: actors, commands, policies, read models | 2–4h | 4–8 mixed |
| **Software Design** (aka Design Level) | design the software for one context: commands, aggregates/constraints, policies, read models | 1–2h | 3–6 devs + expert |

Durations and headcounts are facilitation heuristics `[sem fonte verificada]`.
Where the workshops sit in the overall discovery order: `strategic-design.md`
(Suggested order).

## Materials

Physical: unlimited sticky notes, thick markers, a long wall, a timer.
Remote: Miro/Mural with the same color rules, one facilitator plus one
co-facilitator for chat.

Color legend `[DDD Crew]`: orange = domain event; blue = command; small
yellow = actor/person; large yellow = aggregate/constraint; lilac = policy;
green = read model; wide pink = external system; neon pink, rotated 45° =
hotspot.

**Rules:** events are past-tense sticky notes ("Order Placed"); no design
discussion during the chaotic exploration phase; everybody sticks; the expert
is always right about the domain, the developer about feasibility.

## Big Picture flow

1. **Kickoff (10 min):** the sponsor states the goal. Facilitator explains the
   colors and the "no modeling yet" rule.
2. **Chaotic exploration (15–20 min):** everyone writes domain events
   silently, then sticks them on a timeline. No ordering debate yet.
3. **Timeline enforcement (20 min):** facilitator helps order the events
   left→right, enforcing narrative ("what happens before/after?").
4. **Walk the wall (30 min):** narrate the whole story; add missing events;
   mark **hotspots** (confusion, pain, politics) in neon pink — do not solve
   them.
5. **External systems and actors (15 min):** small yellow for people/roles,
   wide pink for external systems.
6. **Bounded context candidates (20 min):** look for language changes along
   the timeline; draw dotted boundaries; name them with the experts.

## Software Design (Design Level) flow (per context)

1. Restore the events of the flow (from Big Picture).
2. Add **commands** (blue) that cause each event, and the **read model**
   (green) the actor consults.
3. Group command+event around one **aggregate/constraint** (large yellow) —
   one consistency boundary.
4. Add **policies** (lilac: "whenever X, then do Y") and external systems.
5. Write a Given-When-Then scenario for each decision; these become
   acceptance tests. Format: *Given* <prior events/state> — *When* <command>
   — *Then* <new events or rejection>.

## Domain message flow modelling `[DDD Crew]`

Between Big Picture and the canvas: draw swimlanes per candidate context and
plot commands and events crossing the lanes in temporal order. Output: the
first draft of the context map plus the integration direction. Feeds
`context-mapping.md`.

## Remote adaptations

- Shorter sessions (90 min max) over more days.
- Silent writing first — dominant voices kill discovery on video calls.
- One pre-read with the timeline question; camera-optional.
- A shared glossary doc updated live.

## Facilitator checklist

- [ ] Sponsor present and states the goal?
- [ ] Right mix: domain experts + implementers (not only architects)?
- [ ] Colors and past-tense rule explained?
- [ ] Hot spots recorded, not debated?
- [ ] Language changes noticed (context candidates)?
- [ ] Follow-up artifacts assigned (canvas, context map, ADRs)?

## Anti-patterns

- **Slide deck storming** — a presentation instead of stickies. No.
- **Modeling debate mid-exploration** — kills the timeline.
- **Only developers** — you just re-plotted your own architecture.
- **Hot-spot resolution inside the workshop** — park them, staff them later.
