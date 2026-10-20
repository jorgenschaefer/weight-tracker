---
criteria:  CRITERIA.md
closes:
advances:  AC-10
after:     01-filter-ampel-satz
status:    ready
attempts:  0
---

## Build
The card of the morning and the comparison after a gap go from the page, together with the code behind them.

## Done when
For AC-10: the page shows no card of the morning („Heute · X kg über/unter dem Trend“), and after a gap no „Nach N Tagen ohne Messung: …“ with its sentence and its orange. On the days where the comparison stood, the page shows what it already shows without a gap.

## Toward
> **AC-10** Es gibt nicht mehr: „Frühwarnung · letzte Tage“, die Überschriften „Nimmt ab“, „Stagniert“ und „Nimmt zu“, „Der Trend fällt/stagniert/steigt seit N Tagen.“, den Vergleich nach einer Lücke, die Karte des Morgens, „Langfristig · 4 Wochen“ und die Farben der Warnstufen.

## Technical decisions
> **Stored formats** Keine. Der Cache `gewicht:v1` bleibt unverändert; alles wird aus den Messungen berechnet.

> **Wire formats** Keine.

> **Trust boundaries** Keine.

> **Dependencies** Keine. Der Filter ist von Hand geschrieben, wie in `kalman.py`.

## Nudges
> Weg fallen samt Tests und CSS: `src/trend/week-pace.ts`, `src/trend/scatter.ts`, `src/trend/outlier.ts`, `src/verdict/gap-comparison.ts`, die Regeln in `src/verdict/verdict.ts`, `src/app/LongTerm.tsx` und `src/app/MorningDeviation.tsx`. Der Faktor 7700 / 7 bleibt eine benannte Konstante.

> In `UBIQUITOUS_LANGUAGE.md` kommen dazu: Ampel `trafficLight` (`green`, `yellow`, `red`), Sicherheit `lossCertainty`, Satz zum Morgen `morningSentence`. Trend `trend` (auf der Seite „Gewicht, geschätzt“, in den Sätzen „Trend“) bleibt der Name, jetzt für das, was der Filter für einen Tag schätzt; `Trend` und `trends` in `src/trend/trend.ts` behalten ihre Namen. Tempo und Ausreißer (z > 2) werden neu gefasst, Urteil `verdict` als Ampel, Sicherheit und Satz zum Morgen eines Tags, „Noch kein Urteil“ ohne zählende Messung; `src/verdict/` behält seinen Namen. 7- und 14-Tage-Tempo, Warnstufe, Tempo-Stufe, Streuung, Vergleich nach einer Lücke und Abweichung am Morgen fallen weg. Lücke bleibt, für den Graphen.

## Context
What exists: `assessLastDay` in `src/verdict/assessment.ts` falls back to `compareAfterGap` (`src/verdict/gap-comparison.ts`) where the Frühwarnung has no 14-day pace after the last gap. `src/app/Verdict.tsx` shows that comparison as a headline with a sentence, and colours a clear increase like Warnstufe 2. The card is `morningDeviation` in `src/trend/outlier.ts`, carried as `Assessment.morningDeviation` and drawn by `MorningDeviationCard` (`src/app/MorningDeviation.tsx` and its CSS) under the sentence in `Verdict.tsx`. At a height of 45em, `Verdict.module.css` and `page.module.css` narrow their gaps together with `MorningDeviation.module.css`, and their comments say so.

`isOutlier` in `outlier.ts` stays: the graph's rings use it until 05. This ticket only removes. Ticket 03 replaces the rest of the Frühwarnung with the Ampel and the Satz zum Morgen. Until then, a day after a gap without a 14-day pace shows the fallback that exists without a gap.

The glossary: Vergleich nach einer Lücke and Abweichung am Morgen go, and the `assessment` row stops naming the comparison. Lücke stays.

## Not here
- The headline, „Frühwarnung · letzte Tage“, its sentences and the colours of the Warnstufen: 03.
- The outlier rings in the graph: 05.
- `src/trend/theil-sen.ts` (06) and the filter in `src/trend/trend.ts` (01): this ticket leaves both alone.

## Left standing
