---
criteria:  CRITERIA.md
closes:    AC-1, AC-7
advances:  AC-2, AC-6
after:     
status:    done
attempts:  1
---

## Build
The Streuung of a day, and the outliers, the card of the morning and the comparison after a gap judged by it instead of by fixed kilograms.

## Done when
> **AC-1** Die Streuung eines Tages ist die Wurzel aus dem Mittel der Quadrate der Abstände „zählende Messung minus Trend ihres Tages“ aller Tage mit Trend in den 28 Tagen vor ihm. Mit weniger als 10 solchen Abständen ist sie 0,7 kg.

> **AC-7** Der Graph markiert genau die Messungen als Ausreißer, die nach der Regel aus AC-6 mit der Streuung ihres eigenen Tages über der Schwelle liegen, egal ob darüber oder darunter.

Toward AC-2: the morning's threshold is 1.25 × σ kg, and a measurement exactly on it is no deviation - for the graph's outliers and for the card alike.

Toward AC-6: the card stands with the verdict of the trend, under its headline and sentence, with every text, day label and rounding AC-6 gives; with the comparison after a gap, „Letzte Messung vor N Tagen“ and „Noch kein Urteil“ there is none.

## Toward
> **AC-2** Jede Prüfung fragt, ob ein Wert über das 1,25-Fache dessen hinausgeht, was Rauschen allein ergibt. Die Schwellen sind 1,25 × σ kg für den Morgen, 1,25 × 0,80 × σ kg pro Woche für das 7-Tage-Tempo und 1,25 × 0,20 × σ kg pro Woche für das 28-Tage-Tempo, σ die Streuung des Tages. Ein Wert genau auf der Schwelle gilt als „stagniert“ bzw. als keine Abweichung.

> **AC-6** Liegt die zählende Messung des letzten Tages mit Messung mehr als die Schwelle über ihrem Trend, steht in der Frühwarnung unter dem Satz eine Karte in umgekehrten Farben: „Heute · X kg über dem Trend“ und darunter „Hoffentlich ein Ausreißer – gestern viel gegessen? Vorsicht!“. Liegt sie mehr als die Schwelle darunter: „Heute · X kg unter dem Trend“ und „Vielleicht ein Ausreißer, vielleicht die Wende. Weiter so!“. Sonst gibt es keine Karte. X ist der Abstand, auf eine Nachkommastelle gerundet. War die Messung nicht heute, steht „Gestern“ oder „Am T.M.“ an Stelle von „Heute“. Die Karte erscheint nur mit der Frühwarnung, nicht beim Vergleich nach einer Lücke, bei „Letzte Messung vor N Tagen“ oder bei „Noch kein Urteil“.

## Technical decisions
> **Stored formats** Keine. Der Cache `gewicht:v1` bleibt unverändert; Streuung, Tempi, Tempo-Stufe, Warnstufe und Karte werden aus den Messungen berechnet.

> **Wire formats** Keine.

> **Trust boundaries** Keine.

> **Dependencies** Keine.

## Nudges
> Die Streuung hat einen Ort, `src/trend/scatter.ts`; im Glossar „Streuung“ / `scatter`. Dort stehen als benannte Konstanten der Faktor 1,25, die Rauschfaktoren 1,0 (Morgen), 0,80 (7-Tage-Tempo) und 0,20 (28-Tage-Tempo), die 28 Tage, die 10 Abstände und die Start-Streuung 0,7 kg, und die Regel, die einen Wert gegen seine Schwelle in „darunter“, „dazwischen“ und „darüber“ sortiert.

> Jeder Rauschfaktor bekommt einen Kommentar, woher er kommt: aus einer Simulation eines gleichbleibenden Gewichts mit zufälliger täglicher Streuung von σ = 1 kg, mit Trend und Tempo berechnet wie auf der Seite, als mittlere Schwankung des Werts (7-Tage-Tempo 0,80, 28-Tage-Tempo 0,20, Morgen 0,92, aufgerundet auf 1,0). Die 0,7 kg bekommen einen Kommentar: die Streuung der Messungen von 2026.

> Der Vergleich nach einer Lücke nimmt als Streuung die Streuung des ersten Tags nach der Lücke aus `scatter`; `spreadBefore` in `src/verdict/gap-comparison.ts` fällt weg, und `MEASUREMENTS_UNTIL_VERDICT` weicht der Regel aus AC-10.

> `isOutlier` in `src/trend/outlier.ts` nimmt die Streuung statt der 0,9 kg; die Karte und der Graph fragen beide dort.

> In `UBIQUITOUS_LANGUAGE.md` werden Urteil (auf der Seite „Frühwarnung“), Stufe (heißt jetzt „Warnstufe“ und zählt die Tage, in denen die Frühwarnung dasselbe sagt), Tempo und Tempo-Stufe (Schwelle aus der Streuung, mit kcal) und Ausreißer (Schwelle aus der Streuung) angepasst; „Streuung“, „7-Tage-Tempo“ und „Abweichung am Morgen“ / `morningDeviation` für die Karte kommen dazu; „4-Tage-Tempo“ und „Steigung“ gehen.

