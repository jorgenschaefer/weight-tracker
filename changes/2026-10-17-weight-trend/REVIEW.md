## For you

1. **Once a fetch has worked, the page cannot fetch again** (review, both rounds; ticket 03's nit). The button is hidden while the visit holds a token, and nothing else starts a fetch. So a tab left open since yesterday never gets this morning's weigh-in unless you reload. Should it keep the button, or fetch by itself when the page comes back into view (and show the button once the token has expired)?
2. **„Nimmt ab“ while the weight rises, for the first 2 days with a trend when no trend has ever fallen** (ticket 07; review round 1). Keep it, or show „Noch kein Urteil“ or something else? AC-4 does not say.
3. **An outlier on the last day is drawn as the large full dot, not as a ring** (review round 1). The agreed design says so, but AC-12 asks for outliers to be marked. On 30.8. with the test data, the 101,0 kg outlier from the problem looks like an ordinary value. Which one wins?
4. **The verdict and the pace band can contradict each other** (review round 1). With the test data, 3.8. and 4.8. show „Nimmt ab“ over „Zunahme“, at the start of the real August reversal. Each follows its AC. Is that acceptable?
5. 4 more below: N counted across a gap (ticket 07), a single-day trend hidden under the last dot (ticket 06), names missing from the glossary (tickets 02–07), and the deployment and AC-22, which are not done (ticket 01).

## Also open

- **„Seit N Tagen kein Abnehmen“ counts across a gap** (ticket 07, should-fix). From the 5th measurement after a gap, N counts from the last falling day before the gap, and the days of the gap count too. The reviewer's example: a 30-day gap after a fast loss gives „Seit 34 Tagen“ on the highest level one day after the comparison said „deutlich weniger“. The other reading counts from the first day after the gap. This needs your decision.
- **A single-day trend piece can hide under the last day's dot** (ticket 06, should-fix). After a gap, a trend of one day is drawn as a 3 px dot, and the 6.5 px dot of the last measurement can cover it. The criteria do not settle how one day of trend should look, so this needs your decision.
- **Names not in `UBIQUITOUS_LANGUAGE.md`** (tickets 02, 03, 04, 05 and 07; review round 1, nit 6). The full lists are in each ticket's Left standing, for example `MeasurementCache`, `FetchPeriod`, the five pace band values, `Assessment`, `TrendVerdict`, `since`, `Figures` and `useMeasurements`. The glossary's „Urteil“/`verdict` includes the comparison after a gap, but in the code `verdict` is only the trend's result. Confirm or rename the names, then add them to the glossary.
- **Not deployed; AC-22 unchecked** (ticket 01). Do these steps in order: the DNS record, `~/Projects/infrastructure/bin/deploy-jorgenschaefer`, `bin/deploy-prod`, then `check-redirects jorgenschaefer --live`. Infrastructure commit `9e9101d` is not pushed.
- **Never checked against the real Google account** (ticket 03). Not yet run against your account: sign-in, the Health API response shape, token expiry, and revoking.

## Fixed in this review

- `8fd16a9` **Judge on the day it is when the page comes back into view.** The page read today's date only while rendering, so a tab left open showed the verdict of the day it was opened on, and never „Letzte Messung vor N Tagen“ (AC-8). It now reads the clock again on `visibilitychange`. A test in `src/app/page.test.tsx` pins this. The second round drove it at 360 and 1440 px: after 1 day the verdict stayed and the graph moved on by a day, and after 4 days the page showed „Letzte Messung vor 4 Tagen“ in neutral colours.
- `ed4e9a1` **Read outside JSON one way.** `cache.ts` and `google-health.ts` each had their own `isRecord` and their own guarded `JSON.parse`. Both now use `src/measurement/json.ts`. The behaviour stays the same.

No fix departs from a nudge or a technical decision.

## Left-standing should-fixes from the builds, settled

- **`page.test.tsx` was too long** (ticket 03). Ticket 05's split settled it; the file now has 365 lines.
- **Commit the extraction separately** (ticket 05). It is already committed together with the rest. Rewriting history to split it would gain nothing now.
- **The wide level-3 headline was never seen in a browser** (ticket 05). The first round's driving shows 30.8. at 1440 px: „Seit 28 / Tagen kein / Abnehmen“ breaks between words and fits the column.

## Findings not fixed, and why

Nits from round 1, left for acceptance:
- **Two tolerances.** `ROUNDING_ERROR = 1e-9` is defined twice, in `src/trend/outlier.ts` and `src/verdict/verdict.ts`. Each comes with its own reason and unit. Sharing it would mean picking a home that neither rule has.
- **Two ways to compare days.** `six-week-series.ts` and `gap-comparison.ts` compare `CalendarDay` as text, with a comment, while everything else uses `daysBetween`. Both are correct today.
- **Trends computed twice.** `assess` computes `trends()` and `findGaps()` twice, because `sixWeekSeries` computes them again. `noVerdictYet` then removes the series' trend line and outlier marks. The results are deterministic and the cost is negligible.
- **Pace precision in two places.** `pace()` rounds to the hundredths the page shows (`format.ts`), and nothing links the two. Changing the display precision would need the domain changed too.
- **No pre-commit hook or CI runs `npm run check`.** Adding them is a project-level choice and outside this change.

From round 2:
- **No test for one day later** (borderline should-fix). Nothing pins the case "1 day later, same verdict, graph window moved". The +4-day test pins that the day is read again. The reviewer's suggested mutation, giving the graph a stale day, is not a likely change.

## What was checked, and what not

- **`npm run check`** passes on HEAD: 23 test files, 386 tests, and `next build`.
- **Round 1** drove the whole page in headless Chrome. It used the fixture cache and a fixed clock, at 360×640 and 1440×900. It covered AC-7's dates, the levels, the gap, too old, no verdict, the first visit, a failed sign-in, and „Abmelden“. Everything matched the specimens; the findings are listed above.
- **Round 2** drove only the screen this review's fix touched. In its 360 px screenshots the graph area was empty. I drove HEAD again at 360×640, and the graph draws: an SVG 320×190 with 34 points. So the empty area came from those screenshots, not from the page.
- **Not run:** real Google, the production image, the deployment, and real phones' `visibilitychange` when switching apps or restoring a discarded tab.
