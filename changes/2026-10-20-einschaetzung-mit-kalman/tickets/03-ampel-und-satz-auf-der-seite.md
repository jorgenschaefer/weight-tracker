---
criteria:  CRITERIA.md
closes:    AC-3, AC-4, AC-6, AC-12
advances:  AC-7, AC-8, AC-10, AC-11
after:     01-filter-ampel-satz, 02-karte-und-luecke-fallen-weg
status:    ready
attempts:  0
---

## Build
The page shows the Ampel, the line about how certain it is and the Satz zum Morgen in place of the Frühwarnung, and colours the surface by the Ampel. The Frühwarnung's code goes.

## Done when
> **AC-3** Über dem Satz steht die wahrscheinlichere Seite: „N % sicher, dass du abnimmst“, wenn das Tempo mit mindestens 50 % Wahrscheinlichkeit unter −0,1 kg pro Woche liegt, sonst „N % sicher, dass du nicht abnimmst“. N ist die Wahrscheinlichkeit dieser Seite in ganzen Prozent, höchstens 99.

> **AC-4** Der Satz zum Morgen ist der erste zutreffende dieser Liste. „Gestern“ ist der vorige Tag mit Messung; am ersten Tag mit Messung gilt die Farbe als unverändert. z ist die Abweichung der Messung von der Erwartung des Filters in Standardabweichungen.
> 1. Gestern rot, heute gelb: „Die Zunahme ist gestoppt. Ob du abnimmst, ist noch offen.“
> 2. Gestern grün, heute gelb: „Achtung, die Abnahme wird langsamer.“
> 3. Heute grün, gestern nicht: „Du nimmst wieder ab.“
> 4. Heute rot, gestern nicht: „Achtung, du nimmst wieder zu.“
> 5. Grün und z > 2: „Ausreißer, der Trend bleibt.“
> 6. Rot und z < −2: „Leichter Morgen, aber ein Tag ändert den Trend noch nicht.“
> 7. Grün, z > 1 heute und gestern: „Zwei schwerere Morgen: Du nimmst noch ab, aber langsamer.“
> 8. Grün: „Du nimmst seit N Tagen ab.“, ab 14 Tagen „Du nimmst seit Wochen ab.“
> 9. Gelb, und das Tempo liegt mit mindestens 50 % Wahrscheinlichkeit unter −0,1 kg pro Woche: „Es geht wahrscheinlich abwärts, noch nicht sicher.“
> 10. Gelb: „Ob du abnimmst, ist noch offen.“
> 11. Rot: „Du nimmst seit N Tagen zu.“, ab 14 Tagen „Du nimmst seit Wochen zu.“
>
> N in 8 und 11 zählt die Kalendertage seit dem ersten Tag dieser Farbe in Folge, diesen mitgezählt; am ersten Tag greift 3 oder 4, und der erste Tag mit Messung überhaupt ist gelb, also ist N mindestens 2.

> **AC-6** Die Fläche, und mit ihr die Farbe des Browsers um die Seite, ist bei Grün #D3EAD0 mit Schrift #163D1B, bei Gelb #F3E2A2 mit #3B3004, bei Rot #F2C6B8 mit #5A1A0B, sonst neutral wie bisher.

> **AC-12** Unverändert bleiben: die Zeile „Letzte Messung …“, „Daten abrufen“ und die Fehlerzeile, „Vorläufig, wird aktualisiert …“ mit abgeblendetem Satz, der Knopf „+“ zum Eintragen (eingetragene Messungen zählen sofort) und „Abmelden“.

For AC-7: on each day of the table, the page shows the Ampel's colour, the line and the sentence the table gives.

For AC-8: on a day without a measurement, up to 3 days after the last one, line, sentence and colour are those of the last day with a measurement, with N counted up to it. Further back, „Letzte Messung vor N Tagen“ stands on a neutral surface with no line and no sentence. With no counting measurement at all, „Noch kein Urteil“ stands with no sentence. From the first counting measurement on, there are Ampel, line and sentence.

For AC-10: „Frühwarnung · letzte Tage“, the headlines „Nimmt ab“, „Stagniert“ and „Nimmt zu“, „Der Trend fällt/stagniert/steigt seit N Tagen.“ and the colours of the Warnstufen are gone.

