---
criteria:  CRITERIA.md
closes:    AC-1, AC-2
advances:  AC-5, AC-10
after:     
status:    ready
attempts:  0
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
