---
criteria:  CRITERIA.md
closes:    AC-2, AC-3, AC-4, AC-5, AC-6, AC-9, AC-10, AC-11, AC-12, AC-13
advances:  
after:     01-streuung-und-ausreisser, 02-langfristig
status:    ready
attempts:  0
---

## Build
The Frühwarnung: the 7-day pace judged by the Streuung as „Nimmt ab“, „Stagniert“ or „Nimmt zu“, with the days it has said so and the Warnstufe of their colour, in place of the verdict with „kein Abnehmen“; and the comparison after a gap and „Noch kein Urteil“ until there is a 7-day pace.

## Done when
> **AC-2** Jede Prüfung fragt, ob ein Wert über das 1,25-Fache dessen hinausgeht, was Rauschen allein ergibt. Die Schwellen sind 1,25 × σ kg für den Morgen, 1,25 × 0,80 × σ kg pro Woche für das 7-Tage-Tempo und 1,25 × 0,20 × σ kg pro Woche für das 28-Tage-Tempo, σ die Streuung des Tages. Ein Wert genau auf der Schwelle gilt als „stagniert“ bzw. als keine Abweichung.

> **AC-3** Frühwarnung: Das 7-Tage-Tempo eines Tages ist sein Trend gegen den Trend des letzten Tages, der 7 bis 10 Tage vor ihm liegt, in kg pro Woche; verglichen wird nur mit Tagen ab dem ersten Tag nach der letzten Lücke. Unter minus der Schwelle lautet die Überschrift „Nimmt ab“, über der Schwelle „Nimmt zu“, dazwischen „Stagniert“. Über der Überschrift steht „Frühwarnung · letzte Tage“.

> **AC-4** Unter der Überschrift steht „Der Trend fällt seit N Tagen.“, „Der Trend stagniert seit N Tagen.“ oder „Der Trend steigt seit N Tagen.“. N sind die Tage seit dem letzten Tag mit Messung, an dem die Frühwarnung etwas anderes sagte als heute („Nimmt ab“, „Stagniert“, „Nimmt zu“) oder nichts davon; bei N = 1 heißt es „seit einem Tag“. Sagte sie an jenem Tag nichts davon, heißt es „seit mindestens N Tagen“.

> **AC-5** Bei „Nimmt ab“ ist die Fläche blau wie bisher. „Stagniert“ und „Nimmt zu“ tragen die Farben der Warnstufe von N - 1 bis 6, 7 bis 13, ab 14 Tagen -, schon vom ersten Tag an. Die Überschrift ist auf jeder Warnstufe gesetzt wie bisher „Nimmt ab“; sie wird nicht breiter oder kräftiger.

> **AC-6** Liegt die zählende Messung des letzten Tages mit Messung mehr als die Schwelle über ihrem Trend, steht in der Frühwarnung unter dem Satz eine Karte in umgekehrten Farben: „Heute · X kg über dem Trend“ und darunter „Hoffentlich ein Ausreißer – gestern viel gegessen? Vorsicht!“. Liegt sie mehr als die Schwelle darunter: „Heute · X kg unter dem Trend“ und „Vielleicht ein Ausreißer, vielleicht die Wende. Weiter so!“. Sonst gibt es keine Karte. X ist der Abstand, auf eine Nachkommastelle gerundet. War die Messung nicht heute, steht „Gestern“ oder „Am T.M.“ an Stelle von „Heute“. Die Karte erscheint nur mit der Frühwarnung, nicht beim Vergleich nach einer Lücke, bei „Letzte Messung vor N Tagen“ oder bei „Noch kein Urteil“.

> **AC-9** „kein Abnehmen“, „Zuletzt abgenommen bis“ und die Ampel „4 Wochen: …“ unter der Überschrift kommen auf der Seite nicht mehr vor.

> **AC-10** Der Vergleich nach einer Lücke steht an Stelle der Frühwarnung, bis der Tag ein 7-Tage-Tempo nach der Lücke hat; sein Satz endet mit „Ein Urteil gibt es wieder eine Woche nach der Lücke.“. „Noch kein Urteil“ steht, solange der Trend oder das 7-Tage-Tempo fehlt, mit dem Satz „Ein Urteil gibt es nach knapp zwei Wochen mit Messungen.“. Gibt es unter „Noch kein Urteil“ schon einen Trend, zeigen die Zahlen den Trend und der Graph die Trendlinie und die Ausreißer nach AC-7. „Letzte Messung vor N Tagen“ tritt an Stelle der Frühwarnung wie bisher. In allen drei Fällen steht der Block „Langfristig“, wo es ein 28-Tage-Tempo gibt.

> **AC-11** Mit den Testdaten und zusätzlich 98,4 kg am 18.10. und 97,0 kg am 19.10.2026 lautet die Seite: am 7.10. der Vergleich nach der Lücke; am 8.10. „Nimmt ab“; am 12.10. „Nimmt ab“ mit „Der Trend fällt seit mindestens 5 Tagen.“, der Karte „Heute · 2,6 kg über dem Trend“ und „Nimmt ab, −0,74 kg pro Woche (≈ 810 kcal Defizit pro Tag)“; am 13.10. „Stagniert“ mit „Der Trend stagniert seit einem Tag.“ und der Karte „Heute · 1,2 kg über dem Trend“; am 16.10. „Stagniert“ mit „Der Trend stagniert seit 4 Tagen.“ und ohne Karte (0,97 kg über dem Trend, Schwelle 1,01 kg); am 17.10. „Nimmt zu“ mit „Der Trend steigt seit einem Tag.“; am 19.10. „Nimmt zu“ mit „Der Trend steigt seit 3 Tagen.“, der Karte „Heute · 1,3 kg unter dem Trend“ und „Nimmt ab, −0,33 kg pro Woche (≈ 360 kcal Defizit pro Tag)“.

