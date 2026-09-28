# Two-pass method

The run from start to finish: set-up, claim extraction, pass-1 verification,
logic audit, report and fixes, pass 2, final report. Severity levels, the
auto-fix gate, and the evidence re-check belong to
`references/severity-and-fixes.md`; tiers, verdicts, and the checker's JSON
belong to `references/checker-contract.md`.

## Contents

- [Why two passes](#why-two-passes)
- [Phase 0: set-up](#phase-0-set-up)
- [Phase 1: claims and argument map](#phase-1-claims-and-argument-map)
- [Phase 2: pass-1 verification](#phase-2-pass-1-verification)
- [Phase 3: hostile logic audit](#phase-3-hostile-logic-audit)
- [Phase 4: pass-1 report](#phase-4-pass-1-report)
- [Phase 5: applying fixes](#phase-5-applying-fixes)
- [Phase 6: pass 2](#phase-6-pass-2)
- [Phase 7: final report](#phase-7-final-report)
- [No network, no web tools](#no-network-no-web-tools)

## Why two passes

- **Division of labour.** Pass 1 sends cheaper checkers to find what is broken.
  Once fixes land, pass 2 sends the strongest checkers, with fresh context, to
  audit the corrected text: what pass 1 missed and what the fixes damaged.
- **Order matters.** Running both passes on the original text would spend the
  expensive pass re-finding errors pass 1 already fixed. The passes therefore
  never run in parallel.
- **Re-extraction is mandatory.** Fixes change sentences. A pass-2 checker
  handed pass-1 quotes would verify text that no longer exists and report
  phantom errors. Pass 2 always extracts its own claims from the fixed text.
- **Why pass 1 still re-checks evidence.** A cheap checker can invent a
  plausible quote or URL. Nothing is applied on its word alone.

## Phase 0: set-up

1. **Work dir.** Create a fresh temporary folder outside any git repository,
   named `<slug>-<YYYYMMDD-HHMM>` (slug from the document title). It holds the
   original snapshot, `claims.json`, the argument map, verdicts, and reports.
   Never put it in the user's repo.
2. **Snapshot.**
   - Path input: read the file and copy it byte for byte to
     `<work-dir>/original.<ext>` before any edit. The diff and any rollback
     start from this copy.
   - Pasted text: save it twice in the work dir, as `original.md` and as the
     working copy `document.md`. Check and edit the working copy.
3. **Language.** Detect it from the text. Ask only when it is genuinely mixed.
4. **Bilingual pair** (a canonical file plus a translation): extract claims
   from the canonical file only, then spot-check the translation. A claim whose
   meaning changed in translation is a finding against the translation.
5. **Checker strength.** Pass 1 uses a cheaper model tier, pass 2 the strongest
   available (or the orchestrator's own). With the script fan-out, the roster's
   `default_harness` and `second_pass_harness` supply the defaults.
6. **Question round.** Network access (and edit consent, when the mode was
   inferred) is asked once, per the router's engagement rules. Nothing below
   touches the network before the answer.

## Phase 1: claims and argument map

Done by the orchestrator alone, in one read of the whole document; extraction
needs the full context, so it is never fanned out.

**What counts as a claim:** anything a reader could check against the world.

- numbers, dates, names, quotes, "X said/did Y";
- historical sequences, technical specs, benchmark results;
- sweeping generalizations stated as fact ("nobody uses X anymore", "it has
  always been Y").

**What does not:** pure opinion, jokes, and impressions the author labels as
personal. From a sentence that mixes opinion and fact, take only the fact.

**`claims.json`** is a JSON array; each element:

| Field | Required | Content |
| --- | --- | --- |
| `id` | yes | `C01`, `C02`, … (pass 2 restarts the numbering in its own file) |
| `quote` | yes | the exact sentence or fragment from the document, untranslated |
| `category` | yes | `statistic`, `date`, `quote`, `attribution`, `history`, `technical`, `comparison`, `prediction`, `community` |
| `hint` | yes | where the truth probably lives: search terms, the expected primary source. A lead for the checker, never evidence |
| `load_bearing` | recommended | `true` when the argument collapses without this claim (mirrors the argument map) |

Sort the array by topic so each batch shares context. A 3,000-word essay
usually yields 15 to 40 claims; beyond that, merge trivia, but keep every claim
a critic could turn into a weapon.

**Argument map** (`argument-map.md` in the work dir):

- the main opinions and conclusions, one line each;
- under each, the claim ids it rests on, marking the load-bearing ones;
- the implicit assumptions the author makes without stating them.

## Phase 2: pass-1 verification

1. Split the topic-sorted claims into batches of about six.
2. Render the prompt section of `references/checker-contract.md` for each batch
   (title, language, claim count, claims JSON).
3. Dispatch one fresh checker per batch, following the router's fan-out rules.
   Even a single batch gets its own checker. With the optional script fan-out,
   run a dry run first to check the batching, then the real run (details in
   `references/script-fanout.md`); re-run a failed batch with a stronger model.
4. Consolidate: one verdict per claim id. A missing id means that claim is
   unverified: re-run it or check it yourself. Ignore ids you never sent.
5. Treat `unsupported` as information, not laziness: the claim needs a source
   or an author decision. Cheap checkers sometimes miss a source that exists,
   which is why unsupported claims are never cut automatically.

## Phase 3: hostile logic audit

Done by the orchestrator alone, from the argument map, with no web access.
Read as the worst-faith critic would:

- **Contradictions:** the text asserts X early and not-X later.
- **Cherry-picking:** the evidence covers only a slice of what the conclusion
  claims.
- **Over-assumed knowledge:** the argument leans on something the reader is
  expected to know. Check the assumption is at least true; if that cannot be
  known, flag it as an assumption.
- **Causal leaps:** a possible consequence presented as inevitable.
- **Missing caveats:** a true statement whose meaning flips without a
  qualifier.

Then cross-check verdicts against the map: every load-bearing claim whose
verdict is `false`, `imprecise`, `misleading`, or `unsupported` goes to the
confirm queue as a deal breaker.

## Phase 4: pass-1 report

1. Assign each finding its final level and fix path per
   `references/severity-and-fixes.md`.
2. Run the evidence re-check on every fix you intend to apply; failures move to
   the queue as `evidência não confirmada`.
3. Apply the fixes that passed (Phase 5 rules), or list them as proposals if
   the user declined edits.
4. Fill `references/templates/pass1-report.md`: findings worst-first, then the
   applied-fixes checklist, the unified diff against the snapshot, the confirm
   queue, and totals (plus cost when the fan-out reported it).
5. Next step: in `check`, with no deal breaker pending, continue straight to
   pass 2. With deal breakers pending, stop and wait for the author; pass 2 is
   blocked until each is decided. In `pass1`, stop here.

## Phase 5: applying fixes

- Apply exactly the approved set: auto-eligible items that passed the re-check,
  plus items the author confirmed from the queue.
- Smallest possible edit: the right number, name, or date, or one caveat
  phrase. Keep the author's rhythm, slang, and sarcasm. Never rewrite a
  paragraph.
- If a fix starts pulling on an opinion, it was a deal breaker all along: stop,
  undo that one edit, and ask.
- Strengthening a weak argument happens only when the author asks: add the
  evidence the checkers found and keep the stance exactly as it was.
- Keep `applied-fixes.md` in the work dir: one line per fix (claim id, before →
  after, source URL). Pass 2 walks this list.

## Phase 6: pass 2

1. Repeat Phase 1 on the fixed text into `claims-pass2.json`. Never reuse the
   pass-1 file.
2. Update the argument map if the fixes moved anything.
3. Fan out again with the stronger checker tier, the same contract, and fresh
   checkers.
4. Consolidate with extra attention to what pass 1 missed and to sentences the
   fixes touched.
5. Pass 2 applies nothing. Every proposed fix waits for the author.

## Phase 7: final report

Fill `references/templates/final-report.md`:

- pass-2 findings by severity, in the pass-1 evidence format, ids from
  `claims-pass2.json`;
- a fix-by-fix walk of `applied-fixes.md` against the current text: each fix is
  *landed*, *drifted* (the sentence changed again), or *regressed* (the error
  is back or a new one appeared). Drifted and regressed fixes are reopened as
  findings;
- the outcome of every confirm-queue item;
- totals per pass, and costs when known.

## No network, no web tools

- **Checkers lack web tools** (the harness cannot give them): verify the
  batches one by one in the main context and say so in the report.
- **The user refuses network access:** no claim can be verified. Offer
  extraction, the argument map, and the logic audit only; report every factual
  claim as unverified (`unsupported`, reason: no network) and apply no fixes
  that depend on evidence. S6 wording fixes may still be proposed.
