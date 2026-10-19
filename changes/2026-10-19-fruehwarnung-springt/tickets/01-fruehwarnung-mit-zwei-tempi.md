---
criteria:  CRITERIA.md
closes:    AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8
advances:  
after:     
status:    done
attempts:  1
---

## Build
The Frühwarnung decided by the 7-day pace where it is clear and otherwise by a new 14-day pace, its headline changing only after two days with a measurement in a row say the same, and the comparison after a gap and „Noch kein Urteil“ standing until there is a 14-day pace.

## Done when
> **AC-1** Das 14-Tage-Tempo eines Tages ist sein Trend gegen den Trend des letzten Tages, der 14 bis 17 Tage vor ihm liegt, in kg pro Woche. Verglichen wird nur mit Tagen ab dem ersten Tag nach der letzten Lücke. Seine Schwelle ist 1,25 × 0,39 × σ kg pro Woche, σ die Streuung des Tages. Ein Wert genau auf der Schwelle gilt als „stagniert“.

> **AC-2** Die Frühwarnung gibt es an Tagen mit 14-Tage-Tempo. Liegt das 7-Tage-Tempo des Tages über seiner Schwelle (1,25 × 0,80 × σ, wie bisher), sagt sie „Nimmt zu“, liegt es unter minus der Schwelle, „Nimmt ab“. Sonst sagt sie, was das 14-Tage-Tempo sagt: „Nimmt ab“ unter minus seiner Schwelle, „Nimmt zu“ darüber, „Stagniert“ dazwischen.

> **AC-3** Die Überschrift zeigt eine neue Frühwarnung erst, wenn diese an zwei Tagen mit Messung hintereinander gilt. Bis dahin bleibt die bisherige stehen. Am ersten Tag mit Frühwarnung, auch nach einer Lücke, steht sie sofort.

> **AC-4** N in „Der Trend fällt/stagniert/steigt seit N Tagen.“ und die Warnstufe zählen die Tage seit dem letzten Tag mit Messung, an dem die Überschrift etwas anderes zeigte. Zeigte sie dort keine Frühwarnung, heißt es „seit mindestens N Tagen“.

> **AC-5** Der Vergleich nach einer Lücke steht, bis der Tag ein 14-Tage-Tempo hat. Sein Satz endet mit „Ein Urteil gibt es wieder zwei Wochen nach der Lücke.“ „Noch kein Urteil“ steht, solange der Trend oder das 14-Tage-Tempo fehlt, mit dem Satz „Ein Urteil gibt es nach knapp drei Wochen mit Messungen.“ Sonst gilt beides wie bisher.

> **AC-6** Mit den Testdaten und zusätzlich 98,4 kg am 18.10. und 97,0 kg am 19.10.2026 steht bis zum 18.7. „Noch kein Urteil“, am 19.7. „Nimmt zu“ mit „seit mindestens einem Tag“. Danach wechselt die Überschrift am 29.7. zu „Nimmt ab“, am 7.8. zu „Nimmt zu“, am 22.8. zu „Stagniert“, am 30.8. zu „Nimmt zu“, am 16.9. zu „Stagniert“, am 20.9. zu „Nimmt ab“ und am 22.9. zu „Stagniert“; am 15.9. steht noch „Nimmt zu“, seit 17 Tagen. Vom 1.10. bis 14.10. steht der Vergleich nach der Lücke. Am 15.10. steht „Nimmt ab“ mit „seit mindestens einem Tag“, am 17.10. „Nimmt ab“ mit „seit mindestens 3 Tagen“, am 18.10. „Nimmt zu“ mit „seit einem Tag“ und am 19.10. „Nimmt zu“ mit „seit 2 Tagen“.

> **AC-7** Bei täglichen Messungen über 8 Wochen, die abwechselnd 0,7 kg über und unter einer Geraden mit −0,5 kg pro Woche liegen, die erste 0,7 kg darüber, steht ab dem ersten Tag mit Frühwarnung an jedem Tag „Nimmt ab“.

> **AC-8** Unverändert bleiben: die Karte des Morgens, „Langfristig“, die Zahlen, der Graph, die Farben je Warnstufe, die Überschrift „Frühwarnung · letzte Tage“ über der Frühwarnung und das Layout. Auf 360 × 640 px passt in jedem Zustand alles ohne Scrollen, wie bisher.

## Technical decisions
> **Stored formats** Keine. Der Cache `gewicht:v1` bleibt unverändert; die Frühwarnung wird aus den Messungen berechnet.

> **Wire formats** Keine.

> **Trust boundaries** Keine.

> **Dependencies** Keine.

## Nudges
> `src/trend/week-pace.ts` exportiert `weekPace` und `fortnightPace`; beide rufen eine gemeinsame Funktion mit dem Abstand zurück (7 oder 14 Tage, jeweils mit einem Fenster von 3 Tagen). Im Glossar kommt „14-Tage-Tempo“ / `fortnightPace` dazu.

