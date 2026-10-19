---
criteria:  CRITERIA.md
closes:    AC-8
advances:  AC-2, AC-9, AC-10, AC-12
after:     01-streuung-und-ausreisser
status:    ready
attempts:  0
---

## Build
The block „Langfristig · 4 Wochen“ with the 28-day pace, its band by the Streuung, and the calories a day; it replaces the Ampel and the figure „Tempo 4 Wochen“.

## Done when
> **AC-8** Unter der Frühwarnung steht „Langfristig · 4 Wochen“, darunter „Nimmt ab, −0,33 kg pro Woche (≈ 360 kcal Defizit pro Tag)“ bzw. „Stagniert, …“ oder „Nimmt zu, … (≈ … kcal Überschuss pro Tag)“, und darunter „Nah an der Wahrheit, reagiert langsam.“. Das 28-Tage-Tempo wird berechnet wie bisher das Tempo 4 Wochen, auch über Lücken hinweg, auf Hundertstel gerundet; seine Tempo-Stufe folgt aus dem gerundeten Wert und der Schwelle aus AC-2. Die kcal pro Tag sind der Betrag des gerundeten Tempos × 7700 / 7, auf Zehner abgerundet (−0,35 kg pro Woche ergibt 380 kcal); bei einem Tempo von 0,00 steht keine Klammer. Die Zahl „Tempo 4 Wochen“ steht nicht mehr bei den Zahlen; dort stehen Trend und Gemessen.

Toward AC-2: the 28-day pace's threshold is 1.25 × 0.20 × σ kg per week, and a pace exactly on it is „Stagniert“.

Toward AC-9: the Ampel „4 Wochen: …“ is gone from the page.

Toward AC-10: under „Noch kein Urteil“, the comparison after a gap and „Letzte Messung vor N Tagen“ the block „Langfristig“ stands where there is a 28-day pace; under „Noch kein Urteil“ with a trend, the figures show the trend and the graph the trend line and the outliers.

Toward AC-12: on a phone „Langfristig“ stands under the verdict and above the figures, and with them everything AC-12 names that the page has yet fits 360 × 640 px without scrolling; on a wide screen „Langfristig“ and the figures stand on the right.

## Toward
> **AC-2** Jede Prüfung fragt, ob ein Wert über das 1,25-Fache dessen hinausgeht, was Rauschen allein ergibt. Die Schwellen sind 1,25 × σ kg für den Morgen, 1,25 × 0,80 × σ kg pro Woche für das 7-Tage-Tempo und 1,25 × 0,20 × σ kg pro Woche für das 28-Tage-Tempo, σ die Streuung des Tages. Ein Wert genau auf der Schwelle gilt als „stagniert“ bzw. als keine Abweichung.

> **AC-9** „kein Abnehmen“, „Zuletzt abgenommen bis“ und die Ampel „4 Wochen: …“ unter der Überschrift kommen auf der Seite nicht mehr vor.

> **AC-10** Der Vergleich nach einer Lücke steht an Stelle der Frühwarnung, bis der Tag ein 7-Tage-Tempo nach der Lücke hat; sein Satz endet mit „Ein Urteil gibt es wieder eine Woche nach der Lücke.“. „Noch kein Urteil“ steht, solange der Trend oder das 7-Tage-Tempo fehlt, mit dem Satz „Ein Urteil gibt es nach knapp zwei Wochen mit Messungen.“. Gibt es unter „Noch kein Urteil“ schon einen Trend, zeigen die Zahlen den Trend und der Graph die Trendlinie und die Ausreißer nach AC-7. „Letzte Messung vor N Tagen“ tritt an Stelle der Frühwarnung wie bisher. In allen drei Fällen steht der Block „Langfristig“, wo es ein 28-Tage-Tempo gibt.

> **AC-12** Auf einem Bildschirm von 360 × 640 px sind in jedem Zustand, auch mit dem Knopf „Daten abrufen“ und mit der Zeile „Vorläufig, wird aktualisiert …“, Überschrift, Satz, Karte, der Block „Langfristig“ und die Zahlen ohne Scrollen sichtbar, und nichts scrollt horizontal. Auf breiten Bildschirmen steht die Frühwarnung mit der Karte links, „Langfristig“ und die Zahlen rechts, aufgeteilt wie bisher Urteil und Zahlen.

