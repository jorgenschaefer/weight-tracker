## For you

- **Decision (review, round 1):** after a gap of more than about 14 days the first day after it has no trend, so the first 7-day pace comes about 11 days later; for 4 days the page still says „Ein Urteil gibt es wieder eine Woche nach der Lücke.“ AC-10 prescribes that sentence; rewording it is yours.
- **Decision (03-fruehwarnung):** N in „Der Trend … seit N Tagen.“ and the Warnstufe count to the last day with a measurement, not to today (20.10. after a last weighing on 17.10. says „seit einem Tag“). AC-4 does not settle which; counting to today is one argument in `trendVerdict`.
- **Departure from the agreed design (03-fruehwarnung, fixed in this review):** to fit a declined sign-in with a two-line sentence and a card on 360 × 640, screens under 720 px tall now use 12 px gaps (kicker, card, „Langfristig“) and a card padding of 10 px, narrower than the specimen's 28/16/14 px. 390 × 844 keeps the specimen's.
- **Decision (review, round 2):** nothing pins AC-12's fit; jsdom lays nothing out, and the tallest state has 3 px of room (figures end at 637 of 640 px). Guarding it needs a browser test, so a dependency the technical decisions rule out.
- **At acceptance (CRITERIA nudges):** check whether `changes/backlog/nimmt-zu-nach-luecke.md` still occurs and delete it if not; delete `changes/backlog/fruehwarnung-mit-einer-stimme.md`. 2 more below.

## Also open

- **01-streuung-und-ausreisser:** after a gap of about 19 days or more, the Streuung of the first day after it has fewer than 10 distances, so the comparison after the gap always uses 0.7 kg, whatever the person's own scatter was before.
- **03-fruehwarnung:** not driven: a production build (`next start`), real Google, and the revoke-failure line together with the Frühwarnung.

## Fixed in this review

- Four copies of "open the page on a day of the test data" and two of AC-11's 18.10./19.10. (one per build) are now `openHistoryOn` in `src/test/open-page.tsx` and `weightHistoryUntil` in `src/test/weight-history-fixture.ts` (critique round 1, should-fix).
- `ScatterCheck` said `"sevenDayPace"` / `"twentyEightDayPace"` where glossary and code say `weekPace` / `pace`; renamed (critique round 1, nit).
- The overflow 03-fruehwarnung left standing (should-fix): measured at 657 px, now 637 px; see `## For you`. Not test-first: jsdom measures no layout. Measured in headless Chromium, and critique's second round drove 12.10., 13.10. and 16.10. at 360 × 640, 12.10. at 390 × 844 and at 1280 × 680.
- `changes/backlog/hauptseite-abwaegen.md` described the page before this change, and `changes/backlog/code-wie-beschreibung.md` now says its plan and appendix do (02-langfristig, should-fix). The appendix itself is not rewritten; that is the work of that item.
- The comment in `page.module.css` names every short-screen query; `OCTOBER_18_AND_19` is no longer exported (critique round 2, nits).

## Settled without a change

- 02-langfristig's should-fix on the level-3 headline overflowing 360 × 640: ticket 03 replaced that headline, and critique measured every state AC-12 names to fit (at most 586.8 px with „Daten abrufen“).
- 01-streuung-und-ausreisser's nit that `threshold` carried factors only tests used: tickets 02 and 03 now use them.

## Findings not fixed

- The small-caps label style (13 px / 600 / 0.06em / uppercase) is written three times, in `.kicker`, `LongTerm` `.heading` and the card's `.distance` (critique round 1, nit). Left: one shared rule would need a shared stylesheet the project has no place for yet.
- `MorningDeviation.tsx` is a small file split off its only caller `Verdict.tsx` (critique round 1, nit). Left: it matches the project's one-component-one-test-file layout.

## Checks

`npm run check` passes on the last commit (32 test files, 631 tests, build). Not run: the page against real Google, `next start`.