> `ScatterCheck` in `src/trend/scatter.ts` bekommt `fortnightPace` mit dem Rauschfaktor 0,39, kommentiert wie die anderen: aus derselben Simulation, Standardabweichung 0,387 mit dem Fenster 14 bis 17 Tage.

> Die Regel, welches Tempo spricht, und die Regel der zwei Tage stehen in `trendVerdict` in `src/verdict/verdict.ts`; die zwei Tage sind dort eine benannte Konstante.

> In `UBIQUITOUS_LANGUAGE.md` werden „Urteil“ und „Warnstufe“ an AC-2 bis AC-4 angepasst, „Vergleich nach einer Lücke“ an AC-5.

> AC-6 und AC-7 ersetzen in den Tests die Tage der bisherigen Frühwarnung in `src/verdict/assessment.test.ts` und `src/app/Verdict.test.tsx`; die Kommentare in `src/test/weight-history-fixture.ts`, die auf das alte AC-11 verweisen, verweisen dann auf AC-6.

## Context
What exists: `weekPace(trends, day, firstComparable)` in `src/trend/week-pace.ts` compares with the trend 7 to 10 days back. `threshold(check, scatterKg)` and `sortAgainstThreshold` in `src/trend/scatter.ts` judge a value against the Streuung, with `ScatterCheck` naming the checks. `trendVerdict(trends, counting)` in `src/verdict/verdict.ts` sorts each day's 7-day pace and counts N back to the last day with a measurement that said something else; it returns null where the last day has no 7-day pace. `assess` in `src/verdict/assessment.ts` falls back to the comparison after the last gap, or „Noch kein Urteil“, wherever `trendVerdict` returns null. `Verdict.tsx` in `src/app/` holds the headline, the sentences of the comparison after a gap and of „Noch kein Urteil“, and the colours by Warnstufe.

What the headline shows on a day now depends on what it showed on the day with a measurement before, back to the first day with a Frühwarnung after the last gap, where it shows whatever the Frühwarnung says. „Nimmt ab“ still carries no Warnstufe.

`src/test/weight-history-fixture.ts` gives the test data with 18.10. and 19.10. as AC-6 names them; the AC-6 and AC-7 tests replace the AC-11 days of the earlier change in `assessment.test.ts` and `Verdict.test.tsx`.

Layout (AC-8): jsdom measures none. The `run` skill of this repository drives the page on any day of the test data, as the earlier change checked 360 × 640 in the browser.

## Not here
- Out of scope: Dass die Warnstufe fällt, wenn „Stagniert“ zu „Nimmt zu“ wird: `changes/backlog/warnstufe-nach-stagniert.md`.
- Out of scope: Der Satz nach langen Lücken: Nach mehr als etwa 10 Tagen ohne Messung kommt die Frühwarnung später wieder als „zwei Wochen nach der Lücke“.
- Out of scope: Ein Hinweis auf mehrere Messungen hintereinander auf derselben Seite des Trends.
- Out of scope: Ob „Langfristig“ neben der Frühwarnung seinen Platz behält: `changes/backlog/hauptseite-abwaegen.md`.
- Checking `changes/backlog/warnstufe-nach-stagniert.md` against the new days and updating its evidence belongs to acceptance; the file stays as it is here.

## Left standing

- **AC-8 not proved by an automated test, and as worded it does not hold - nor did it before.** jsdom measures no layout. A reviewer drove the page with the `run` skill at 360 × 640 and 1280 px on 10.7., 19.7., 7.8., 20.9., 22.9., 5.10. and 19.10. The card, „Langfristig“, the figures, the graph, the colours and „Frühwarnung · letzte Tage“ render as before, and nothing scrolls sideways. But in every state with „Langfristig“ the graph and „Abmelden“ lie below the fold at 640 px; with the card, most of the graph does. This change touches no layout - only two sentences of the same length in `src/app/Verdict.tsx` - and `changes/backlog/hauptseite-abwaegen.md` already records the figures ending at the bottom edge. Whether AC-8 means "nothing new is pushed down" or needs rewording is a question for acceptance.
- **Decided:** where a day has a 14-day pace but no 7-day pace (a trend missing 7 to 10 days back), the 14-day pace speaks, reading AC-2's „Sonst“ literally; `src/verdict/verdict.test.ts` pins it.
- **Coverage moved, not lost:** the fixture has no „Stagniert“ of 13 or 14 days any more, so the colour and headline tests in `src/app/Verdict.test.tsx` take Warnstufe 2 and 3 from „Nimmt zu“; „Stagniert“ on every Warnstufe stays pinned in `src/verdict/verdict.test.ts`, and both kinds take the same colours by level.
- **Costly to reverse:** `fortnightPace(trends, day, firstComparable)` in `src/trend/week-pace.ts`; `ScatterCheck` `"fortnightPace"`; `trendVerdict` keeps its signature and now returns what the headline shows, not what the day's paces say; glossary „14-Tage-Tempo“ / `fortnightPace`.
