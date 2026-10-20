---
criteria:  CRITERIA.md
closes:    AC-1, AC-2
advances:  AC-3, AC-4, AC-7
after:     06-theil-sen-verschieben
status:    ready
attempts:  0
---

## Build
The Kalman filter replaces Theil-Sen as `trends` in `src/trend/trend.ts`, and on top of it, in `src/verdict/`, the Ampel with its Sicherheit and the Satz zum Morgen of a day, all in the domain. The page does not change yet.

## Done when
> **AC-1** Für jeden Tag mit zählender Messung sind das geschätzte Gewicht, das Tempo, beider Unsicherheit, z und die Ampel die Werte, die `kalman` und `traffic_light` in `analysis/kalman/kalman.py` für denselben Tag berechnen, aus allen zählenden Messungen bis zu diesem Tag; die Seite rundet erst beim Anzeigen, wie AC-5 sagt. Mit den Testdaten (`src/test/fixtures/gewicht-2026-07-bis-10.csv`, dazu 98,4 kg am 18.10., 97,0 kg am 19.10. und 96,9 kg am 20.10.2026) stimmt das für jeden Tag vom 1.7. bis 20.10.2026 auf sechs Nachkommastellen.

> **AC-2** Die Ampel ist grün, wenn das Tempo mit mehr als 80 % Wahrscheinlichkeit unter −0,1 kg pro Woche liegt, rot, wenn es mit mehr als 80 % Wahrscheinlichkeit nicht darunter liegt, sonst gelb. Sie hängt nur an ihrem Tag, nicht an den Tagen davor.

For AC-3: the probability that the pace lies under −0,1 kg per week, which the line above the sentence will show, is there for every day with a counting measurement. Wording the line is not part of this ticket.

For AC-4: the Satz zum Morgen of each day with a counting measurement is the first that applies from AC-4's list, worked out from the days up to it.

For AC-7: on the test data, the Ampel and the Satz zum Morgen of each day in the table are the ones the table gives, and so is the probability behind its line, once rounded the way AC-3 says.

## Toward
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

## Technical decisions
> **Stored formats** Keine. Der Cache `gewicht:v1` bleibt unverändert; alles wird aus den Messungen berechnet.

> **Wire formats** Keine.

> **Trust boundaries** Keine.

> **Dependencies** Keine. Der Filter ist von Hand geschrieben, wie in `kalman.py`.

## Nudges
> Der Filter ersetzt Theil-Sen in `src/trend/trend.ts` und liefert je Tag mit Messung Gewicht, Tempo, beider Varianzen und z. Seine Einstellungen - die drei Varianzen, die Grenze von 2 Standardabweichungen und der Anfang (Gewicht der ersten Messung mit Varianz 1 kg², Tempo 0 mit Standardabweichung 0,5 kg pro Woche) - sind benannte Konstanten, mit einem Kommentar, dass `analysis/kalman/kalman.py` dieselben Werte nutzt und beide zusammen geändert werden.

> Die Ampel und die Wahrscheinlichkeit nennenswerter Abnahme stehen in `src/verdict/traffic-light.ts`, −0,1 kg pro Woche und 80 % als benannte Konstanten. Der Satz zum Morgen steht in `src/verdict/morning-sentence.ts`, mit 2, 1 und 14 Tagen als benannten Konstanten.

> Ein Test hält AC-1 gegen die ungerundeten Werte fest, die `kalman` und `traffic_light` aus `kalman.py` für die Testdaten berechnen. `src/test/weight-history-fixture.ts` bekommt die 96,9 kg vom 20.10. zu denen vom 18. und 19.10.

> In `UBIQUITOUS_LANGUAGE.md` kommen dazu: Ampel `trafficLight` (`green`, `yellow`, `red`), Sicherheit `lossCertainty`, Satz zum Morgen `morningSentence`. Trend `trend` (auf der Seite „Gewicht, geschätzt“, in den Sätzen „Trend“) bleibt der Name, jetzt für das, was der Filter für einen Tag schätzt; `Trend` und `trends` in `src/trend/trend.ts` behalten ihre Namen. Tempo und Ausreißer (z > 2) werden neu gefasst, Urteil `verdict` als Ampel, Sicherheit und Satz zum Morgen eines Tags, „Noch kein Urteil“ ohne zählende Messung; `src/verdict/` behält seinen Namen. 7- und 14-Tage-Tempo, Warnstufe, Tempo-Stufe, Streuung, Vergleich nach einer Lücke und Abweichung am Morgen fallen weg. Lücke bleibt, für den Graphen.

## Context
What existed before 06: `trends(counting)` in `src/trend/trend.ts` was Theil-Sen over a fortnight, giving each day a `Trend` of `day` and `kg`, and `trend.ts` also exported `median`. The current Frühwarnung, „Langfristig“, the figures, the card and the graph all build on it: `scatter.ts`, `pace.ts`, `outlier.ts`, `week-pace.ts`, `six-week-series.ts`, `src/verdict/verdict.ts`, `gap-comparison.ts`, `assessment.ts` and `src/app/WeightGraph.tsx`.

Shared with the other tickets: 06 has moved Theil-Sen, unchanged, to `src/trend/theil-sen.ts`, and the code above imports it from there, so the page shows exactly what it shows now. Tickets 02 to 05 replace that code piece by piece, and 05 deletes `theil-sen.ts`. From this ticket on, `Trend` and `trends` in `trend.ts` are the filter's: for each day with a counting measurement, the estimated weight, the pace, both variances and z. 03 to 05 read them there.

The reference is `analysis/kalman/kalman.py`. `kalman()` gives level, pace in kg per day, both variances and z for each measurement. Its first state is the first measurement with variance 1 kg², a pace of 0 and a pace standard deviation of 0.5/7 kg per day, and from there it steps by the days between measurements. `traffic_light()` gives each day the colour in German and P(pace not under the threshold), and its `hysteresis` defaults to 0. The script prints only rounded figures (`days`), so the unrounded reference values for AC-1 come from calling these two functions on the test data, and they are kept in the repository beside the test. The test data is `weightHistoryUntil` in `src/test/weight-history-fixture.ts`, which gets 20.10.2026. Its comments still cite „AC-6“ from an earlier change. With 20.10. added, the test in `src/app/Verdict.test.tsx` that opens on 23.10. for „Letzte Messung vor 4 Tagen“ moves one day later.

`docs/adr/0001-einschaetzung-aus-kalman-filter.md` records the decision: no rule next to the filter overrides its numbers or the Ampel. The Satz zum Morgen is the one agreed layer of rules on top of them.

The glossary: this ticket adds Ampel, Sicherheit and Satz zum Morgen and redefines Trend as the filter's estimate. Each other entry the glossary nudge names changes in the ticket that changes its code: 02 drops Vergleich nach einer Lücke and Abweichung am Morgen; 03 redefines Urteil and drops Warnstufe and the 7- and 14-Tage-Tempo; 04 redefines Tempo and drops Tempo-Stufe; 05 redefines Ausreißer and drops Streuung.

## Not here
- Everything on the page: the line, the sentence and the colours are 03's, the four numbers 04's, the graph 05's.
- Deleting the code that still uses Theil-Sen: 02 to 05, each with the part of the page it replaces.
- Out of scope: Die Phase „Gewicht halten“ (`changes/backlog/erhaltungsphase.md`). Neither Ampel nor sentence gets a state for holding the weight.

## Left standing
