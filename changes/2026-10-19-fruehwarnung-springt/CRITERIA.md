# Criteria: Frühwarnung springt nicht mehr

## Problem

Die Frühwarnung wechselt ihre Überschrift oft, und ein langsames, gleichmäßiges Abnehmen liest sie als Rauschen: Es steht dann als „Stagniert“ da, oft auch als „Nimmt zu“. Eine Warnung, die an vielen Tagen falsch liegt, lernt man zu übersehen. Stattdessen soll die Frühwarnung bei einem gleichmäßigen Abnehmen „Nimmt ab“ sagen und ihre Überschrift nur wechseln, wenn sich die Richtung des Gewichts tatsächlich ändert. Eine echte Umkehr soll sie weiterhin früh melden; dafür ist sie da.

Der Fall: In den Testdaten (`src/test/fixtures/gewicht-2026-07-bis-10.csv`, dazu 98,4 kg am 18.10. und 97,0 kg am 19.10.) wechselt die Überschrift an 81 Tagen 17-mal, zwischen 8.9. und 21.9. sechsmal, und die Farbe springt dabei zwischen Blau und Warnstufe. Bei einem erfundenen gleichmäßigen Abnehmen von 0,5 kg pro Woche mit einer Streuung von 0,7 kg sagte sie an 49 Tagen 20-mal „Nimmt ab“, 23-mal „Stagniert“ und 6-mal „Nimmt zu“, während „Langfristig“ durchgehend „Nimmt ab“ sagte.

## Acceptance criteria

- **AC-1** Das 14-Tage-Tempo eines Tages ist sein Trend gegen den Trend des letzten Tages, der 14 bis 17 Tage vor ihm liegt, in kg pro Woche. Verglichen wird nur mit Tagen ab dem ersten Tag nach der letzten Lücke. Seine Schwelle ist 1,25 × 0,39 × σ kg pro Woche, σ die Streuung des Tages. Ein Wert genau auf der Schwelle gilt als „stagniert“.
- **AC-2** Die Frühwarnung gibt es an Tagen mit 14-Tage-Tempo. Liegt das 7-Tage-Tempo des Tages über seiner Schwelle (1,25 × 0,80 × σ, wie bisher), sagt sie „Nimmt zu“, liegt es unter minus der Schwelle, „Nimmt ab“. Sonst sagt sie, was das 14-Tage-Tempo sagt: „Nimmt ab“ unter minus seiner Schwelle, „Nimmt zu“ darüber, „Stagniert“ dazwischen.
- **AC-3** Die Überschrift zeigt eine neue Frühwarnung erst, wenn diese an zwei Tagen mit Messung hintereinander gilt. Bis dahin bleibt die bisherige stehen. Am ersten Tag mit Frühwarnung, auch nach einer Lücke, steht sie sofort.
- **AC-4** N in „Der Trend fällt/stagniert/steigt seit N Tagen.“ und die Warnstufe zählen die Tage seit dem letzten Tag mit Messung, an dem die Überschrift etwas anderes zeigte. Zeigte sie dort keine Frühwarnung, heißt es „seit mindestens N Tagen“.
- **AC-5** Der Vergleich nach einer Lücke steht, bis der Tag ein 14-Tage-Tempo hat. Sein Satz endet mit „Ein Urteil gibt es wieder zwei Wochen nach der Lücke.“ „Noch kein Urteil“ steht, solange der Trend oder das 14-Tage-Tempo fehlt, mit dem Satz „Ein Urteil gibt es nach knapp drei Wochen mit Messungen.“ Sonst gilt beides wie bisher.
- **AC-6** Mit den Testdaten und zusätzlich 98,4 kg am 18.10. und 97,0 kg am 19.10.2026 steht bis zum 18.7. „Noch kein Urteil“, am 19.7. „Nimmt zu“ mit „seit mindestens einem Tag“. Danach wechselt die Überschrift am 29.7. zu „Nimmt ab“, am 7.8. zu „Nimmt zu“, am 22.8. zu „Stagniert“, am 30.8. zu „Nimmt zu“, am 16.9. zu „Stagniert“, am 20.9. zu „Nimmt ab“ und am 22.9. zu „Stagniert“; am 15.9. steht noch „Nimmt zu“, seit 17 Tagen. Vom 1.10. bis 14.10. steht der Vergleich nach der Lücke. Am 15.10. steht „Nimmt ab“ mit „seit mindestens einem Tag“, am 17.10. „Nimmt ab“ mit „seit mindestens 3 Tagen“, am 18.10. „Nimmt zu“ mit „seit einem Tag“ und am 19.10. „Nimmt zu“ mit „seit 2 Tagen“.
- **AC-7** Bei täglichen Messungen über 8 Wochen, die abwechselnd 0,7 kg über und unter einer Geraden mit −0,5 kg pro Woche liegen, die erste 0,7 kg darüber, steht ab dem ersten Tag mit Frühwarnung an jedem Tag „Nimmt ab“.
- **AC-8** Unverändert bleiben: die Karte des Morgens, „Langfristig“, die Zahlen, der Graph, die Farben je Warnstufe, die Überschrift „Frühwarnung · letzte Tage“ über der Frühwarnung und das Layout. Auf 360 × 640 px passt in jedem Zustand alles ohne Scrollen, wie bisher.

