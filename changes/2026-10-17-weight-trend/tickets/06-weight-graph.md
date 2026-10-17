---
criteria:  CRITERIA.md
closes:    AC-12
advances:  AC-23, AC-24
after:     03-google-health-and-page, 04-trend
status:    ready
attempts:  0
---

## Build
The graph of the last 6 weeks, as a hand-written SVG component of its own: counting measurements as points, outliers as hollow rings, the last day's counting measurement as a larger filled dot, and the trend as a line broken at gaps.

## Done when
> **AC-12** Der Graph zeigt die letzten 6 Wochen: zählende Messungen als Punkte, den Trend als Linie. Messungen, die mehr als 0,9 kg vom Trend ihres Tages abweichen, sind sichtbar anders markiert als die übrigen Punkte.

AC-12 is proven on the rendered graph, with the fixture through ticket 04's helper `src/test/weight-history-fixture.ts`.

Toward the ACs below, this ticket makes true:

- AC-23: without a trend, the graph shows only the points, no trend line.
- AC-24: the graph's date and weight labels are in German format.

## Toward
> **AC-23** Reichen die zählenden Messungen nicht für einen Trend, oder gibt es nach einer Lücke keinen Trend vor der Lücke, zeigt die Seite in den neutralen Farben statt eines Urteils „Noch kein Urteil“ mit dem Satz „Ein Urteil gibt es ab der 5. Messung.“, dazu „Letzte Messung“ und die Zahl Gemessen; die Zahlen Trend und Tempo fehlen, der Graph zeigt nur die Punkte.

> **AC-24** Zahlen und Daten sind deutsch formatiert (99,7 kg, 5.8.).

## Technical decisions
> **Stored formats** Cache im `localStorage` des Browsers unter dem versionierten Schlüssel `gewicht:v1`: `{ "fetchedAt": "<ISO-Zeit>", "measurements": [{ "time": "<ISO-Zeit>", "kg": <Zahl> }] }` mit allen rohen Messungen der abgerufenen Zeiträume; die Regel „erste Messung pro Tag“ wendet erst der Code an. Bei fehlendem, unlesbarem oder anders versioniertem Eintrag wird er verworfen und neu geladen. Das Zugriffstoken wird nicht gespeichert. Nichts wird auf dem Server gespeichert; es gibt keine bestehenden Daten zu überführen.

> **Wire formats** Die Seite bietet nach außen keine Schnittstelle. Sie liest den Gewichts-Endpunkt der Google Health API. Die OAuth-Client-ID kommt zur Build-Zeit als `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. Der Container ist als `gewicht` im `service_network` auf Port 3000 erreichbar. Zu dieser Änderung gehört im Repo `~/Projects/infrastructure`: ein Site-Block `gewicht.jorgenschaefer.de` in `hosts/jorgenschaefer/Caddyfile` mit `import security` und `reverse_proxy gewicht:3000`, der Eintrag in `bin/check-redirects`, und vor dem Deployment ein DNS-Eintrag für `gewicht.jorgenschaefer.de` auf den Host (README dort, Abschnitt zu neuen Sites).

> **Trust boundaries** Anmeldung über den Token-Client von Google Identity Services im Browser, ausgelöst durch den Klick auf „Daten abrufen“, mit nur dem Lese-Scope für Health Metrics & Measurements der Google Health API (`https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly`, am 17.10.2026 am echten Konto bestätigt). Das Zugriffstoken liegt nur im Arbeitsspeicher. Gesundheitsdaten werden nur im `localStorage` der eigenen Geräte zwischengespeichert. Ausgehende Aufrufe nur an Google (Identity Services, Health API); Schriften werden mit der App ausgeliefert (`next/font`), nicht zur Laufzeit von Google Fonts geladen. Die App sendet selbst `Cross-Origin-Opener-Policy: same-origin-allow-popups`, weil die Vorgabe `same-origin` aus `caddy/snippets.caddy` das Anmelde-Popup bricht; sendet sie eine eigene Content-Security-Policy, muss diese Google Identity Services zulassen. Das OAuth-Projekt liegt im eigenen Google-Konto; erlaubte JavaScript-Herkünfte sind `https://gewicht.jorgenschaefer.de` und `http://localhost:3000`. Keine Secrets: die Client-ID ist öffentlich.

