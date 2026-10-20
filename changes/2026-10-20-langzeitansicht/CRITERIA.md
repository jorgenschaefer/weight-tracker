# Criteria: Langzeitansicht

## Problem

Wer weiter zurückschaut als die letzten sechs Wochen, etwa über dieses Jahr, hat nur die einzelnen Tageswerte, wie in Google Fit. Aus ihnen lassen sich die Phasen (Abnehmen, Stillstand, wieder Zunehmen) und ihre Wendepunkte nur grob ablesen: „roughly June“, „maybe April“. Stattdessen soll über Monate bis Jahre zu sehen sein, wann jede Phase begann und endete, wie schnell sie ging und wo die höchsten und tiefsten Punkte lagen, ohne dass die täglichen Schwankungen im Weg sind. Keine Entscheidung hängt daran; es geht um ein Gefühl dafür, wie es gelaufen ist.

Am 20.10.2026 sollte ein Blick in Google Fit ein Gefühl dafür geben, wie das Jahr gelaufen ist. Aus den Tageswerten ergab sich: „I lost weight from January to roughly June, with some slow streak since maybe april, and then gained again until oct, now I'm going down again“, die Wendepunkte nur ungefähr. Die Werte stehen in `~/Projects/patientenakte-jorgen/unterlagen/gewicht.csv`; in Google Health liegen sie ab Ende 2015.

## Acceptance criteria

