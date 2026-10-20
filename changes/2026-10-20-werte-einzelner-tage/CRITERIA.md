# Criteria: Die Seite eines früheren Tags zeigen

## Problem
Die Seite zeigt die heutige Messung, aber keine der Tage davor. Der Graph zeichnet die Messungen der letzten sechs Wochen als Punkte, beschriftet aber nur ganze Kilo und jeden 7. bzw. 10. Tag, also lässt sich keine einzelne Messung ablesen. Nach dem Wiegen kann man deshalb nicht sagen, wie weit die heutige Messung von einer früheren liegt, an die man denkt: der von gestern oder, wenn gestern ein Sprung war, der von einem oder zwei Tagen davor; der letzten vor einer Lücke; dem Tiefpunkt innerhalb der sechs Wochen. Stattdessen soll jede Messung der letzten sechs Wochen mit ihrem Tag und ihrem Gewicht auf 0,1 kg ablesbar sein, so dass man die heutige Messung neben jede von ihnen halten kann.

Am 20.10.2026 wollte die Person nach dem Wiegen wissen, was die Waage gestern gezeigt hatte, um es mit heute zu vergleichen („0,2 mehr? 0,5?“). Die Seite konnte es nicht sagen. Der Backlog-Eintrag `changes/backlog/werte-einzelner-tage.md` beschreibt, was die Seite heute zeigt.

## Acceptance criteria
- **AC-1** Ein Tipp in den Graphen wählt den Tag mit einer zählenden Messung, dessen Punkt waagrecht am nächsten liegt, auch in einer Lücke. Zieht man den Finger oder die gedrückte Maus darüber, wählt die Seite fortlaufend den jeweils nächsten. Senkrechtes Wischen über den Graphen scrollt die Seite weiter.
- **AC-2** Ist ein früherer Tag gewählt, zeigt alles über dem Graphen die Seite, wie sie an jenem Tag war, aus den Messungen bis einschließlich jenes Tags. Das gilt für die Farbe der Fläche und der Browserleiste, die Zeile zur Sicherheit, den Satz zum Morgen, die vier Zahlen und „Letzte Messung“. „Gemessen“ ist die zählende Messung jenes Tags, am 18.10. der Testdaten also 98,4 kg; „Letzte Messung“ nennt die neueste Messung bis einschließlich jenes Tags, zählend oder nicht.
- **AC-3** Statt Statuszeile und ⟳ steht dann ein Band in der Textfarbe der Fläche mit „Stand <Tag>“ (etwa „Stand 18.10.“). Darin ist ein Knopf „Zurück zu heute“, mindestens 48 px hoch.
- **AC-4** Der Graph zeigt weiter die sechs Wochen bis heute mit allen Messungen. Den gewählten Tag markiert er mit einer senkrechten Linie und einem größeren Punkt; bei einem Ausreißer bleibt dieser Punkt hohl.
- **AC-5** Zurück zu heute kommt man mit „Zurück zu heute“, einem zweiten Tipp auf den gewählten Punkt oder einem Tipp auf den Punkt des letzten Tags mit einer Messung. Danach ist die Seite genau wie ohne Wahl, mit Statuszeile, ⟳ und ohne Markierung.
- **AC-6** Wird die Seite wieder sichtbar, zeigt sie heute, ebenso nach dem Neuladen oder erneuten Öffnen.
- **AC-7** Während ein früherer Tag gewählt ist, bleibt + erreichbar und trägt für heute ein; das Blatt sieht aus und schlägt vor wie ohne Wahl, mit den Farben und der Letzten Messung von heute. Sobald ein Eintragen gelingt, zeigt die Seite heute. Wird das Blatt ohne Eintragen geschlossen, bleibt der Tag gewählt.
- **AC-8** Bringt ein Abruf neue Messungen, während ein früherer Tag gewählt ist, bleibt der Tag gewählt und wird neu berechnet. Hat er danach keine zählende Messung mehr, zeigt die Seite heute. Schlägt ein Abruf fehl, während ein früherer Tag gewählt ist, zeigt die Seite heute, und die Statuszeile sagt „Abruf fehlgeschlagen: …“ wie bisher.
- **AC-9** Mit der Tastatur ist der Graph per Tab erreichbar. ← und → wählen den vorigen bzw. nächsten Tag mit einer Messung, Escape führt zurück zu heute. Nach „Zurück zu heute“ liegt der Fokus auf dem Graphen. Ein Screenreader sagt das Band höflich an, etwa „Stand 18.10.“.
- **AC-10** Auf 360 × 640 px steht das Band in einer Zeile. Ab 65em sitzt es, wo die Statuszeile sitzt, so breit wie die Spalte der vier Zahlen. Nichts scrollt horizontal.
- **AC-11** Ohne Wahl sieht die Seite aus wie bisher; neu ist nur, dass der Graph Tipps annimmt und per Tab erreichbar ist.