> **Dependencies** next 16.4.2, react und react-dom 19.3.1, @mantine/core und @mantine/hooks 9.7.2, postcss 8.5.30, postcss-preset-mantine 1.18.0, postcss-simple-vars 7.0.1, typescript 7.0.2, @biomejs/biome 2.5.15, vitest 5.0.5, @vitejs/plugin-react 6.1.2, jsdom 30.1.3, @testing-library/react 16.3.3, @testing-library/dom 10.4.2, @testing-library/jest-dom 7.0.1, @testing-library/user-event 14.6.8, die passenden `@types/*`-Pakete, Node LTS im Docker-Image; das Google-Identity-Services-Skript von Google; keine Chart-Bibliothek, kein Tailwind. Dienst: Google Health API.

## Nudges
> Feature-Module nach `UBIQUITOUS_LANGUAGE.md`: `src/measurement/` (Abruf von Google Health, Cache, erste Messung pro Berliner Kalendertag), `src/trend/` (robuster Trend und Steigung, Tempo mit fünf Stufen), `src/verdict/` (Urteil: Schwelle 0,2 kg/Woche, 3 Tage Bestätigung, Stufen 3/7/14; Lücke: mehr als 3 Tage, Vergleich bis zur 5. Messung), `src/app/` für die Seite. Jede dieser Regeln hat genau einen Ort, benannt nach ihr (etwa `src/verdict/verdict.ts`, `src/verdict/gap.ts`, `src/trend/pace.ts`).

> Mantine-Komponenten für Knöpfe, Hinweise, Ladeanzeige und Layout; die Urteilsfläche und der Graph (handgeschriebenes SVG) sind eigener Code. Farben, Schrift Archivo (variabel mit Breiten- und Gewichtsachse, über `next/font`) und Aufteilung wie im Muster.

> Tests wie in `einsatz`: neben dem Code (`*.test.ts`), eine Testdatei je Quelldatei. Fixture `src/test/fixtures/gewicht-2026-07-bis-10.csv` ist der Auszug 1.7.–17.10.2026 aus `~/Projects/patientenakte-jorgen/unterlagen/gewicht.csv` im Format `datum,kg` (ein Wert pro Tag, ohne Uhrzeit). Fälle mit mehreren Messungen pro Tag (AC-2), Uhrzeiten und dem künstlichen Ausreißer (AC-6) sind künstliche Testdaten.

> Code und Bezeichner auf Englisch nach `UBIQUITOUS_LANGUAGE.md`, Texte auf der Seite auf Deutsch.

## Context
**Input.** Ticket 04 provides the 6-week series: the trend of each day, broken at gaps, and the counting measurements with their outlier flags (glossary: `outlier`, more than 0.9 kg from the trend of its day). The graph draws that and decides no rule itself. German formatting has its home under `src/app/` (ticket 03); use it.

**Design.** From the agreed design: „Ausreißer sind hohle Ringe, die zählende Messung des letzten Tages ist ein größerer voller Punkt, die Trendlinie ist an Lücken unterbrochen“, all in the surface's text colour, which the graph inherits (the surface colour is ticket 05's). The drawing is in the `buildChart` script and the `.grid`, `.ylab`, `.xlab`, `.trend`, `.dot`, `.dot-out`, `.dot-cur` styles of `changes/2026-10-17-weight-trend/specimens/``Main.dc.html` and `Breit.dc.html`: the trend line 3 px wide, points at 38 % opacity, horizontal grid lines with weight labels, date labels. It fills the width it is given without scrolling horizontally, from 360 px phones to the 960 px wide layout. No chart library.

**Where it goes.** Ticket 05 places it on the page, under the numbers.

## Not here
- Computing the trend or outliers: ticket 04; finding gaps: ticket 02. Placing the graph and colouring the surface: ticket 05.
- From `CRITERIA.md`'s out of scope:
- Zeiträume über 90 Tage im Graphen (`changes/backlog/langzeitansicht.md`).
- Dunkler Modus.

## Left standing