- **AC-1** Über dem Graphen steht ein Umschalter „6 Wochen“ / „3 Monate“ / „1 Jahr“. Der Graph zeigt das Fenster des gewählten Zeitraums: bei „6 Wochen“ 42 Tage bis einschließlich seines letzten Tages (bis heute ist das der Graph von heute), bei „3 Monate“ drei Kalendermonate vom 1. des ersten bis zum letzten Tag des dritten (bis heute: der laufende Monat und die zwei davor), bei „1 Jahr“ ein Kalenderjahr vom 1.1. bis 31.12. Tage nach heute bleiben rechts leer; reicht das Fenster über heute hinaus, markiert eine senkrechte Linie heute.
- **AC-2** Beim Öffnen und beim Neuladen zeigt die Seite „6 Wochen“ bis heute. Ein Fenster, das heute enthält, ist auch nach einem Tageswechsel das Fenster bis heute (AC-3).
- **AC-3** ‹ und › verschieben das Fenster um einen ganzen Zeitraum: 42 Tage, drei Kalendermonate oder ein Kalenderjahr. › ist gesperrt, solange das Fenster heute enthält. Würde › ein Fenster ergeben, das heute enthält, zeigt die Seite das Fenster bis heute: bei „6 Wochen“ die 42 Tage, die mit heute enden, bei „3 Monate“ die drei Kalendermonate, die mit dem laufenden enden, bei „1 Jahr“ das laufende Kalenderjahr; so endet das 6-Wochen-Fenster nie nach heute. ‹ ist gesperrt, sobald das Fenster am Tag der ersten zählenden Messung oder davor beginnt. Beim Umschalten nimmt die Seite den letzten Tag des alten Fensters, oder heute, wo dieser Tag in der Zukunft liegt, und zeigt bei „6 Wochen“ die 42 Tage, die an ihm enden, bei „3 Monate“ die drei Kalendermonate, die mit seinem Monat enden, und bei „1 Jahr“ sein Kalenderjahr.
- **AC-4** Neben den Pfeilen steht der Bereich des Fensters: bei „6 Wochen“ „Bis heute“, sonst erster und letzter Tag mit zweistelligem Jahr, „8.9.26 – 19.10.26“; bei „3 Monate“ „Aug – Okt 2026“, über einen Jahreswechsel „Nov 2025 – Jan 2026“; bei „1 Jahr“ „2026“.
- **AC-5** In jedem Zeitraum zeigt der Graph die zählenden Messungen als Punkte und den Trend als Linie mit seinem Band, an Lücken unterbrochen, Ausreißer und die letzte Messung markiert wie heute; die letzte Messung nur im Fenster, das sie enthält, anders als im Specimen, das in jedem Fenster dessen letzte Messung markiert. Jedes Stück der Trendlinie zwischen zwei Tagen mit Messung hat die Farbe der Ampel des späteren Tages: grün, gelb oder rot.
- **AC-6** Jede der drei Linienfarben hat gegen jeden der vier Hintergründe der Seite (grün, gelb, rot, neutral) einen Kontrast von mindestens 3:1.
- **AC-7** Tippen und Ziehen wählen in jedem Zeitraum wie heute einen Tag mit Messung im gezeigten Fenster und zeigen die Seite „Stand <Tag>“. ← und → wählen den Tag mit Messung vor und nach dem gewählten Tag (ohne gewählten Tag: vor und nach dem letzten Tag mit Messung, wie heute); liegt er außerhalb des gezeigten Fensters, zeigt der Graph das Fenster, das ‹ oder › so oft wie nötig ergäben und das ihn enthält. Ein gewählter Tag bleibt gewählt, wenn der Zeitraum umgeschaltet oder das Fenster verschoben wird, auch wenn er dabei aus dem Fenster fällt.
- **AC-8** Außer Umschalter, ‹ › und ← → (AC-3, AC-7) verschieben nur „Zurück zu heute“ und das Eintragen eines Gewichts das Fenster: Sie beenden den Stand wie heute und bringen den Graphen zurück zum Fenster des gewählten Zeitraums bis heute: bei „6 Wochen“ die 42 Tage, die mit heute enden, bei „3 Monate“ die drei Kalendermonate, die mit dem laufenden enden, bei „1 Jahr“ das laufende Kalenderjahr. Escape, ein zweites Tippen auf den gewählten Tag, ein fehlgeschlagener Abruf und die Rückkehr der Seite in den Vordergrund beenden den Stand wie heute; das Fenster des Graphen bleibt, wo es ist.
- **AC-9** Der erste Abruf ohne Cache und der nächste Abruf in einem Browser, der einen Cache von vor dieser Änderung hat, holen jedes Gewicht, das Google Health hat (hier: ab Ende 2015). Bis dieser Abruf gelungen ist, zeigt die Seite, was der Cache schon hat, und jeder weitere Abruf versucht wieder, alles zu holen; ein fehlgeschlagener Abruf lässt den Cache, wie er war. Während des Abrufs zeigt die Statuszeile, was sie bei jedem Abruf zeigt. Danach holt jeder Abruf die letzten 14 Tage oder alles seit dem letzten Abruf, ohne Grenze bei 90 Tagen. „3 Monate“ und „1 Jahr“ zeigen danach auch Messungen, die älter als 90 Tage sind.
- **AC-10** Ohne jede Messung sagt die Seite „Noch keine Messung in Google Health“, ohne „in den letzten 90 Tagen“, und zeigt weder Umschalter noch Pfeile.
- **AC-11** Bei 360 px Breite scrollt nichts seitlich, und Umschalter, Bereich und beide Pfeile stehen sichtbar über dem Graphen. Was bei 360 × 640 px heute ohne Scrollen sichtbar ist, bleibt ohne Scrollen sichtbar.
- **AC-12** Die Beschreibung des Graphen für Screenreader nennt Zeitraum und Bereich, etwa „Messungen und Trend, 1 Jahr, 2026“.
- **AC-13** Hat das gezeigte Fenster keine zählende Messung, steht an Stelle des Graphen „Keine Messung in diesem Zeitraum“; Umschalter, Bereich und Pfeile bleiben.

## Agreed design

Ein Graph wie heute, dessen Zeitraum umschaltbar ist (6 Wochen, 3 Monate, Kalenderjahr) und der sich mit ‹ › in die Vergangenheit verschieben lässt; die Trendlinie trägt in jedem Zeitraum die Ampelfarbe ihres Tages. Die Seite holt einmal die ganze Historie und danach wie bisher.

Specimen: https://claude.ai/artifact/3rVefEQq3a44qSZtzN76HJ, Kopie in `specimens/langzeitansicht.html`. Die Linienfarben dort (`--g-mark`, `--y-mark`, `--r-mark`) erfüllen AC-6.

**Agreed; build to this, do not redesign.**

## Technical decisions

