## For you

1. **Departure from a nudge (review):** 18.10.–20.10. no longer sit in `src/test/weight-history-fixture.ts`, as the nudge has it. They are in `src/test/fixtures/gewicht-2026-10-18-bis-20.csv`, which that file, `analysis/kalman/reference.py` and the `run` skill's snippet all read. Before, the skill had no copy of the three days, so walking the page on 18.–20.10. showed the verdict of 17.10.
2. **Names to confirm (01, 03, 04, 05):** the `MorningSentence` kinds, `Trend`'s `kgVariance`/`paceVariance`/`z`, `isLossLikelier`, `certaintyLine`, `formatPaceDeviation`, the CSS classes `line`/`sentence`/`statement`/`sd`, and „Fläche“ as `bandCorners`/`kgSd`. None of them is in the glossary.
3. **The graph keeps the current look over the specimen (05):** a 3 px line, a 0.3 kg margin, the old `aria-label`, and the band under the points. A lone day between two gaps gets a 3 px bar as its band.
4. **Wide-screen sizes chosen without a design (03, 04):** the Satz is 44px, the line 14px, the values 30px and „± Y“ 18px. At 1440×900 the page scrolls slightly when the Satz takes 4 lines (17.10., 4.10.). Only the bottom padding goes below the fold, and no criterion covers it (review).
5. Five more below, all nits.

## Fixed in this review

- **Should-fix (round 1):** the `run` skill stored only the CSV up to 17.10., so the AC-7 rows for 18.–20.10., the problem day among them, could not be walked as described. All three readers of the test data now take the three extra days from one file. A new test in `src/test/weight-history-fixture.test.ts` pins `weightHistoryUntil` to 100 days ending 98,4 / 97,0 / 96,9. `reference.py` still regenerates `kalman-reference.json` byte for byte, and the snippet now stores 100 days.
  - The snippet itself has no test, because nothing in the suite runs `.claude/skills/`. I checked its output by hand: 97 days before the fix, 100 after.
- **Should-fix (round 2):** a browser profile that ran the snippet earlier keeps the old 97 days. `SKILL.md` now says to run the snippet again after either CSV changes.
- The doc comments in `src/verdict/assessment.test.ts` said „18.10. and 19.10.“ and now say 18.10. to 20.10.

## Left standing from the builds

- **02's should-fix** („Ein Urteil gibt es nach knapp drei Wochen …“ after a gap) is settled: ticket 03 removed the text, and `noVerdictYet` now comes only when there is no counting measurement at all.
- 03's nit about `fixture-snippet.mjs` is fixed above.
- The decisions each build recorded as costly to reverse are listed in its ticket. They are the shape of `Trend`, `lossCertainty` as P(pace < −0.1), `MorningSentence` as a union of kinds, `Assessment` carrying `trend`, `kcalPerDay` rounding to the nearest ten, and `isOutlier` as |z| > 2. The review found nothing wrong with any of them.

## Nits not fixed

1. **The filter runs twice (review).** `assess` calls `trends(counting)`, and `sixWeekSeries` calls it again on the same input. Both get the same `counting`, so today the results agree. They would drift apart only if one of them were handed other measurements. Passing the trends into `sixWeekSeries` would leave one run.
2. **`morningSentence` is about 45 lines (01, review).** That is over the 30-line smell. The body reads as AC-4's ordered list, and splitting it would break that list in two.
3. **`src/trend/pace.ts` holds only `kcalPerDay` and `KCAL_PER_KG` (review).** The Tempo itself lives in `trend.ts`, so the file name points the wrong way.
4. **The first paragraph of `README.md` has one overlong line (review).** It is cosmetic.
5. **`Figures` picks the sign rule itself (04).** In `src/app/Verdict.tsx` it chooses „Defizit“/„Überschuss“ by `pace < 0`. That is page wording, and a test pins it.

## Checks

- `npm run check` ran whole after the fixture fix (abf7b40) and exits 0 (805 tests).
- The commit after it (e5a794a) changes only `.claude/skills/run/SKILL.md`, which no check reads.
- Round 1 drove every state of the page at 360×640 and 1440×900 in headless Chrome. Everything matched AC-6 to AC-8, and AC-11 held on the phone. On 20.10. the page shows green, „90 % sicher, dass du abnimmst“, „Du nimmst seit 2 Tagen ab.“
- Round 2 drove no screen, because the fixes changed none.