## Agreed design

Ist die letzte Woche deutlich, entscheidet sie; sonst entscheiden die letzten zwei Wochen. Eine neue Überschrift erscheint erst, wenn zwei Tage hintereinander dasselbe sagen. Beide Tempi vergleichen Punkte der Trendlinie, beide Schwellen kommen aus der Streuung wie bisher.

Simuliert mit einer Streuung von 0,7 kg (200 erfundene Reihen je Fall): ein gleichmäßiges Abnehmen von 0,5 kg pro Woche liest sie an 81 % der Tage als „Nimmt ab“ (bisher 42 %); bei gleichbleibendem Gewicht wechselt die Überschrift in 7 Wochen 6,3-mal (bisher 10,7); ein Stillstand nach einem Abnehmen steht typischerweise nach 13 Tagen dauerhaft als „Stagniert“ da, in 9 von 10 Fällen nach höchstens 41; eine scharfe Umkehr wie im Oktober nach 7 bis 9 Tagen. Der Vergleich der verworfenen Regeln im Zeitverlauf: https://claude.ai/artifact/HRK2EDQXm4LpuHyo2DSE4G (zeigt die Alternativen, nicht diese Regel).

**Agreed; build to this, do not redesign.**

## Technical decisions

- **Stored formats** Keine. Der Cache `gewicht:v1` bleibt unverändert; die Frühwarnung wird aus den Messungen berechnet.
- **Wire formats** Keine.
- **Trust boundaries** Keine.
- **Dependencies** Keine.

## Nudges

- `src/trend/week-pace.ts` exportiert `weekPace` und `fortnightPace`; beide rufen eine gemeinsame Funktion mit dem Abstand zurück (7 oder 14 Tage, jeweils mit einem Fenster von 3 Tagen). Im Glossar kommt „14-Tage-Tempo“ / `fortnightPace` dazu.
- `ScatterCheck` in `src/trend/scatter.ts` bekommt `fortnightPace` mit dem Rauschfaktor 0,39, kommentiert wie die anderen: aus derselben Simulation, Standardabweichung 0,387 mit dem Fenster 14 bis 17 Tage.
- Die Regel, welches Tempo spricht, und die Regel der zwei Tage stehen in `trendVerdict` in `src/verdict/verdict.ts`; die zwei Tage sind dort eine benannte Konstante.
- In `UBIQUITOUS_LANGUAGE.md` werden „Urteil“ und „Warnstufe“ an AC-2 bis AC-4 angepasst, „Vergleich nach einer Lücke“ an AC-5.
- AC-6 und AC-7 ersetzen in den Tests die Tage der bisherigen Frühwarnung in `src/verdict/assessment.test.ts` und `src/app/Verdict.test.tsx`; die Kommentare in `src/test/weight-history-fixture.ts`, die auf das alte AC-11 verweisen, verweisen dann auf AC-6.
- Bei der Abnahme `changes/backlog/warnstufe-nach-stagniert.md` gegen die neuen Tage prüfen und seine Belege anpassen.

## Out of scope

- Dass die Warnstufe fällt, wenn „Stagniert“ zu „Nimmt zu“ wird: `changes/backlog/warnstufe-nach-stagniert.md`.
- Der Satz nach langen Lücken: Nach mehr als etwa 10 Tagen ohne Messung kommt die Frühwarnung später wieder als „zwei Wochen nach der Lücke“.
- Ein Hinweis auf mehrere Messungen hintereinander auf derselben Seite des Trends.
- Ob „Langfristig“ neben der Frühwarnung seinen Platz behält: `changes/backlog/hauptseite-abwaegen.md`.

## Ruled out

- **7 Tage, Wechsel erst nach 3 Tagen** - springt seltener, liest ein langsames Abnehmen aber weiter mehr als die Hälfte der Tage als „Stagniert“.
- **Abweichung des 7-Tage-Tempos vom 28-Tage-Tempo** - ein Stillstand zeigt sich erst nach etwa drei Wochen.
- **21-Tage-Tempo** - ein Stillstand zeigt sich erst nach etwa 15 Tagen.
- **Nur das 14-Tage-Tempo** - im Oktober hätte sie bis 18.10. „Nimmt ab“ gesagt; über 14 Tage heben sich Fall und Anstieg auf.
- **„Nimmt zu“ aus 7 Tagen, sonst immer die 14 Tage** - an einem Stillstand etwas schneller, aber schwerer zu erklären als „ist die letzte Woche deutlich, entscheidet sie, sonst die letzten zwei“.
- **Drei Messungen hintereinander auf einer Seite des Trends** - unterscheidet ein gleichmäßiges Abnehmen nicht von gleichbleibendem Gewicht; ohne Abstand schlägt sie an etwa einem Viertel der Tage an, mit 0,5 σ verpasst sie ein Drittel der echten Wechsel.
- **Kaskade 7 → 14 → 28 Tage** - „Stagniert“ käme erst, wenn alle drei es sagen; ein Stillstand zeigte sich erst nach etwa einem Monat.
- **Die 7 Tage entscheiden, dazwischen „Langfristig“** - aus demselben Grund; und die Frühwarnung wiederholte meist „Langfristig“.
