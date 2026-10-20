---
criteria:  CRITERIA.md
closes:    AC-3, AC-4, AC-11, AC-12, AC-13
advances:  AC-5, AC-10
after:     01-zeitraum
status:    ready
attempts:  0
---

## Build
Neben dem Umschalter der Bereich und ‹ ›, die das Fenster bis zur ersten zählenden Messung zurück und wieder bis heute verschieben; ein Fenster ohne zählende Messung zeigt „Keine Messung in diesem Zeitraum“.

## Done when
> **AC-3** ‹ und › verschieben das Fenster um einen ganzen Zeitraum: 42 Tage, drei Kalendermonate oder ein Kalenderjahr. › ist gesperrt, solange das Fenster heute enthält. Würde › ein Fenster ergeben, das heute enthält, zeigt die Seite das Fenster bis heute: bei „6 Wochen“ die 42 Tage, die mit heute enden, bei „3 Monate“ die drei Kalendermonate, die mit dem laufenden enden, bei „1 Jahr“ das laufende Kalenderjahr; so endet das 6-Wochen-Fenster nie nach heute. ‹ ist gesperrt, sobald das Fenster am Tag der ersten zählenden Messung oder davor beginnt. Beim Umschalten nimmt die Seite den letzten Tag des alten Fensters, oder heute, wo dieser Tag in der Zukunft liegt, und zeigt bei „6 Wochen“ die 42 Tage, die an ihm enden, bei „3 Monate“ die drei Kalendermonate, die mit seinem Monat enden, und bei „1 Jahr“ sein Kalenderjahr.

> **AC-4** Neben den Pfeilen steht der Bereich des Fensters: bei „6 Wochen“ „Bis heute“, sonst erster und letzter Tag mit zweistelligem Jahr, „8.9.26 – 19.10.26“; bei „3 Monate“ „Aug – Okt 2026“, über einen Jahreswechsel „Nov 2025 – Jan 2026“; bei „1 Jahr“ „2026“.

> **AC-11** Bei 360 px Breite scrollt nichts seitlich, und Umschalter, Bereich und beide Pfeile stehen sichtbar über dem Graphen. Was bei 360 × 640 px heute ohne Scrollen sichtbar ist, bleibt ohne Scrollen sichtbar.

> **AC-12** Die Beschreibung des Graphen für Screenreader nennt Zeitraum und Bereich, etwa „Messungen und Trend, 1 Jahr, 2026“.

> **AC-13** Hat das gezeigte Fenster keine zählende Messung, steht an Stelle des Graphen „Keine Messung in diesem Zeitraum“; Umschalter, Bereich und Pfeile bleiben.

Von AC-5: Die letzte Messung ist nur im Fenster markiert, das sie enthält.

Von AC-10: Ohne jede Messung zeigt die Seite keine Pfeile.

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
01 hat `Span`, `GraphWindow`, die Regel für das Fenster unter `src/trend/`, den Umschalter und das Fenster bis heute in `page.tsx` gebaut; das Verschieben und die Grenzen kommen in dieselbe Regel. Das `aria-label` von `WeightGraph` sagt heute „Messungen und Trend der letzten sechs Wochen“.

Vereinbart ist das Aussehen im Specimen `changes/2026-10-20-langzeitansicht/specimens/langzeitansicht.html`: unter dem Umschalter eine Zeile mit dem Bereich links und ‹ › rechts.

`WeightGraph` markiert heute den letzten Punkt der gezeigten Reihe als letzte Messung. Die Markierung gehört nur der letzten zählenden Messung überhaupt, also nur dem Fenster, das sie enthält.

## Not here
Was ← →, „Zurück zu heute“, Eintragen und die übrigen Wege zurück zu heute mit dem Fenster tun, und dass ein gewählter Tag beim Umschalten und Verschieben gewählt bleibt (AC-7, AC-8), baut 03, ebenso die Farben der Trendlinie.

Aus `Out of scope`: Beschriftete höchste und tiefste Punkte: Sie sind im Graphen zu sehen, und das Wählen eines Tages gibt Datum und Wert.

## Left standing