## Agreed design
Ein Tipp oder Ziehen im Graphen zeigt über dem Graphen die Seite jenes Morgens in dessen Farbe; an der Stelle der Statuszeile steht ein dunkles Band „Stand <Tag>“ mit „Zurück zu heute“. Der Graph bleibt bei den sechs Wochen bis heute und markiert den Tag. Wo Muster und Kriterien auseinandergehen, gelten die Kriterien: Das Muster bleibt beim Zurückkehren in den Tab auf dem gewählten Tag, die Seite zeigt dann heute (AC-6).

- Artifact: https://claude.ai/artifact/U3ccikBaEfjpe8swnH4Hi1 („Band statt Statuszeile“)
- Kopie: [`specimens/muster.html`](specimens/muster.html)

**Agreed; build to this, do not redesign.**

## Technical decisions
- **Stored formats** keine. Der gewählte Tag lebt nur im Speicher der Seite.
- **Wire formats** keine.
- **Trust boundaries** keine.
- **Dependencies** keine.

## Nudges
- Die Regel „die Seite eines früheren Tags kennt nur die Messungen bis einschließlich jenes Tags“ steht an einem Ort: in einer reinen Funktion neben `assess` in `src/verdict/assessment.ts`, die nach der Regel heißt. Aus ihrem Ergebnis kommen sowohl die Einschätzung (aus den zählenden Messungen) als auch „Letzte Messung“ (die neueste, zählend oder nicht).
- Der gewählte Tag lebt in `src/app/page.tsx`. `WeightGraph` bekommt ihn und meldet Tipps über einen Callback, zeichnet aber weiter die `sixWeekSeries` von heute.
- Das Band ist eine eigene Komponente an der Stelle von `GoogleStatus`; `GoogleStatus` bleibt unverändert.
- „Stand“ kommt ins Glossar `UBIQUITOUS_LANGUAGE.md`: auf der Seite „Stand“, im Code `shownDay`, „der frühere Tag, dessen Seite unter dem Band gezeigt wird“.
- `changes/backlog/werte-einzelner-tage.md` geht in dieser Änderung auf.

## Out of scope
- Die Differenz zwischen der heutigen Messung und der des gewählten Tags.
- Messungen vor den sechs Wochen des Graphen (`changes/backlog/langzeitansicht.md`).
- Weitere Messungen eines Tags außer der zählenden und der letzten.

## Ruled out
- **Liste der Messungen unter dem Graphen** - für den Tiefpunkt müsste man bis zu 42 Zahlen durchsehen, und die Seite würde lang.
- **Werte an jedem Punkt im Graphen** - macht den Graphen jeden Morgen voller, für eine Frage, die nur ab und zu kommt.
- **Zeile über dem Graphen, Fähnchen am Punkt, Zeile mit Abstand zu heute** - die Person will die ganze Seite jenes Tags sehen; die Differenz rechnet sie im Kopf.
- **Gestreifte Fläche mit großem Datum** - nimmt + weg und verdrängt den Anfang des Urteils.
- **Rahmen um die Seite** - liest sich leicht als Schmuck, und sein × ist klein.
- **„Stand <Tag> – nicht heute“** - das Datum reicht.
- **Den gewählten Tag beim Zurückkehren in den Tab behalten** - von der Person verworfen.
