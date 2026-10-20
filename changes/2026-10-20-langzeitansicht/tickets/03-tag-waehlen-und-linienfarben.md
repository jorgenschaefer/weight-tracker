---
criteria:  CRITERIA.md
closes:    AC-5, AC-6, AC-7, AC-8
advances:  
after:     02-fenster-verschieben
status:    ready
attempts:  0
---

## Build
Ein gewählter Tag und das Fenster vertragen sich: ← → führen das Fenster mit, ein gewählter Tag bleibt beim Umschalten und Verschieben, und nur „Zurück zu heute“ und Eintragen bringen das Fenster zurück bis heute. Jedes Stück der Trendlinie trägt die Ampelfarbe seines späteren Tages.

## Done when
> **AC-5** In jedem Zeitraum zeigt der Graph die zählenden Messungen als Punkte und den Trend als Linie mit seinem Band, an Lücken unterbrochen, Ausreißer und die letzte Messung markiert wie heute; die letzte Messung nur im Fenster, das sie enthält, anders als im Specimen, das in jedem Fenster dessen letzte Messung markiert. Jedes Stück der Trendlinie zwischen zwei Tagen mit Messung hat die Farbe der Ampel des späteren Tages: grün, gelb oder rot.

> **AC-6** Jede der drei Linienfarben hat gegen jeden der vier Hintergründe der Seite (grün, gelb, rot, neutral) einen Kontrast von mindestens 3:1.

> **AC-7** Tippen und Ziehen wählen in jedem Zeitraum wie heute einen Tag mit Messung im gezeigten Fenster und zeigen die Seite „Stand <Tag>“. ← und → wählen den Tag mit Messung vor und nach dem gewählten Tag (ohne gewählten Tag: vor und nach dem letzten Tag mit Messung, wie heute); liegt er außerhalb des gezeigten Fensters, zeigt der Graph das Fenster, das ‹ oder › so oft wie nötig ergäben und das ihn enthält. Ein gewählter Tag bleibt gewählt, wenn der Zeitraum umgeschaltet oder das Fenster verschoben wird, auch wenn er dabei aus dem Fenster fällt.

> **AC-8** Außer Umschalter, ‹ › und ← → (AC-3, AC-7) verschieben nur „Zurück zu heute“ und das Eintragen eines Gewichts das Fenster: Sie beenden den Stand wie heute und bringen den Graphen zurück zum Fenster des gewählten Zeitraums bis heute: bei „6 Wochen“ die 42 Tage, die mit heute enden, bei „3 Monate“ die drei Kalendermonate, die mit dem laufenden enden, bei „1 Jahr“ das laufende Kalenderjahr. Escape, ein zweites Tippen auf den gewählten Tag, ein fehlgeschlagener Abruf und die Rückkehr der Seite in den Vordergrund beenden den Stand wie heute; das Fenster des Graphen bleibt, wo es ist.

## Technical decisions
> **Stored formats** Der Cache unter `gewicht:v1` bekommt das Feld `fullHistory`: `true`, sobald ein Abruf alles geholt hat. Fehlt es, wie in jedem Cache von vor dieser Änderung, gilt `false`, und der nächste Abruf holt alles. Sonst bleibt die Form, wie sie ist. Gewählter Zeitraum und Fenster werden nicht gespeichert.

> **Wire formats** Keine neuen. Derselbe Endpunkt von Google Health und derselbe Scope; der erste Abruf reicht bis zum 1.1.2000 zurück.

> **Trust boundaries** Keine neue Eingabe und keine neuen Aufrufe. Die gespeicherten persönlichen Daten wachsen: Jeder angemeldete Browser hält die ganze Gewichtshistorie ab 2015 in `localStorage` statt 90 Tagen. „Abmelden“ löscht sie wie bisher.

> **Dependencies** Keine.

## Nudges
> `sixWeekSeries` (`src/trend/six-week-series.ts`) wird zur Reihe eines Fensters und heißt danach. Die Regel für das Fenster (die drei Zeiträume, ihre Kalendermonate und -jahre, das Verschieben, die Grenzen bei heute und bei der ersten Messung, das Fenster beim Umschalten) liegt an einer Stelle unter `src/trend/`. `UBIQUITOUS_LANGUAGE.md` bekommt die Einträge „Zeitraum“ (`span`: 6 Wochen, 3 Monate, 1 Jahr) und das Fenster (`GraphWindow`, nur im Code: erster und letzter Tag, die der Graph zeigt), und der Eintrag „Abrufzeitraum“ sagt, was AC-9 sagt.

> Die Farbe eines Linienstücks kommt aus `trafficLight` des späteren Tages; die drei Linienfarben stehen neben `TRAFFIC_LIGHT_COLOURS` in `src/app/Verdict.tsx`.

> Das Fenster lebt in `src/app/page.tsx` neben `chosenDay`, nur im Speicher.

## Context
01 und 02 haben `Span`, `GraphWindow` und die Regel für das Fenster unter `src/trend/` gebaut und das Fenster in `page.tsx` neben `chosenDay` gelegt; welches Fenster ‹ oder › so oft wie nötig ergäben, um einen Tag zu enthalten, kommt in dieselbe Regel.

Heute wählt `useDayChoice` in `src/app/WeightGraph.tsx` nur unter den Tagen der gezeigten Reihe, und ← → halten an ihrem Rand an. Ohne gewählten Tag nimmt es den letzten Tag der gezeigten Reihe für die Seite von heute; in einem früheren Fenster ist er das nicht. `useChosenDay` in `page.tsx` beendet den Stand bei einem neuen fehlgeschlagenen Abruf und bei der Rückkehr in den Vordergrund; `backToToday` und `enter` dort setzen `chosenDay` auf `null`.

Die Trendlinie zeichnet `WeightGraph` heute als eine `polyline` je Stück zwischen Lücken, in `currentColor`. Die Ampel eines Tages gibt `trafficLight` (`src/verdict/traffic-light.ts`) aus seinem Trend; die Farben der Oberfläche stehen in `TRAFFIC_LIGHT_COLOURS` und `NEUTRAL` in `src/app/Verdict.tsx`. Im Specimen `changes/2026-10-20-langzeitansicht/specimens/langzeitansicht.html` stehen die Linienfarben als `--g-mark: #2e6b34; --y-mark: #7d6200; --r-mark: #9c3a1c`; sie erfüllen AC-6.

Tage wählen und Linienfarben sind zwei Commits.

## Not here
Umschalter, Bereich, ‹ › und das Fenster bis heute bauen 01 und 02, den Abruf der ganzen Historie 04.

Aus `Out of scope`: Beschriftete höchste und tiefste Punkte: Sie sind im Graphen zu sehen, und das Wählen eines Tages gibt Datum und Wert.

## Left standing
