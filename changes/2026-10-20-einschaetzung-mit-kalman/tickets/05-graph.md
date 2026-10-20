---
criteria:  CRITERIA.md
closes:    AC-9
advances:
after:     04-vier-zahlen
status:    ready
attempts:  0
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
