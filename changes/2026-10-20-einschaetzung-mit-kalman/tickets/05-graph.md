---
criteria:  CRITERIA.md
closes:    AC-9
advances:
after:     04-vier-zahlen
status:    done
attempts:  1
---

## Build
The graph draws the filter's estimated weight as a line inside a band of ± its uncertainty, and marks as outliers the measurements with z beyond ±2. The last code built on Theil-Sen goes.

## Done when
> **AC-9** Der Graph zeigt die sechs Wochen bis heute: die zählenden Messungen als Punkte, das geschätzte Gewicht jedes Tags als Linie mit einer Fläche von ± seiner Unsicherheit. Linie und Fläche brechen an einer Lücke ab. Die Marken bleiben wie bisher: ein Ausreißer, jetzt eine Messung mit z über 2 oder unter −2, ist ein größerer Ring, die letzte Messung die größte Marke, als Ring, wo sie ein Ausreißer ist.

## Technical decisions
> **Stored formats** Keine. Der Cache `gewicht:v1` bleibt unverändert; alles wird aus den Messungen berechnet.

> **Wire formats** Keine.

> **Trust boundaries** Keine.

> **Dependencies** Keine. Der Filter ist von Hand geschrieben, wie in `kalman.py`.

## Nudges
> Der Filter ersetzt Theil-Sen in `src/trend/trend.ts` und liefert je Tag mit Messung Gewicht, Tempo, beider Varianzen und z. Seine Einstellungen - die drei Varianzen, die Grenze von 2 Standardabweichungen und der Anfang (Gewicht der ersten Messung mit Varianz 1 kg², Tempo 0 mit Standardabweichung 0,5 kg pro Woche) - sind benannte Konstanten, mit einem Kommentar, dass `analysis/kalman/kalman.py` dieselben Werte nutzt und beide zusammen geändert werden.

> Weg fallen samt Tests und CSS: `src/trend/week-pace.ts`, `src/trend/scatter.ts`, `src/trend/outlier.ts`, `src/verdict/gap-comparison.ts`, die Regeln in `src/verdict/verdict.ts`, `src/app/LongTerm.tsx` und `src/app/MorningDeviation.tsx`. Der Faktor 7700 / 7 bleibt eine benannte Konstante.

> In `UBIQUITOUS_LANGUAGE.md` kommen dazu: Ampel `trafficLight` (`green`, `yellow`, `red`), Sicherheit `lossCertainty`, Satz zum Morgen `morningSentence`. Trend `trend` (auf der Seite „Gewicht, geschätzt“, in den Sätzen „Trend“) bleibt der Name, jetzt für das, was der Filter für einen Tag schätzt; `Trend` und `trends` in `src/trend/trend.ts` behalten ihre Namen. Tempo und Ausreißer (z > 2) werden neu gefasst, Urteil `verdict` als Ampel, Sicherheit und Satz zum Morgen eines Tags, „Noch kein Urteil“ ohne zählende Messung; `src/verdict/` behält seinen Namen. 7- und 14-Tage-Tempo, Warnstufe, Tempo-Stufe, Streuung, Vergleich nach einer Lücke und Abweichung am Morgen fallen weg. Lücke bleibt, für den Graphen.

## Context
From 01, `trends` in `src/trend/trend.ts` gives the estimated weight, its variance and z of each day with a counting measurement.

What exists: `sixWeekSeries` in `src/trend/six-week-series.ts` marks each measurement of the six weeks with `isOutlier` (`src/trend/outlier.ts`, against the Streuung from `src/trend/scatter.ts`) on the Theil-Sen trend (`src/trend/theil-sen.ts`). It breaks the trend line at every gap from `findGaps`. `src/app/WeightGraph.tsx` draws the points, rings and latest mark, the line 3px wide, and scales to the measurements and the line.

The design (`changes/2026-10-20-einschaetzung-mit-kalman/specimens/muster.html`, `graph`): the band is a faint filled area in the text colour, scaled together with the measurements so it stays inside the graph.

After 04, the graph is the last user of `theil-sen.ts`, `scatter.ts` and `outlier.ts`, and they go here along with their tests. `src/trend/trend.ts` is then the only trend.

The glossary: Ausreißer is redefined (z > 2), Streuung goes, and Lücke stays for the graph.

## Not here
- Out of scope: Eine Prognose, auch als Spanne. Line and band end at the last day with a measurement.
- Anything above the graph: 03 and 04.

## Left standing
**Review findings not fixed**
- None. Round 1 had one should-fix: a trend piece of a single day, between two gaps, got a band with no area. Its band is now a bar as wide as the line. Round 1 also had a nit about parsing `points` three ways in `WeightGraph.test.tsx`. Round 2 was clean apart from the nit below.

**Fix made after the last review**
- Round 2 nit: the README bullet on "the pace over four weeks" ("nimmt ab", "stagniert", "nimmt zu") has been stale since 04. It now describes the four figures. This is text only, and no reviewer saw it.

**Checks**
- `npm run check` ran whole after the band fix and exits 0 (804 tests). The only change after that run is the README bullet, and no check reads the README.

**Criterion no automated test proves**
- AC-9: the tests pin the band's corners, its fill and its scale, but jsdom cannot show whether the band is visible.
  - Round 1 drove `next dev` in headless Chrome at 360×640 and 1440×900 on 17.10. and 4.10. Line and band break at 22.9.→1.10. and stay inside the graph. The rings are exactly 15.9., 3.10., 4.10., 6.10., 7.10. and 12.10.
  - Round 2 drove a lone 21.9. between two gaps on the phone. The 3 px bar shows above and below the dot.

**Decisions costly to reverse**
- **The Ausreißer rule.** `isOutlier(trend)` in `src/trend/trend.ts` is now the one rule: |z| > 2, and exactly 2 is not an outlier. The graph uses it, and so does the Satz zum Morgen (`outlier` and `lightMorning`, with the sign of z). `OUTLIER_Z` moved there from `morning-sentence.ts`.
- **A lone day's band.** A trend piece of a single day gets a band as a bar `LINE_WIDTH` (3 px) wide, from trend + SD to trend − SD. The specimen draws nothing there. I chose the bar because AC-9 asks for a band on every day, and the line of such a day is already a dot.
- **Where I kept the current graph rather than the specimen:**
  - The line stays 3 px; the specimen has 2.5. AC-9 says „Die Marken bleiben wie bisher“.
  - The scale keeps its margin of 0.3 kg; the specimen has 0.2.
  - The `aria-label` stays „Messungen und Trend der letzten sechs Wochen“; the specimen has „…und geschätztes Gewicht…“. Page tests find the graph by this label.
  - The band lies under the points and the line over them, as the line did before; the specimen draws the points over both.

**Departures from a nudge**
- None. The first nudge was built in 01. Of the second nudge's removal list, only `theil-sen.ts`, `scatter.ts` and `outlier.ts` were left, and they are gone with their tests. The old outlier rule was not dropped but moved into `trend.ts` as `isOutlier`, because the Ausreißer stays a concept. The glossary now redefines Ausreißer, drops Streuung, and says on Lücke that the graph breaks line and band there.

**Names not taken from the glossary** (please confirm)
- „Fläche“ (± the uncertainty) is the band in the code: `bandCorners` and `kgSd` in `src/app/WeightGraph.tsx`. The glossary has no entry for it.
