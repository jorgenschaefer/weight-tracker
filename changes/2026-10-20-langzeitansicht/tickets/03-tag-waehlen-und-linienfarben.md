---
criteria:  CRITERIA.md
closes:    AC-5, AC-6, AC-7, AC-8
advances:  
after:     02-fenster-verschieben
status:    done
attempts:  1
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

**Review findings not fixed:**
- Should-fix (round 2): in a window without a measurement („Keine Messung in diesem Zeitraum“, reachable with ‹ across a gap of 42 days or more), ← → cannot step from a chosen day, as there is no graph to take the keys or the focus (`WeightGraph.tsx`, the empty state from 02). Not fixed: a focusable message that takes ← → is behaviour the criteria do not settle, i.e. what it says and announces and where its focus ring goes. ‹ › and the toggle still lead out of such a window. The test data has no such gap; with the whole history (04) it becomes reachable, so the developer should decide.
- Nit (round 2): `TRAFFIC_LIGHT_COLOURS`, now exported, and the new `TRAFFIC_LIGHT_LINE_COLOURS` sit past the first 60 lines of `src/app/Verdict.tsx`, beside `NEUTRAL` and `surfaceColours`, which were already there. Kept, because the nudge places the line colours beside the surface colours.

**Fixed after the last review:** none. The round-1 blocker (a cancelled press restored a kept day out of the window through `onChooseDay`, and so moved the window) was fixed before round 2. ← → now report to their own `onStepToDay`, and only that moves the window. Round 2 reviewed it in the code.

**Checks not run:** round 2 drove no browser, as its session had no browser tool. So the fix above was not driven in the real page; a jsdom page test pins it, and that test uses a mouse press, not a finger. Round 1 drove everything below before the fix.

**Criteria parts no automated test proves:**
- AC-5, how the coloured line looks: the joins between runs and the line on each surface. Round 1 drove the page in headless Chromium at 360 × 800 and 1440 × 900 on 20.10. (green), 3.8. (yellow), 5.9. (red) and 29.9. (neutral). The line was continuous at the joins, broken at the gap from 22.9., and plainly visible on every surface. Red on red has the least contrast, which still passes AC-6's 3:1, and a test proves that. On „1 Jahr“ at 360 px, short runs are only a few pixels long.
- AC-7 in the real page: round 1 walked ← → across windows in all three spans, tap and drag (mouse and touch) in earlier windows, and the day kept through ‹ ›, the toggle, Escape and „Zurück zu heute“, before the fix.

**Decisions costly to reverse:**
- `windowHolding(span, graphWindow, day, today)` in `src/trend/graph-window/graph-window.ts` walks ‹ or › from the window shown. It returns `null` for the window up to today, like `laterWindow` and `windowOnSwitch`.
- `WeightGraph` takes `measuredDays`, the days of all counting measurements, for ← →, and reports their choice to `onStepToDay`. Taps, drags, Escape and the cancel restore keep `onChooseDay`, which never moves the window. `page.tsx` moves the window only in `stepToDay`, „Zurück zu heute“ and a saved entry (`showWindowHolding`, `showWindowUpToToday` in `useGraphWindow`).
- The trend line is drawn as one `polyline` per run of stretches under the same Ampel, each run starting on the corner the last one ends on, rather than one per piece between gaps. Tests that count polylines count runs now.
- A trend piece of a single day, between two gaps, is a dot in the colour of its own day's Ampel; AC-5 names only stretches between two days.

**Departures from nudges:** none. The line colours are the specimen's, written in upper case like the surface colours.

**Names not from the glossary, to confirm:** `windowHolding`, `showWindowHolding`, `showWindowUpToToday`, `stepToDay` / `onStepToDay`, `measuredDays`, `TRAFFIC_LIGHT_LINE_COLOURS`, `sameLightRuns`. The glossary entries Ampel, `GraphWindow` and Stand now say what the line colours, ← → and the kept day do.
