---
criteria:  CRITERIA.md
closes:    AC-1, AC-2
advances:  AC-5, AC-10
after:     
status:    done
attempts:  1
---

## Build
Über dem Graphen der Umschalter „6 Wochen“ / „3 Monate“ / „1 Jahr“; der Graph zeigt das Fenster des gewählten Zeitraums bis heute, mit der Linie für heute und Monatsnamen als Beschriftung.

## Done when
> **AC-1** Über dem Graphen steht ein Umschalter „6 Wochen“ / „3 Monate“ / „1 Jahr“. Der Graph zeigt das Fenster des gewählten Zeitraums: bei „6 Wochen“ 42 Tage bis einschließlich seines letzten Tages (bis heute ist das der Graph von heute), bei „3 Monate“ drei Kalendermonate vom 1. des ersten bis zum letzten Tag des dritten (bis heute: der laufende Monat und die zwei davor), bei „1 Jahr“ ein Kalenderjahr vom 1.1. bis 31.12. Tage nach heute bleiben rechts leer; reicht das Fenster über heute hinaus, markiert eine senkrechte Linie heute.

> **AC-2** Beim Öffnen und beim Neuladen zeigt die Seite „6 Wochen“ bis heute. Ein Fenster, das heute enthält, ist auch nach einem Tageswechsel das Fenster bis heute (AC-3).

Von AC-5: In jedem Zeitraum zeigt der Graph die zählenden Messungen als Punkte und den Trend als Linie mit seinem Band, an Lücken unterbrochen, Ausreißer und die letzte Messung markiert wie heute; die Linie noch in einer Farbe wie heute.

Von AC-10: Ohne jede Messung zeigt die Seite keinen Umschalter.

## Toward
> **AC-5** In jedem Zeitraum zeigt der Graph die zählenden Messungen als Punkte und den Trend als Linie mit seinem Band, an Lücken unterbrochen, Ausreißer und die letzte Messung markiert wie heute; die letzte Messung nur im Fenster, das sie enthält, anders als im Specimen, das in jedem Fenster dessen letzte Messung markiert. Jedes Stück der Trendlinie zwischen zwei Tagen mit Messung hat die Farbe der Ampel des späteren Tages: grün, gelb oder rot.

> **AC-10** Ohne jede Messung sagt die Seite „Noch keine Messung in Google Health“, ohne „in den letzten 90 Tagen“, und zeigt weder Umschalter noch Pfeile.

## Technical decisions
> **Stored formats** Der Cache unter `gewicht:v1` bekommt das Feld `fullHistory`: `true`, sobald ein Abruf alles geholt hat. Fehlt es, wie in jedem Cache von vor dieser Änderung, gilt `false`, und der nächste Abruf holt alles. Sonst bleibt die Form, wie sie ist. Gewählter Zeitraum und Fenster werden nicht gespeichert.

> **Wire formats** Keine neuen. Derselbe Endpunkt von Google Health und derselbe Scope; der erste Abruf reicht bis zum 1.1.2000 zurück.

> **Trust boundaries** Keine neue Eingabe und keine neuen Aufrufe. Die gespeicherten persönlichen Daten wachsen: Jeder angemeldete Browser hält die ganze Gewichtshistorie ab 2015 in `localStorage` statt 90 Tagen. „Abmelden“ löscht sie wie bisher.

> **Dependencies** Keine.

## Nudges
> `sixWeekSeries` (`src/trend/six-week-series.ts`) wird zur Reihe eines Fensters und heißt danach. Die Regel für das Fenster (die drei Zeiträume, ihre Kalendermonate und -jahre, das Verschieben, die Grenzen bei heute und bei der ersten Messung, das Fenster beim Umschalten) liegt an einer Stelle unter `src/trend/`. `UBIQUITOUS_LANGUAGE.md` bekommt die Einträge „Zeitraum“ (`span`: 6 Wochen, 3 Monate, 1 Jahr) und das Fenster (`GraphWindow`, nur im Code: erster und letzter Tag, die der Graph zeigt), und der Eintrag „Abrufzeitraum“ sagt, was AC-9 sagt.

> `WeightGraph` bleibt der eine Graph. Bei „3 Monate“ und „1 Jahr“ werden die Tagesbeschriftungen zu Monatsnamen in der Mitte jedes Monats, bei „1 Jahr“ im schmalen Layout jeder zweite.

> Das Fenster lebt in `src/app/page.tsx` neben `chosenDay`, nur im Speicher.

## Context
Heute schneidet `sixWeekSeries` (`src/trend/six-week-series.ts`) die 42 Tage bis `today` aus den Trends aller zählenden Messungen; `assess` (`src/verdict/assessment.ts`) rechnet die Reihe mit und gibt sie als `sixWeekSeries` weiter, und `page.tsx` reicht `assessmentToday.sixWeekSeries` an `WeightGraph`. `WeightGraph` ist überall auf 42 Tage bis `today` gebaut: `chartScale` mit `SPAN_DAYS`, die Tagesbeschriftungen alle `daysPerLabel` Tage. Ohne Messung in der Reihe zeichnet er nichts; `.graph` in `page.module.css` hält ihm den Platz. Heute liest `useToday` in `page.tsx` neu, wenn die Seite in den Vordergrund kommt.