## Technical decisions
> **Stored formats** Keine. Der Cache `gewicht:v1` bleibt unverändert; Streuung, Tempi, Tempo-Stufe, Warnstufe und Karte werden aus den Messungen berechnet.

> **Wire formats** Keine.

> **Trust boundaries** Keine.

> **Dependencies** Keine.

## Nudges
> Die Streuung hat einen Ort, `src/trend/scatter.ts`; im Glossar „Streuung“ / `scatter`. Dort stehen als benannte Konstanten der Faktor 1,25, die Rauschfaktoren 1,0 (Morgen), 0,80 (7-Tage-Tempo) und 0,20 (28-Tage-Tempo), die 28 Tage, die 10 Abstände und die Start-Streuung 0,7 kg, und die Regel, die einen Wert gegen seine Schwelle in „darunter“, „dazwischen“ und „darüber“ sortiert.

> `paceBand` in `src/trend/pace.ts` nimmt die Schwelle aus der Streuung statt ±0,2. Die kcal pro Tag rechnet eine Funktion neben dem Tempo, mit 7700 kcal pro kg als benannter Konstante.

> In `UBIQUITOUS_LANGUAGE.md` werden Urteil (auf der Seite „Frühwarnung“), Stufe (heißt jetzt „Warnstufe“ und zählt die Tage, in denen die Frühwarnung dasselbe sagt), Tempo und Tempo-Stufe (Schwelle aus der Streuung, mit kcal) und Ausreißer (Schwelle aus der Streuung) angepasst; „Streuung“, „7-Tage-Tempo“ und „Abweichung am Morgen“ / `morningDeviation` für die Karte kommen dazu; „4-Tage-Tempo“ und „Steigung“ gehen.

> AC-11 ersetzt in den Tests die Tage aus AC-4 und AC-5 der Trendumkehr und die Tests der festen Schwellen 0,9 kg, +1,0 und ±0,2 kg pro Woche.

> Das Kaloriendefizit aus `changes/backlog/hauptseite-abwaegen.md` ist mit AC-8 erledigt; der Eintrag verliert diesen Absatz.

## Context
What exists: `pace` in `src/trend/pace.ts` is the 28-day pace (the glossary's „Tempo“, „Tempo 4 Wochen“ on the page), rounded to hundredths, and `paceBand` sorts it at a fixed ±0.2. `Verdict` in `src/app/Verdict.tsx` shows the band as the Ampel (`BAND_NAMES`), and `Figures` shows „Tempo 4 Wochen“ beside Trend and Gemessen. `.summary` in `src/app/page.module.css` sets the verdict and the figures side by side on a wide screen. `noVerdictYet` in `src/verdict/assessment.ts` leaves out the trend, the pace, the trend line and the outliers.

The band takes σ of the pace's own day, the last day with a measurement, through ticket 01's `scatter` and its rule in `src/trend/scatter.ts`.

The block writes the pace as the page writes paces now (`formatPace`: −0,33, +0,25). Its bracket follows the sign of the rounded pace, not its band: a deficit under 0, a surplus over 0, under „Stagniert“ too.

What „Noch kein Urteil“ carries is built here; when it stands - also while the 7-day pace is missing - is ticket 03's. The headline, its sentence and the colours of the verdict stay as they are.

Of the glossary, this ticket changes „Tempo“ and „Tempo-Stufe“ (threshold from the Streuung, with kcal).

Look and words: `specimens/Main.dc.html` beside `CRITERIA.md` (its source shows the sizes; the page only shows through https://claude.ai/artifact/3RZPaRpUpCnwy5PooUGGP5).

## Not here
- The Frühwarnung, its sentence, its colours and the remaining texts of AC-9 are ticket 03's.
- Out of scope: Der Rest von `changes/backlog/hauptseite-abwaegen.md`: ob jede übrige Angabe der Hauptseite ihren Platz verdient. Only the paragraph on the calorie deficit goes.

## Left standing