For AC-11: on 360 × 640 px, everything down to the figures fits without scrolling in every state, with „Daten abrufen“, a two-line error and AC-4's longest sentence included. From 65em wide, line and sentence stand on the left.

## Toward
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
> Die Ampel und die Wahrscheinlichkeit nennenswerter Abnahme stehen in `src/verdict/traffic-light.ts`, −0,1 kg pro Woche und 80 % als benannte Konstanten. Der Satz zum Morgen steht in `src/verdict/morning-sentence.ts`, mit 2, 1 und 14 Tagen als benannten Konstanten.

> Weg fallen samt Tests und CSS: `src/trend/week-pace.ts`, `src/trend/scatter.ts`, `src/trend/outlier.ts`, `src/verdict/gap-comparison.ts`, die Regeln in `src/verdict/verdict.ts`, `src/app/LongTerm.tsx` und `src/app/MorningDeviation.tsx`. Der Faktor 7700 / 7 bleibt eine benannte Konstante.

> In `UBIQUITOUS_LANGUAGE.md` kommen dazu: Ampel `trafficLight` (`green`, `yellow`, `red`), Sicherheit `lossCertainty`, Satz zum Morgen `morningSentence`. Trend `trend` (auf der Seite „Gewicht, geschätzt“, in den Sätzen „Trend“) bleibt der Name, jetzt für das, was der Filter für einen Tag schätzt; `Trend` und `trends` in `src/trend/trend.ts` behalten ihre Namen. Tempo und Ausreißer (z > 2) werden neu gefasst, Urteil `verdict` als Ampel, Sicherheit und Satz zum Morgen eines Tags, „Noch kein Urteil“ ohne zählende Messung; `src/verdict/` behält seinen Namen. 7- und 14-Tage-Tempo, Warnstufe, Tempo-Stufe, Streuung, Vergleich nach einer Lücke und Abweichung am Morgen fallen weg. Lücke bleibt, für den Graphen.

## Context
From 01: `trends` in `src/trend/trend.ts` is the filter, the Ampel and its Sicherheit are in `src/verdict/traffic-light.ts`, and the Satz zum Morgen is in `src/verdict/morning-sentence.ts`. Here the page shows them. AC-3's line is worded from the probability 01 gives.

What exists after 02: the status of `Assessment` (`src/verdict/assessment.ts`) is the Frühwarnung from `trendVerdict` (`src/verdict/verdict.ts`, on `src/trend/week-pace.ts`), „Letzte Messung vor N Tagen“ (more than 3 days back), or „Noch kein Urteil“. `src/app/Verdict.tsx` shows the kicker, a headline and a sentence, and `surfaceColours` colours the surface by status and Warnstufe, with `NEUTRAL` otherwise. `Surface` in `src/app/page.tsx` sets that colour on the screen and in `theme-color`. While a fetch runs, `page.module.css` dims the headline (`h1`).

The design (`changes/2026-10-20-einschaetzung-mit-kalman/specimens/muster.html`, view A): the line sits where the kicker sits now, in its small uppercase style, and the sentence is large under it, 28px bold on the phone.

After this ticket, the figures (Trend, Gemessen) and „Langfristig“ still come from Theil-Sen and `pace.ts`. 04 replaces them with the four numbers, so the fit on 360 × 640 is checked here against the figures as they stand. `verdict.ts` and `week-pace.ts` serve only the Frühwarnung and go with it, as do the thresholds of the 7- and 14-day pace in `src/trend/scatter.ts`. `scatter.ts` itself stays for `pace.ts` and the graph.

jsdom measures nothing. The repository's `run` skill drives the page on any day of the test data, which is how 360 × 640 and the wide screen are checked in a browser. `src/test/open-page.tsx` holds the page helpers the tests share, and some of its comments name the Frühwarnung.

The glossary: Urteil is redefined as the nudge says, Warnstufe and the 7- and 14-Tage-Tempo go, and the `assessment` row is adjusted.

## Not here
- The four numbers and „Langfristig“: 04, which also closes AC-7 with the numbers of 19.10. and 20.10.
- The graph: 05.
- Deleting `changes/backlog/warnstufe-nach-stagniert.md` is for acceptance. It stays as it is here.
- Out of scope: Die Phase „Gewicht halten“ (`changes/backlog/erhaltungsphase.md`).

## Left standing