> **AC-12** Auf einem Bildschirm von 360 × 640 px sind in jedem Zustand, auch mit dem Knopf „Daten abrufen“ und mit der Zeile „Vorläufig, wird aktualisiert …“, Überschrift, Satz, Karte, der Block „Langfristig“ und die Zahlen ohne Scrollen sichtbar, und nichts scrollt horizontal. Auf breiten Bildschirmen steht die Frühwarnung mit der Karte links, „Langfristig“ und die Zahlen rechts, aufgeteilt wie bisher Urteil und Zahlen.

> **AC-13** „Letzte Messung“, Abruf, Abmelden und der Graph bis auf die Markierung der Ausreißer bleiben unverändert.

## Technical decisions
> **Stored formats** Keine. Der Cache `gewicht:v1` bleibt unverändert; Streuung, Tempi, Tempo-Stufe, Warnstufe und Karte werden aus den Messungen berechnet.

> **Wire formats** Keine.

> **Trust boundaries** Keine.

> **Dependencies** Keine.

## Nudges
> Die Streuung hat einen Ort, `src/trend/scatter.ts`; im Glossar „Streuung“ / `scatter`. Dort stehen als benannte Konstanten der Faktor 1,25, die Rauschfaktoren 1,0 (Morgen), 0,80 (7-Tage-Tempo) und 0,20 (28-Tage-Tempo), die 28 Tage, die 10 Abstände und die Start-Streuung 0,7 kg, und die Regel, die einen Wert gegen seine Schwelle in „darunter“, „dazwischen“ und „darüber“ sortiert.

> Der Vergleich nach einer Lücke nimmt als Streuung die Streuung des ersten Tags nach der Lücke aus `scatter`; `spreadBefore` in `src/verdict/gap-comparison.ts` fällt weg, und `MEASUREMENTS_UNTIL_VERDICT` weicht der Regel aus AC-10.

> `src/trend/four-day-pace.ts` wird zum 7-Tage-Tempo in `src/trend/week-pace.ts`; im Glossar „7-Tage-Tempo“ / `weekPace`. `slopePerWeek` fällt aus `Trend` weg, sobald nichts es mehr liest.

> In `src/verdict/verdict.ts` fallen `isFalling`, `CONFIRMATION_DAYS` und `GAINING_KG_PER_WEEK` weg; das Urteil hat die Arten `losing` / `holding` / `gaining`, jede mit N, „mindestens“ und Warnstufe.

> In `UBIQUITOUS_LANGUAGE.md` werden Urteil (auf der Seite „Frühwarnung“), Stufe (heißt jetzt „Warnstufe“ und zählt die Tage, in denen die Frühwarnung dasselbe sagt), Tempo und Tempo-Stufe (Schwelle aus der Streuung, mit kcal) und Ausreißer (Schwelle aus der Streuung) angepasst; „Streuung“, „7-Tage-Tempo“ und „Abweichung am Morgen“ / `morningDeviation` für die Karte kommen dazu; „4-Tage-Tempo“ und „Steigung“ gehen.

> AC-11 ersetzt in den Tests die Tage aus AC-4 und AC-5 der Trendumkehr und die Tests der festen Schwellen 0,9 kg, +1,0 und ±0,2 kg pro Woche.

## Context
What exists: `trendVerdict` in `src/verdict/verdict.ts` (`losing`, `noDecrease`, `gaining`, with `DaysWithoutDecrease` and `Level`) and `fourDayPace` in `src/trend/four-day-pace.ts`; `gapUnderComparison` in `src/verdict/gap-comparison.ts` ends the comparison after 5 measurements; `assess` in `src/verdict/assessment.ts` picks the status; `Verdict` and `surfaceColours` in `src/app/Verdict.tsx` give headline, sentence, emphasis and colours, with `LEVEL_COLOURS` for the Warnstufen and the emphases `level1` to `level3` in `src/app/Verdict.module.css`.

Built before: ticket 01's `src/trend/scatter.ts` holds σ, the factors and the rule against a threshold, which the 7-day pace takes its threshold from, and the card (`morningDeviation`), which stands with the verdict and here moves under the Frühwarnung's sentence. Ticket 02's block „Langfristig“ and what „Noch kein Urteil“ carries stay as they are; this ticket decides when „Noch kein Urteil“ stands.

Of the glossary, this ticket changes „Urteil“ and „Stufe“ (now „Warnstufe“), adds „7-Tage-Tempo“, and removes „4-Tage-Tempo“ and „Steigung“.

The colours of the Warnstufen are `LEVEL_COLOURS`, as „Nimmt zu“ and „kein Abnehmen“ use them now; under every kind the headline is set as „Nimmt ab“ is now.

The page has been checked in the browser before with the `run` skill of this repository, which drives the page on any day of the test data; jsdom measures no layout.

Look and words: `specimens/Main.dc.html` (19.10.), `specimens/A-12.dc.html` (12.10.) and `specimens/A-17.dc.html` (17.10., without the card) beside `CRITERIA.md`; their source shows the sizes, and the pages only show through https://claude.ai/artifact/3RZPaRpUpCnwy5PooUGGP5. The graph there is a placeholder.

## Not here
- Out of scope: Eine Frühwarnung mit kürzerem Tempo in der ersten Woche nach einer Lücke.
- Whether `changes/backlog/nimmt-zu-nach-luecke.md` still occurs is checked at acceptance, which deletes it; the entry stays here.

## Left standing
