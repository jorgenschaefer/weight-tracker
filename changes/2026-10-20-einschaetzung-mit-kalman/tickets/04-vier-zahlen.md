---
criteria:  CRITERIA.md
closes:    AC-5, AC-7, AC-8, AC-10, AC-11
advances:
after:     03-ampel-und-satz-auf-der-seite
status:    done
attempts:  1
---

## Build
Under the sentence, the page shows the four numbers from the filter: estimated weight, Gemessen, Tempo, and Defizit or Überschuss. They take the place of the figures and „Langfristig · 4 Wochen“, on the phone and in the right-hand column of the wide screen.

## Done when
> **AC-5** Unter dem Satz stehen vier Zahlen: „Gewicht, geschätzt“ X,X ± Y,Y kg, beide auf eine Stelle gerundet; „Gemessen“ X,X kg; „Tempo“ ±X,XX ± Y,YY kg/Wo, auf zwei Stellen gerundet; „Defizit“ bei einem Tempo unter 0, sonst „Überschuss“, K ± S kcal/Tag, K der Betrag des Tempos in kg pro Woche mal 1100, S seine Unsicherheit mal 1100, beide auf Zehner gerundet.

> **AC-7** Mit den Testdaten aus AC-1:
>
> | Tag | Ampel | Zeile über dem Satz | Satz |
> |---|---|---|---|
> | 13.7. | Rot | 92 % sicher, dass du nicht abnimmst | Achtung, du nimmst wieder zu. |
> | 14.7. | Rot | 90 % sicher, dass du nicht abnimmst | Du nimmst seit 2 Tagen zu. |
> | 1.10. | Rot | 95 % sicher, dass du nicht abnimmst | Du nimmst seit Wochen zu. |
> | 3.10. | Rot | 86 % sicher, dass du nicht abnimmst | Leichter Morgen, aber ein Tag ändert den Trend noch nicht. |
> | 4.10. | Gelb | 73 % sicher, dass du nicht abnimmst | Die Zunahme ist gestoppt. Ob du abnimmst, ist noch offen. |
> | 5.10. | Gelb | 54 % sicher, dass du nicht abnimmst | Ob du abnimmst, ist noch offen. |
> | 6.10. | Gelb | 64 % sicher, dass du abnimmst | Es geht wahrscheinlich abwärts, noch nicht sicher. |
> | 8.10. | Grün | 88 % sicher, dass du abnimmst | Du nimmst wieder ab. |
> | 9.10. | Grün | 91 % sicher, dass du abnimmst | Du nimmst seit 2 Tagen ab. |
> | 12.10. | Grün | 91 % sicher, dass du abnimmst | Ausreißer, der Trend bleibt. |
> | 13.10. | Grün | 89 % sicher, dass du abnimmst | Du nimmst seit 6 Tagen ab. |
> | 17.10. | Grün | 81 % sicher, dass du abnimmst | Zwei schwerere Morgen: Du nimmst noch ab, aber langsamer. |
> | 18.10. | Gelb | 74 % sicher, dass du abnimmst | Achtung, die Abnahme wird langsamer. |
> | 19.10. | Grün | 84 % sicher, dass du abnimmst | Du nimmst wieder ab. |
> | 20.10. | Grün | 90 % sicher, dass du abnimmst | Du nimmst seit 2 Tagen ab. |
>
> Am 19.10. stehen dazu „Gewicht, geschätzt“ 97,7 ± 0,3 kg, „Gemessen“ 97,0 kg, „Tempo“ −0,39 ± 0,29 kg/Wo und „Defizit“ 430 ± 320 kcal/Tag; am 20.10., dem Tag des Problems, 97,4 ± 0,3 kg, 96,9 kg, −0,47 ± 0,29 kg/Wo und „Defizit“ 510 ± 320 kcal/Tag.

