---
criteria:  CRITERIA.md
closes:    
advances:  AC-2, AC-10, AC-11, AC-12
after:     02-measurement-rules
status:    ready
attempts:  0
---

## Build
The trend as pure functions in `src/trend/`: the robust trend of each day and its slope per week, the pace over 4 weeks with its five bands, outliers, and the 6-week series of trend and counting measurements. With the test data from the real history and the one helper that turns it into measurements.

## Done when
Toward the ACs below, this ticket makes true, in the domain code and its tests, with nothing on the page yet:

- AC-2: trend and pace are computed from counting measurements only; a later measurement of the same day changes neither.
- AC-10: the pace over 4 weeks in kg per week and its band, with the boundaries AC-10 gives.
- AC-11: the trend (kg) and the 4-week pace are available; no other pace is.
- AC-12: the trend of each day over the last 6 weeks, broken at gaps, and which counting measurements are outliers (more than 0.9 kg from their day's trend).

## Toward
> **AC-2** Pro Kalendertag (Europe/Berlin) zählt die erste Messung; spätere Messungen desselben Tages ändern weder Trend, Tempo noch Urteil noch den angezeigten Wert „Gemessen“.

> **AC-10** Unter dem Urteil steht das Tempo der letzten 4 Wochen in kg pro Woche mit genau einer Stufe: „Zunahme“ (über +0,1), „Gewicht gehalten“ (von −0,1 bis +0,1 einschließlich), „Langsames Abnehmen“ (unter −0,1 bis −0,5 einschließlich), „Moderates Abnehmen“ (unter −0,5 bis −1,0 einschließlich), „Schnelles Abnehmen“ (unter −1,0).

> **AC-11** Die Seite zeigt die Zahlen Trend (kg), Gemessen (die zählende Messung des letzten Tages mit Messung, kg) und Tempo (4 Wochen, kg pro Woche, derselbe Wert wie in AC-10). Eine weitere Tempo-Zahl, etwa über 14 Tage, zeigt sie nicht.

> **AC-12** Der Graph zeigt die letzten 6 Wochen: zählende Messungen als Punkte, den Trend als Linie. Messungen, die mehr als 0,9 kg vom Trend ihres Tages abweichen, sind sichtbar anders markiert als die übrigen Punkte.

## Technical decisions
> **Stored formats** Cache im `localStorage` des Browsers unter dem versionierten Schlüssel `gewicht:v1`: `{ "fetchedAt": "<ISO-Zeit>", "measurements": [{ "time": "<ISO-Zeit>", "kg": <Zahl> }] }` mit allen rohen Messungen der abgerufenen Zeiträume; die Regel „erste Messung pro Tag“ wendet erst der Code an. Bei fehlendem, unlesbarem oder anders versioniertem Eintrag wird er verworfen und neu geladen. Das Zugriffstoken wird nicht gespeichert. Nichts wird auf dem Server gespeichert; es gibt keine bestehenden Daten zu überführen.

> **Wire formats** Die Seite bietet nach außen keine Schnittstelle. Sie liest den Gewichts-Endpunkt der Google Health API. Die OAuth-Client-ID kommt zur Build-Zeit als `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. Der Container ist als `gewicht` im `service_network` auf Port 3000 erreichbar. Zu dieser Änderung gehört im Repo `~/Projects/infrastructure`: ein Site-Block `gewicht.jorgenschaefer.de` in `hosts/jorgenschaefer/Caddyfile` mit `import security` und `reverse_proxy gewicht:3000`, der Eintrag in `bin/check-redirects`, und vor dem Deployment ein DNS-Eintrag für `gewicht.jorgenschaefer.de` auf den Host (README dort, Abschnitt zu neuen Sites).

> **Trust boundaries** Anmeldung über den Token-Client von Google Identity Services im Browser, ausgelöst durch den Klick auf „Daten abrufen“, mit nur dem Lese-Scope für Health Metrics & Measurements der Google Health API (`https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly`, am 17.10.2026 am echten Konto bestätigt). Das Zugriffstoken liegt nur im Arbeitsspeicher. Gesundheitsdaten werden nur im `localStorage` der eigenen Geräte zwischengespeichert. Ausgehende Aufrufe nur an Google (Identity Services, Health API); Schriften werden mit der App ausgeliefert (`next/font`), nicht zur Laufzeit von Google Fonts geladen. Die App sendet selbst `Cross-Origin-Opener-Policy: same-origin-allow-popups`, weil die Vorgabe `same-origin` aus `caddy/snippets.caddy` das Anmelde-Popup bricht; sendet sie eine eigene Content-Security-Policy, muss diese Google Identity Services zulassen. Das OAuth-Projekt liegt im eigenen Google-Konto; erlaubte JavaScript-Herkünfte sind `https://gewicht.jorgenschaefer.de` und `http://localhost:3000`. Keine Secrets: die Client-ID ist öffentlich.

> **Dependencies** next 16.4.2, react und react-dom 19.3.1, @mantine/core und @mantine/hooks 9.7.2, postcss 8.5.30, postcss-preset-mantine 1.18.0, postcss-simple-vars 7.0.1, typescript 7.0.2, @biomejs/biome 2.5.15, vitest 5.0.5, @vitejs/plugin-react 6.1.2, jsdom 30.1.3, @testing-library/react 16.3.3, @testing-library/dom 10.4.2, @testing-library/jest-dom 7.0.1, @testing-library/user-event 14.6.8, die passenden `@types/*`-Pakete, Node LTS im Docker-Image; das Google-Identity-Services-Skript von Google; keine Chart-Bibliothek, kein Tailwind. Dienst: Google Health API.

## Nudges
> Feature-Module nach `UBIQUITOUS_LANGUAGE.md`: `src/measurement/` (Abruf von Google Health, Cache, erste Messung pro Berliner Kalendertag), `src/trend/` (robuster Trend und Steigung, Tempo mit fünf Stufen), `src/verdict/` (Urteil: Schwelle 0,2 kg/Woche, 3 Tage Bestätigung, Stufen 3/7/14; Lücke: mehr als 3 Tage, Vergleich bis zur 5. Messung), `src/app/` für die Seite. Jede dieser Regeln hat genau einen Ort, benannt nach ihr (etwa `src/verdict/verdict.ts`, `src/verdict/gap.ts`, `src/trend/pace.ts`).

> Die Logik in `src/measurement/` (außer dem Google-Zugriff), `src/trend/` und `src/verdict/` besteht aus reinen Funktionen ohne Browser- oder React-Bezug; „heute“ wird als Parameter übergeben, die Uhr liest nur die UI. So läuft sie später unverändert auf einem Server.

> Startpunkt für den Trend ist der Ansatz des Musters (Theil-Sen über 14 Tage, Niveau als Median der Projektionen); der Build darf davon abweichen, solange die ACs halten.

> Tests wie in `einsatz`: neben dem Code (`*.test.ts`), eine Testdatei je Quelldatei. Fixture `src/test/fixtures/gewicht-2026-07-bis-10.csv` ist der Auszug 1.7.–17.10.2026 aus `~/Projects/patientenakte-jorgen/unterlagen/gewicht.csv` im Format `datum,kg` (ein Wert pro Tag, ohne Uhrzeit). Fälle mit mehreren Messungen pro Tag (AC-2), Uhrzeiten und dem künstlichen Ausreißer (AC-6) sind künstliche Testdaten.

> Code und Bezeichner auf Englisch nach `UBIQUITOUS_LANGUAGE.md`, Texte auf der Seite auf Deutsch.

> Bei technisch verschiedenen Optionen mit ähnlichem Aufwand die wählen, die den späteren Server (`changes/backlog/server-mit-webhook.md`) besser vorbereitet.

## Context
**Input.** Counting measurements and the conversion to Berlin calendar days come from `src/measurement/` (ticket 02); use them, do not re-implement them. "Today" is a Berlin calendar day passed in; nothing here reads the clock.

**Home.** `src/trend/`: trend and slope, pace and its band, outliers - each rule in one file named after it. Names from the glossary: `trend`, `pace`, `paceBand`, `outlier`, `gap`, `countingMeasurement`. Add the directory to the structural check ticket 02 introduced: no React, Next.js, browser API or clock, and the import order 02 fixed.

**What others build on.** Ticket 07 (the verdict, in `src/verdict/`) uses the trend and slope of each day and the trend on a given day; ticket 06 draws the graph from the 6-week series; ticket 05 shows trend and pace with its band through ticket 07's result. None of them recompute a trend. The shape is this ticket's.

**Gap.** The trend line in the series breaks at every gap. Where gaps lie comes from ticket 02's gap detection in `src/measurement/`; do not find gaps here. The fixture has one: 22.9. → 1.10.2026. Whether a slope counts as falling (faster than 0.2 kg per week) is the verdict's rule, ticket 07's; this ticket provides the slope.

**Starting point for the trend**, as the specimen computes it (script in `changes/2026-10-17-weight-trend/specimens/``Main.dc.html`): for each day with a counting measurement, take the counting measurements of the last 14 days; with at least 5 of them, the slope is the Theil-Sen median of pairwise slopes, the trend is the median of the measurements projected to that day (ticket 07 counts the day as falling if slope · 7 < −0.2); the pace is the trend difference to the last day with a trend at least 28 days earlier, per week. The build may depart from this as long as the ACs hold - ticket 07's AC-6 and AC-7 rest on it too. The page's sentence „Ein Urteil gibt es ab der 5. Messung.“ (AC-23) assumes the minimum of 5; record any other minimum under `## Left standing`.

**Fixture.** `src/test/fixtures/gewicht-2026-07-bis-10.csv` is in the repository: the extract 1.7.–17.10.2026 (97 rows) of the user's weight history, in the format `datum,kg`, one value per day, no time. Use it as it is; its source lies outside the repository and is not read. This ticket writes the one helper that turns its rows into measurements, `src/test/weight-history-fixture.ts`; tickets 05, 06 and 07 reuse it rather than writing their own. Times, several measurements a day and artificial outliers are made-up test data. It is test data only, not imported history.

**Ruled out** in `CRITERIA.md`, and not to be reintroduced here:
- **Tempo-Ampel über 14 Tage als einziges Signal** - bei ±0,5 kg Tagesschwankung liegt die Unsicherheit über 14 Tage bei ±0,47 kg/Woche, die Stufen würden springen.

## Not here
- The verdict, its levels, the gap comparison, the too-old and no-verdict cases: ticket 07.
- Anything rendered: ticket 05, and the graph ticket 06.
- From `CRITERIA.md`'s out of scope:
- Die Phase „Gewicht halten“ und das Erkennen langsamer Drift über Monate (`changes/backlog/erhaltungsphase.md`).
- Zeiträume über 90 Tage im Graphen (`changes/backlog/langzeitansicht.md`).

## Left standing
