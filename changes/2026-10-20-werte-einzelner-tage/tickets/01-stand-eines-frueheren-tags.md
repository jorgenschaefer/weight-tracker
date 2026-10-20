---
criteria:  CRITERIA.md
closes:    AC-1, AC-2, AC-3, AC-4, AC-5, AC-9, AC-10, AC-11
advances:  
after:     
status:    ready
attempts:  0
---

## Build
Ein Tipp, ein Ziehen oder ← und → im Graphen wählen einen früheren Tag mit einer Messung. Über dem Graphen zeigt die Seite dann, wie sie an jenem Tag war, und an der Stelle von Statuszeile und ⟳ steht ein Band „Stand <Tag>“ mit „Zurück zu heute“. Der Graph markiert den gewählten Tag.

## Done when
> **AC-1** Ein Tipp in den Graphen wählt den Tag mit einer zählenden Messung, dessen Punkt waagrecht am nächsten liegt, auch in einer Lücke. Zieht man den Finger oder die gedrückte Maus darüber, wählt die Seite fortlaufend den jeweils nächsten. Senkrechtes Wischen über den Graphen scrollt die Seite weiter.

> **AC-2** Ist ein früherer Tag gewählt, zeigt alles über dem Graphen die Seite, wie sie an jenem Tag war, aus den Messungen bis einschließlich jenes Tags. Das gilt für die Farbe der Fläche und der Browserleiste, die Zeile zur Sicherheit, den Satz zum Morgen, die vier Zahlen und „Letzte Messung“. „Gemessen“ ist die zählende Messung jenes Tags, am 18.10. der Testdaten also 98,4 kg; „Letzte Messung“ nennt die neueste Messung bis einschließlich jenes Tags, zählend oder nicht.

> **AC-3** Statt Statuszeile und ⟳ steht dann ein Band in der Textfarbe der Fläche mit „Stand <Tag>“ (etwa „Stand 18.10.“). Darin ist ein Knopf „Zurück zu heute“, mindestens 48 px hoch.

> **AC-4** Der Graph zeigt weiter die sechs Wochen bis heute mit allen Messungen. Den gewählten Tag markiert er mit einer senkrechten Linie und einem größeren Punkt; bei einem Ausreißer bleibt dieser Punkt hohl.

> **AC-5** Zurück zu heute kommt man mit „Zurück zu heute“, einem zweiten Tipp auf den gewählten Punkt oder einem Tipp auf den Punkt des letzten Tags mit einer Messung. Danach ist die Seite genau wie ohne Wahl, mit Statuszeile, ⟳ und ohne Markierung.

> **AC-9** Mit der Tastatur ist der Graph per Tab erreichbar. ← und → wählen den vorigen bzw. nächsten Tag mit einer Messung, Escape führt zurück zu heute. Nach „Zurück zu heute“ liegt der Fokus auf dem Graphen. Ein Screenreader sagt das Band höflich an, etwa „Stand 18.10.“.

> **AC-10** Auf 360 × 640 px steht das Band in einer Zeile. Ab 65em sitzt es, wo die Statuszeile sitzt, so breit wie die Spalte der vier Zahlen. Nichts scrollt horizontal.

> **AC-11** Ohne Wahl sieht die Seite aus wie bisher; neu ist nur, dass der Graph Tipps annimmt und per Tab erreichbar ist.

## Technical decisions
> **Stored formats** keine. Der gewählte Tag lebt nur im Speicher der Seite.

> **Wire formats** keine.

> **Trust boundaries** keine.

> **Dependencies** keine.

## Nudges
> Die Regel „die Seite eines früheren Tags kennt nur die Messungen bis einschließlich jenes Tags“ steht an einem Ort: in einer reinen Funktion neben `assess` in `src/verdict/assessment.ts`, die nach der Regel heißt. Aus ihrem Ergebnis kommen sowohl die Einschätzung (aus den zählenden Messungen) als auch „Letzte Messung“ (die neueste, zählend oder nicht).

> Der gewählte Tag lebt in `src/app/page.tsx`. `WeightGraph` bekommt ihn und meldet Tipps über einen Callback, zeichnet aber weiter die `sixWeekSeries` von heute.

> Das Band ist eine eigene Komponente an der Stelle von `GoogleStatus`; `GoogleStatus` bleibt unverändert.

> „Stand“ kommt ins Glossar `UBIQUITOUS_LANGUAGE.md`: auf der Seite „Stand“, im Code `shownDay`, „der frühere Tag, dessen Seite unter dem Band gezeigt wird“.

> `changes/backlog/werte-einzelner-tage.md` geht in dieser Änderung auf.

## Context
Heute rechnet `Page` in `src/app/page.tsx` aus Cache und Eingetragenen Messungen `latestMeasurement` und `assess(countingMeasurements(…), today)` und gibt sie an `Surface` (Farben, `theme-color`, `GoogleStatus`, `EntrySheet`) und `CachedMeasurements` („Letzte Messung“, `Verdict`, `Figures`, `WeightGraph`). `WeightGraph` (`src/app/WeightGraph.tsx`) zeichnet die `sixWeekSeries` als reines SVG ohne Interaktion, in zwei Layouts (unter und ab 600 px Breite). Die Seite in Tests öffnet `src/test/open-page.tsx`; die Testdaten bis 20.10. liefert `src/test/weight-history-fixture.ts`.

Das Muster ist `specimens/muster.html` neben `CRITERIA.md`: gebaut wird danach, nicht neu entworfen. Es zeigt das Band und die Markierung (senkrechte Linie, Punkt mit Rand in der Farbe der Fläche). Wo es von den Kriterien abweicht, gelten die Kriterien: dort ist „Zurück zu heute“ niedriger als 48 px (AC-3).

Wie im Muster ist der letzte Tag mit einer Messung kein früherer Tag: ihn zu wählen, per Tipp, Ziehen oder →, zeigt heute.

Dieses Ticket legt den gewählten Tag (`shownDay`) in `page.tsx` und die Funktion mit der Regel in `assessment.ts` an; 02 baut darauf, wann die Wahl endet.

## Not here
- Was die Wahl beendet oder hält: Sichtbarwerden der Seite (AC-6), + und sein Blatt während einer Wahl (AC-7) und ein Abruf während einer Wahl (AC-8). Das ist 02.
- Die Differenz zwischen der heutigen Messung und der des gewählten Tags.
- Messungen vor den sechs Wochen des Graphen (`changes/backlog/langzeitansicht.md`): der Graph und was sich wählen lässt, bleiben bei den sechs Wochen bis heute.
- Weitere Messungen eines Tags außer der zählenden und der letzten.

## Left standing