> **AC-8** An einem Tag ohne Messung, bis 3 Tage nach der letzten, zeigt die Seite Zeile, Satz, Farbe und die vier Zahlen des letzten Tags mit Messung unverändert; N in AC-4 zählt bis zu jenem Tag. Liegt die letzte Messung mehr als 3 Tage zurück, steht wie bisher „Letzte Messung vor N Tagen“, ohne die Zeile über dem Satz und ohne Satz, auf neutraler Fläche, mit den vier Zahlen des letzten Tags mit Messung. Ohne jede zählende Messung steht „Noch kein Urteil“ ohne Satz. Ab der ersten zählenden Messung gibt es Ampel, Zeile und Satz.

> **AC-10** Es gibt nicht mehr: „Frühwarnung · letzte Tage“, die Überschriften „Nimmt ab“, „Stagniert“ und „Nimmt zu“, „Der Trend fällt/stagniert/steigt seit N Tagen.“, den Vergleich nach einer Lücke, die Karte des Morgens, „Langfristig · 4 Wochen“ und die Farben der Warnstufen.

> **AC-11** Auf 360 × 640 px passt in jedem Zustand alles bis zu den vier Zahlen ohne Scrollen, auch mit „Daten abrufen“, einer zweizeiligen Fehlerzeile und dem längsten Satz aus AC-4. Ab 65em Breite stehen Zeile und Satz links, die vier Zahlen rechts in der Spalte, in der bisher „Langfristig“ und die Zahlen stehen, der Graph darunter.

## Technical decisions
> **Stored formats** Keine. Der Cache `gewicht:v1` bleibt unverändert; alles wird aus den Messungen berechnet.

> **Wire formats** Keine.

> **Trust boundaries** Keine.

> **Dependencies** Keine. Der Filter ist von Hand geschrieben, wie in `kalman.py`.

## Nudges
> Weg fallen samt Tests und CSS: `src/trend/week-pace.ts`, `src/trend/scatter.ts`, `src/trend/outlier.ts`, `src/verdict/gap-comparison.ts`, die Regeln in `src/verdict/verdict.ts`, `src/app/LongTerm.tsx` und `src/app/MorningDeviation.tsx`. Der Faktor 7700 / 7 bleibt eine benannte Konstante.

> In `UBIQUITOUS_LANGUAGE.md` kommen dazu: Ampel `trafficLight` (`green`, `yellow`, `red`), Sicherheit `lossCertainty`, Satz zum Morgen `morningSentence`. Trend `trend` (auf der Seite „Gewicht, geschätzt“, in den Sätzen „Trend“) bleibt der Name, jetzt für das, was der Filter für einen Tag schätzt; `Trend` und `trends` in `src/trend/trend.ts` behalten ihre Namen. Tempo und Ausreißer (z > 2) werden neu gefasst, Urteil `verdict` als Ampel, Sicherheit und Satz zum Morgen eines Tags, „Noch kein Urteil“ ohne zählende Messung; `src/verdict/` behält seinen Namen. 7- und 14-Tage-Tempo, Warnstufe, Tempo-Stufe, Streuung, Vergleich nach einer Lücke und Abweichung am Morgen fallen weg. Lücke bleibt, für den Graphen.

## Context
From 01, `trends` in `src/trend/trend.ts` gives the estimated weight, the pace and both variances of each day with a counting measurement. From 03, the page shows the Ampel, the line and the sentence, and holds them for up to 3 days without a measurement. „Letzte Messung vor N Tagen“ stands after that.

What exists: `Figures` in `src/app/Verdict.tsx` shows Trend (Theil-Sen) and Gemessen. `LongTerm` (`src/app/LongTerm.tsx`) shows „Langfristig · 4 Wochen“ from `pace()` in `src/trend/pace.ts`, the 28-day pace on Theil-Sen in its band, together with `kcalPerDay`. That function rounds down to tens on `KCAL_PER_KG` 7700 / 7, while AC-5 rounds to the nearest ten. `formatKg` and `formatPace` in `src/app/format.ts` write German numbers, `formatPace` signed. In `page.tsx` and `page.module.css`, `.overview` holds „Langfristig“ and the figures, under the verdict on the phone and in the 420px right-hand column of `.summary` from 65em.

The design (`changes/2026-10-20-einschaetzung-mit-kalman/specimens/muster.html`, view A, `figs`): two columns of two, the label small above the value, „± Y“ smaller and fainter beside the value, the unit after it.

