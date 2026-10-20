# Review: Langzeitansicht

## For you

Needs your decision first:

- **AC-11 does not hold at 360 × 640** (review round 1, blocker; the layout is from 01 and 02). The toggle and the row with the range and the arrows push the graph about 80 px down. On base it spanned 367–557 px; now it spans 447–637 px, and the fixed „+“ button (560–620 px) covers its lower right: today's large dot and the newest days of the line (`/tmp/langzeit-shots/G-base-360.png` against `G-branch-360.png`). With a three-line verdict („Es geht wahrscheinlich abwärts, noch nicht sicher.“) the graph ends at 668 px, below the fold, where on base it ended at about 588. At 1280 × 800 with that verdict it ends at 804. The margins alone (28 + 8 + 12 px) cannot give back 80 px, so any fix changes the agreed design: a lower graph on narrow screens, the toggle and the arrows on one row, or a smaller or moved „+“. Not fixed for that reason.
- **„Stand <Tag>“ and „Letzte Messung <Tag>“ do not name the year** (review round 1, should-fix). After ← across New Year, or with ‹ into 2024, the band says „Stand 13.8.“ while the range says „Okt – Dez 2024“, and nothing on the screen says which year the chosen day is in. The problem is reading phases over years, but AC-7 only says „Stand <Tag>“. What the band should say, and whether only outside the current year, is your call.
- **← → cannot step in a window without a measurement** (03, should-fix, round 2). Behind „Keine Messung in diesem Zeitraum“ there is no graph to take the keys or the focus. The whole history from 04 makes such a window reachable, with ‹ across a gap of 42 days or more. The criteria do not say what a focusable message would say or announce. ‹ › and the toggle still lead out of such a window.

The rest, most important first:

- **Speed with the whole history on the phone** (04): not measured. Possible slow spots are `berlinDay` (`Intl.formatToParts`) for every measurement in several passes per render, and `fetchPage` without `pageSize` on the first full fetch. A year of points also keeps the 6-week radius of 3.5 px; the specimen shrinks it per span (01).
- **AC-9 against the real Google Health** (04): only the stand-in was used. The first full fetch, a cache from before this change, and a failed fetch were checked in tests only. No reviewer drove them in a browser.
- **The focus ring of a locked arrow** (02, fixed after its last review): checked here in the code. Only the border and the glyph fade, and the outline stays in `currentColor` at full strength, so the fix answers its finding. It was not seen in a browser.
- **Names to confirm** (01–04): `SpanToggle`, `WindowBar`, „Früher“ / „Später“, `windowUpTo`, `earlierWindow`, `laterWindow`, `windowOnSwitch`, `windowHolding`, `hasEarlierWindow`, `hasLaterWindow`, `useGraphWindow`, `pastWindow`, `stepToDay` / `onStepToDay`, `measuredDays`, `TRAFFIC_LIGHT_LINE_COLOURS`, `sameLightRuns`, `fullHistory`, `HISTORY_START`, the span values `sixWeeks` / `threeMonths` / `oneYear`. Also, from this review: `yearAndMonth`, `dayOfMonth` and `calendarDayAfter` in `src/measurement/calendar-day.ts`.
- **The row sits 8 px under the toggle**, not the specimen's 12 px (02, nit). That keeps the axis labels inside 640 px with a two-line verdict. It is moot once AC-11 above is decided.

## Fixed in this review

- Round 1, should-fix: calendar-month arithmetic was done three ways, privately in `graph-window.ts` and with hand-kept counters in `WeightGraph.monthLabels`. It now lives in `src/measurement/calendar-day.ts` beside `calendarDayBefore`, with its own tests (7092192). Round 2 reviewed this fix and drove the month labels and ‹ › across year boundaries in every span, at 360 px and 1280 px. The range, the labels and the points agreed in every state.

No fix was made after the last review.

## Findings not fixed

- Round 1, nit: the locks of ‹ › are decided in `Page`, not in `useGraphWindow` beside the moves. Not moved: the hook is called before the measurements are known (before the early returns), so it cannot see the first measured day without a worse signature.
- Round 1 and 02, nit: exports past the first 60 lines of `graph-window.ts` (`windowOnSwitch`, `windowHolding`, the `has…Window` pair) and `format.ts` (`formatRange`). Each file is one concept.
- 03, nit: `TRAFFIC_LIGHT_COLOURS` and `TRAFFIC_LIGHT_LINE_COLOURS` sit past the first 60 lines of `Verdict.tsx`, where the nudge places them.
- Round 2, nit: `dayOfMonth` and `yearAndMonth` count months from January 0, like `Date.UTC`, in a module whose `CalendarDay` writes them 1 to 12. Only the doc comment says so. A next caller guessing 1-based lands a month off.
- Round 2, nit: `formatRange` (`src/app/format.ts`) still reads the years by `slice(0, 4)` rather than through `yearAndMonth`.
- Round 2 side note, outside this change: `.claude/skills/run/walk-on.js` stores measurements at `07:00+02:00`, so made-up winter days show „um 6:00 Uhr“.

## Checks

- `npm run check` is green after the fix: 35 test files, 1188 tests, build green.
- Both rounds drove the page in headless Chrome over the DevTools protocol, without the run skill's browser tool.
- Not driven: real touch input, and fetching through the stand-in (AC-9).