Vereinbart ist das Aussehen im Specimen `changes/2026-10-20-langzeitansicht/specimens/langzeitansicht.html`: der Umschalter, die gestrichelte Linie für heute und die Monatsnamen. Die Zeile mit Bereich und ‹ › darunter baut 02, die Linienfarben 03.

Diese Namen nehmen die späteren Tickets auf: `Span` für den Zeitraum, `GraphWindow` für das Fenster (erster und letzter Tag) und die Regel für das Fenster an einer Stelle unter `src/trend/`; die Reihe eines Fensters heißt `windowSeries`. Im Glossar trägt dieses Ticket „Zeitraum“ und das Fenster ein; „Abrufzeitraum“ schreibt 04 neu.

## Not here
‹ ›, den Bereich, das leere Fenster, die Beschreibung für Screenreader und das Layout bei 360 px baut 02. Was ein gewählter Tag mit dem Fenster tut (AC-7, AC-8) und die Farben der Trendlinie (AC-5, AC-6) baut 03. Den Abruf der ganzen Historie und den Satz „Noch keine Messung in Google Health“ ohne „in den letzten 90 Tagen“ baut 04.

Aus `Out of scope`: Beschriftete höchste und tiefste Punkte: Sie sind im Graphen zu sehen, und das Wählen eines Tages gibt Datum und Wert.

## Left standing

**Review findings not fixed:** none. Two review rounds; the second came back with nits only, all fixed (below).

**Fixed after the last review** (no reviewer saw these; `npm run check` green afterwards, 1050 tests):
- README's graph line now says „this month and the two before, or this calendar year“ rather than reading as rolling periods (nit 1, round 2).
- `pointCount`'s doc comment in `src/app/page.test.tsx` says it returns a count (nit 2, round 2).
- The graph's accessible name in `src/app/page.test.tsx` is one module-level `GRAPH`, not two copies, so 02 changes it in one place (nit 3, round 2).
- Doc comment of `windowSeries` re-wrapped to 80 columns (nit 4, round 2).

**Criteria parts no automated test proves:** the look of the toggle (pill in the text colour, chosen span filled), the dashed line for today and the month names against the specimen, and the 12 px between toggle and graph (`.graph` in `page.module.css`) — jsdom lays nothing out. The first reviewer drove the page (run skill, headless Chrome) on 20.10. at 360 px and 1400 px and on 30.8. at 360 px, in all three spans, with the keyboard and without measurements: as asked, nothing scrolls sideways, no console errors.

**Decisions costly to reverse:**
- `Span = "sixWeeks" | "threeMonths" | "oneYear"` and `GraphWindow { firstDay; lastDay }` (both days included) in `src/trend/graph-window/graph-window.ts`, with `windowUpTo(span, today)`; `windowSeries(counting, graphWindow)` in `src/trend/graph-window/window-series.ts`. 02 and 03 build on these.
- `assess` no longer carries the series (`Assessment.sixWeekSeries` is gone); the page computes `windowSeries` itself for the window shown.
- `WeightGraph` takes `span`, `graphWindow` and `today`; its labels are chosen by `span`, its x scale runs from `graphWindow.firstDay` to `lastDay`.

**Departures from nudges:**
- „Das Fenster lebt in `src/app/page.tsx` neben `chosenDay`“: the *span* lives there (`useState`), and the window is derived as `windowUpTo(span, today)` on every render. Nothing in this ticket moves the window off today, and deriving it is what makes AC-2's day change hold with no extra code. 02, which adds ‹ ›, has to hold a shifted window there, and AC-2's rule then has to survive in it.
- „Die Regel für das Fenster … liegt an einer Stelle unter `src/trend/`“: it lies in the subdirectory `src/trend/graph-window/`, since the window and its series are one feature of two source files.
- The parameter and prop are named `graphWindow`, not `window`: the structural check (`src/test/domain-boundaries.test.ts`) reads `window` as the browser global.
- Specimen differences kept deliberately („markiert wie heute“): the points keep the 6-week radii in every span (the specimen shrinks them per span), and there are no faint lines at month starts. With the whole history (04), a year of points at 3.5 px radius may want the specimen's smaller marks — for the developer to decide. The line for today stands 3 px right of today's point, as in the specimen.

**Names not from the glossary, to confirm:** `SpanToggle` (the Umschalter, `src/app/SpanToggle.tsx`), `windowUpTo`, the span values `sixWeeks` / `threeMonths` / `oneYear`, `formatMonth` (`src/app/format.ts`), `timeLabels` / `monthLabels` / `dayLabels` and `TODAY_LINE_OFFSET` in `WeightGraph.tsx`. The glossary entries „Zeitraum“ (`span`) and `GraphWindow` were written by this ticket, as the nudge asked; the span values in them are this ticket's choice.