- **Stored formats** Der Cache unter `gewicht:v1` bekommt das Feld `fullHistory`: `true`, sobald ein Abruf alles geholt hat. Fehlt es, wie in jedem Cache von vor dieser Änderung, gilt `false`, und der nächste Abruf holt alles. Sonst bleibt die Form, wie sie ist. Gewählter Zeitraum und Fenster werden nicht gespeichert.
- **Wire formats** Keine neuen. Derselbe Endpunkt von Google Health und derselbe Scope; der erste Abruf reicht bis zum 1.1.2000 zurück.
- **Trust boundaries** Keine neue Eingabe und keine neuen Aufrufe. Die gespeicherten persönlichen Daten wachsen: Jeder angemeldete Browser hält die ganze Gewichtshistorie ab 2015 in `localStorage` statt 90 Tagen. „Abmelden“ löscht sie wie bisher.
- **Dependencies** Keine.

## Nudges

- `sixWeekSeries` (`src/trend/six-week-series.ts`) wird zur Reihe eines Fensters und heißt danach. Die Regel für das Fenster (die drei Zeiträume, ihre Kalendermonate und -jahre, das Verschieben, die Grenzen bei heute und bei der ersten Messung, das Fenster beim Umschalten) liegt an einer Stelle unter `src/trend/`. `UBIQUITOUS_LANGUAGE.md` bekommt die Einträge „Zeitraum“ (`span`: 6 Wochen, 3 Monate, 1 Jahr) und das Fenster (`GraphWindow`, nur im Code: erster und letzter Tag, die der Graph zeigt), und der Eintrag „Abrufzeitraum“ sagt, was AC-9 sagt.
- Die Farbe eines Linienstücks kommt aus `trafficLight` des späteren Tages; die drei Linienfarben stehen neben `TRAFFIC_LIGHT_COLOURS` in `src/app/Verdict.tsx`.
- `WeightGraph` bleibt der eine Graph. Bei „3 Monate“ und „1 Jahr“ werden die Tagesbeschriftungen zu Monatsnamen in der Mitte jedes Monats, bei „1 Jahr“ im schmalen Layout jeder zweite.
- Das Fenster lebt in `src/app/page.tsx` neben `chosenDay`, nur im Speicher.

## Out of scope

- In Google Health später nachgetragene oder korrigierte Werte, die älter als 14 Tage sind, erreichen die Seite nicht. „Abmelden“ und neu anmelden holt alles neu.
- Werte vor Ende 2015, die nur in der CSV stehen.
- Beschriftete höchste und tiefste Punkte: Sie sind im Graphen zu sehen, und das Wählen eines Tages gibt Datum und Wert.

## Ruled out

- **Die Phasen in Worten** - braucht eine neue Regel mit einer willkürlichen Schwelle, ab wann kurze Strecken zur Nachbarphase zählen.
- **Ein zweiter Graph nur für das Jahr** - im einen Graphen mit umschaltbarem Zeitraum aufgegangen.
- **Farben nur jenseits von 6 Wochen** - der Graph liest sich in jedem Zeitraum gleich, und die sechs Wochen zeigen, wann die Ampel zuletzt wechselte.
- **Den alten Cache verwerfen und unter neuem Schlüssel neu holen** - die Seite zeigte am ersten Morgen nach dem Deploy nur die Seite für den ersten Besuch, bis Anmeldung und großer Abruf durch sind.
- **Ein Zeitraum „Alles“** - die Pfeile reichen bis zur ersten Messung.
- **Gleitende Fenster bis heute für 3 Monate und 1 Jahr** - wer zurückblättert, will Kalenderjahre, nicht 20.10.–20.10.
- **Kalenderquartale für 3 Monate** - am Anfang eines Quartals ist das Fenster fast leer.
- **Ältere Zeiträume erst beim Zurückblättern holen** - Ladezustand und Anmeldung mitten im Blättern für wenig Gewinn.
- **Eine feste Grenze beim Abruf, etwa 2 Jahre** - reicht nicht für Jahre.
- **Den Zeitraum zwischen Besuchen merken** - die Seite ist für den Blick am Morgen; ein offenes Jahr vom Vorabend stünde im Weg.
- **Jeder Weg zurück zu heute verschiebt auch das Fenster** - ein versehentliches Escape oder Doppeltippen würde zehn Jahre Zurückblättern verwerfen.
- **Ein eigener Knopf „Heute“ neben den Pfeilen** - eng bei 360 px; „Zurück zu heute“ reicht.