This ticket also deletes `verdict.ts`, `gap-comparison.ts` and `week-pace.ts`, along with their tests, where 03 left any of them. With `pace()` and the band gone, the threshold of the 28-day pace in `src/trend/scatter.ts` goes too. After this ticket only the graph still uses Theil-Sen, `scatter.ts` and `outlier.ts`, and 05 removes them.

AC-10 and AC-11 close here, so their page tests and the 360 × 640 check in a browser (the repository's `run` skill) cover the whole of them, including 02's and 03's parts.

The glossary: Tempo is redefined as the filter's pace, with its uncertainty and with Defizit and Überschuss, and Tempo-Stufe goes.

## Not here
- The graph: 05.
- Out of scope: Eine Prognose, auch als Spanne. Neither the Tempo nor the kcal give a date or a weight to come.
- Rewriting `changes/backlog/hauptseite-abwaegen.md` for the new page is for acceptance. It stays as it is here.

## Left standing
**Review findings not fixed**
- **Nit:** in `src/app/Verdict.tsx`, `Figures` chooses „Defizit“ or „Überschuss“ by `trend.pace < 0` and takes `Math.sqrt` of the variances. The reviewer would put the sign rule next to `kcalPerDay` in `src/trend/pace.ts`.
  - I left it. The label is page wording, and the removed `LongTerm.tsx` chose it the same way, in the component. Moving it would add a domain type with a name the glossary does not have.
  - The rule is pinned in `src/app/Verdict.test.tsx` („Überschuss“ at a pace of 0, a gain, a loss).

**Checks**
- `npm run check` ran whole after the last change and exits 0 (830 tests).

**Criteria no automated test proves**
- **AC-11** needs layout, which jsdom does not do. The reviewer drove `next dev` in headless Chrome with the `run` skill. Headless Chrome drew a 15 px scrollbar, so the tight cases were also measured without it.
  - **360 × 640:** in the worst case (17.10., the longest Satz, „Daten abrufen“, and a real two-line error), the figures end at 464 px. Every other state ends higher.
  - **Widest values:** „1210 ± 320 kcal/Tag“ and the Tempo stay on one line inside their cells.
  - **1440 × 900:** the line and the Satz are on the left, the four figures in the right column, and the graph below both.
- **AC-7's figures for 19.10. and 20.10.** are pinned by page tests against `weight-history-fixture.ts`. In the browser the reviewer used a made-up 18.10. (97,4 instead of the fixture's 98,4), so the numbers seen there for those two days do not prove anything.

**Decisions costly to reverse**
- **`Assessment`** (`src/verdict/assessment.ts`) carries `trend: Trend` (the filter's trend of the last day with a measurement) in place of `trendKg` and `pace`. It is `null` only with `noVerdictYet`.
- **`kcalPerDay`** (`src/trend/pace.ts`) now rounds to the nearest ten, where it used to round down. It takes the unrounded pace (AC-7's 510 needs that), and it also turns the pace's standard deviation into S. `pace.ts` holds nothing else now.

**Departures from a nudge**
- **The removal list.** I removed `LongTerm.tsx` with its CSS and test, and `pace()`, `paceBand` and the threshold of the 28-day pace.
  - `scatter.ts` and `outlier.ts` stay because the graph still uses them, and 05 owns the graph.
  - `threshold` in `scatter.ts` now takes only the scatter, since the morning is its one remaining check.
  - `week-pace.ts`, `gap-comparison.ts`, `verdict.ts` and `MorningDeviation.tsx` were already gone.
- **Font sizes.** On the phone the values follow the design at 24px, with „± Y“ at 16px; they were 28px before. The design shows only the phone, so for the wide screen I chose 30px for the values and 18px for „± Y“.
- **The glossary.** Tempo is redefined and Tempo-Stufe is gone. Streuung and Ausreißer keep their old meanings because the graph still uses them until 05.

**Names not taken from the glossary** (please confirm)
- `formatPaceDeviation` in `src/app/format.ts`: the standard deviation of a pace, unsigned, with two decimals.
- The CSS class `sd` in `Verdict.module.css`: the „± Y“ beside a value.