> AC-11 ersetzt in den Tests die Tage aus AC-4 und AC-5 der Trendumkehr und die Tests der festen Schwellen 0,9 kg, +1,0 und ±0,2 kg pro Woche.

## Context
What exists: `isOutlier` in `src/trend/outlier.ts` judges against a fixed 0.9 kg, and `sixWeekSeries` in `src/trend/six-week-series.ts` marks the graph's outliers with it. `spreadBefore` in `src/verdict/gap-comparison.ts` is a root mean square of the counting measurements around their day's trend in the 4 weeks up to the last day before the gap; the normal variation of the comparison is 2 · s / √n of it. The verdict of the trend is `TrendVerdict` in `src/verdict/verdict.ts` (`losing`, `noDecrease`, `gaining`), shown by `Verdict` in `src/app/Verdict.tsx`, with the button „Daten abrufen“ after it in `src/app/page.tsx`.

The 28 days of AC-1 are the 28 before the day, not the day itself: AC-11's threshold of 1,01 kg on 16.10. comes out that way, while counting the day itself gives 1,02 kg. Days with a trend before a gap count like any other.

This ticket builds `src/trend/scatter.ts`: `scatter`, the named constants, and the rule that sorts a value against its threshold into below, between and above. Ticket 02 takes the threshold of the 28-day pace from it and ticket 03 that of the 7-day pace; neither computes a spread or a threshold of its own. The check of the card, `morningDeviation`, asks `isOutlier`'s rule as the graph does; ticket 03 moves the card under the sentence of the Frühwarnung and keeps it.

The card in its inverted colours - the surface's ink as its background, the surface as its text, as the button „Daten abrufen“ already is - is in `specimens/Main.dc.html` beside `CRITERIA.md`: its source shows the sizes; the page itself only shows through the artifact https://claude.ai/artifact/3RZPaRpUpCnwy5PooUGGP5. The graph there is a placeholder.

Of the glossary, this ticket adds „Streuung“ and „Abweichung am Morgen“ and changes „Ausreißer“ and „Vergleich nach einer Lücke“ where they name the fixed variation.

## Not here
- The 28-day pace, its band and the block „Langfristig“ are ticket 02's; so is what „Noch kein Urteil“ carries, which still leaves the graph without outliers here.
- The 7-day pace, the Frühwarnung, its sentence, and when the comparison after a gap ends are ticket 03's.
- The graph changes nothing but which measurements it marks as outliers.
- Out of scope: Eine Simulation der Rauschfaktoren aus der eigenen, schiefen Streuung zur Laufzeit. The factors are constants with their comment.

## Left standing
- **Review finding not fixed (nit):** `threshold` in `src/trend/scatter.ts` carries the noise factors of the 7-day and 28-day pace (`ScatterCheck` `"sevenDayPace"`, `"twentyEightDayPace"`), which only its tests use so far. Kept because tickets 02 and 03 are to take their thresholds from here rather than compute their own.
- **Consequence of the nudge on the comparison after a gap (reviewer's observation, not a finding):** s is now the Streuung of the first day after the gap, whose 28 days include the gap itself. After a gap of about 19 days or more, fewer than 10 distances remain, so s is always 0.7 kg, whatever the person's own scatter was before.
- **Not proved by an automated test:** what the card looks like - its sizes against `specimens/Main.dc.html`, that nothing is cut off at 390 px and on a wide screen. The reviewer drove the page (run skill, headless Chrome) on 8.10., 12.10., 13.10., 14.10., 16.10., 15.9. and 3.10. at both widths. Texts, day labels, rounding, place and inverted colours of the card are proved by `src/app/MorningDeviation.test.tsx`; „Gestern“ and „Am T.M.“ were not seen in the browser, as no date of the test data shows them with the full history.
- **Costly to reverse:** the interface of `src/trend/scatter.ts` that tickets 02 and 03 will be written against - `scatter(counting, trends, day)`, `threshold(check: ScatterCheck, scatterKg)` and `sortAgainstThreshold(value, limit)` returning `"below" | "between" | "above"` (a value exactly on the threshold, give or take 1e-9, is `"between"`). And `morningDeviation: MorningDeviation | null` (`{ day, differenceKg }`, negative below the trend) on every branch of `Assessment`, `null` everywhere but the verdict of the trend; the card is `MorningDeviationCard` in `src/app/MorningDeviation.tsx`, rendered by `Verdict`, which now takes `today`.
- **Departures from the nudges:** `MEASUREMENTS_UNTIL_VERDICT` in `src/verdict/gap-comparison.ts` stays: when the comparison after a gap ends is ticket 03's. Of the glossary changes the nudge lists, only the ones this ticket names are made (Streuung, Abweichung am Morgen, Ausreißer, Vergleich nach einer Lücke); Urteil, Stufe, Tempo, Tempo-Stufe, 7-Tage-Tempo, 4-Tage-Tempo and Steigung are left to tickets 02 and 03. `variation` in the comparison after a gap now sorts with `sortAgainstThreshold` too, which adds its 1e-9 rounding allowance to the 2 · s / √n boundary.
