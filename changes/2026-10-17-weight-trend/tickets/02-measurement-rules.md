---
criteria:  CRITERIA.md
closes:    
advances:  AC-2, AC-9, AC-18
after:     01-project-setup
status:    ready
attempts:  0
---

## Build
The domain of measurements, as pure functions in `src/measurement/`: the measurement and the counting measurement, the Berlin calendar day of an instant, the rule that only the first measurement of a Berlin calendar day counts, where the gaps between counting measurements lie, reading and writing the cache format, and which period a fetch covers and how its result replaces the cache. Plus the structural check that keeps the domain directories free of browser, React and clock.

## Done when
Toward the ACs below, this ticket makes true, in the domain code and its tests:

- AC-2: from any set of measurements, the counting measurements are exactly the first measurement of each calendar day in Europe/Berlin, also around midnight and across the daylight-saving switches.
- AC-9: the gaps among counting measurements are found - two consecutive days with a counting measurement more than 3 days apart (1st → 5th is a gap) - each with its length in days, that difference (22.9. → 1.10.2026 is a gap of 9 days).
- AC-18: given the cache, the fetched measurements and now, the period to fetch is the last 90 days when there is no valid cache; otherwise the last 14 days, or everything since the last fetch when that lies further back, at most 90 days. The fetched measurements of that period replace the cache's for it, so corrected measurements are corrected and deleted ones gone, and older cached measurements stay unchanged.

## Toward
> **AC-2** Pro Kalendertag (Europe/Berlin) zählt die erste Messung; spätere Messungen desselben Tages ändern weder Trend, Tempo noch Urteil noch den angezeigten Wert „Gemessen“.

> **AC-9** Nach einer Lücke zeigt die Seite, bis wieder 5 zählende Messungen nach der Lücke vorliegen, statt des Urteils den Vergleich „Nach N Tagen ohne Messung: ±x kg gegenüber vorher“. Verglichen wird der Median der zählenden Messungen nach der Lücke mit dem Trend am letzten Tag vor der Lücke. „Deutlich mehr als die normale Schwankung“ steht dabei, wenn der Betrag des Unterschieds größer ist als 2 · s / √n, mit s als Streuung der zählenden Messungen um den Trend in den 4 Wochen vor der Lücke und n als Zahl der zählenden Messungen nach der Lücke; sonst „im Rahmen der normalen Schwankung“. Eine deutliche Zunahme ist orange hervorgehoben, alles andere neutral. Ab der 5. Messung gilt wieder das Urteil aus AC-3 bis AC-5.

> **AC-18** Beim ersten Abruf holt die Seite die Messungen der letzten 90 Tage. Jeder weitere Abruf holt die letzten 14 Tage vollständig neu, oder alles seit dem letzten Abruf, wenn dieser länger zurückliegt, höchstens aber 90 Tage, und ersetzt damit den Cache für diesen Zeitraum; in Google Health korrigierte oder gelöschte Messungen dieses Zeitraums sind danach korrigiert bzw. verschwunden. Ältere Messungen im Cache bleiben unverändert.

## Technical decisions
> **Stored formats** Cache im `localStorage` des Browsers unter dem versionierten Schlüssel `gewicht:v1`: `{ "fetchedAt": "<ISO-Zeit>", "measurements": [{ "time": "<ISO-Zeit>", "kg": <Zahl> }] }` mit allen rohen Messungen der abgerufenen Zeiträume; die Regel „erste Messung pro Tag“ wendet erst der Code an. Bei fehlendem, unlesbarem oder anders versioniertem Eintrag wird er verworfen und neu geladen. Das Zugriffstoken wird nicht gespeichert. Nichts wird auf dem Server gespeichert; es gibt keine bestehenden Daten zu überführen.

> **Wire formats** Die Seite bietet nach außen keine Schnittstelle. Sie liest den Gewichts-Endpunkt der Google Health API. Die OAuth-Client-ID kommt zur Build-Zeit als `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. Der Container ist als `gewicht` im `service_network` auf Port 3000 erreichbar. Zu dieser Änderung gehört im Repo `~/Projects/infrastructure`: ein Site-Block `gewicht.jorgenschaefer.de` in `hosts/jorgenschaefer/Caddyfile` mit `import security` und `reverse_proxy gewicht:3000`, der Eintrag in `bin/check-redirects`, und vor dem Deployment ein DNS-Eintrag für `gewicht.jorgenschaefer.de` auf den Host (README dort, Abschnitt zu neuen Sites).

> **Trust boundaries** Anmeldung über den Token-Client von Google Identity Services im Browser, ausgelöst durch den Klick auf „Daten abrufen“, mit nur dem Lese-Scope für Health Metrics & Measurements der Google Health API (`https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly`, am 17.10.2026 am echten Konto bestätigt). Das Zugriffstoken liegt nur im Arbeitsspeicher. Gesundheitsdaten werden nur im `localStorage` der eigenen Geräte zwischengespeichert. Ausgehende Aufrufe nur an Google (Identity Services, Health API); Schriften werden mit der App ausgeliefert (`next/font`), nicht zur Laufzeit von Google Fonts geladen. Die App sendet selbst `Cross-Origin-Opener-Policy: same-origin-allow-popups`, weil die Vorgabe `same-origin` aus `caddy/snippets.caddy` das Anmelde-Popup bricht; sendet sie eine eigene Content-Security-Policy, muss diese Google Identity Services zulassen. Das OAuth-Projekt liegt im eigenen Google-Konto; erlaubte JavaScript-Herkünfte sind `https://gewicht.jorgenschaefer.de` und `http://localhost:3000`. Keine Secrets: die Client-ID ist öffentlich.

> **Dependencies** next 16.4.2, react und react-dom 19.3.1, @mantine/core und @mantine/hooks 9.7.2, postcss 8.5.30, postcss-preset-mantine 1.18.0, postcss-simple-vars 7.0.1, typescript 7.0.2, @biomejs/biome 2.5.15, vitest 5.0.5, @vitejs/plugin-react 6.1.2, jsdom 30.1.3, @testing-library/react 16.3.3, @testing-library/dom 10.4.2, @testing-library/jest-dom 7.0.1, @testing-library/user-event 14.6.8, die passenden `@types/*`-Pakete, Node LTS im Docker-Image; das Google-Identity-Services-Skript von Google; keine Chart-Bibliothek, kein Tailwind. Dienst: Google Health API.

## Nudges
> Feature-Module nach `UBIQUITOUS_LANGUAGE.md`: `src/measurement/` (Abruf von Google Health, Cache, erste Messung pro Berliner Kalendertag), `src/trend/` (robuster Trend und Steigung, Tempo mit fünf Stufen), `src/verdict/` (Urteil: Schwelle 0,2 kg/Woche, 3 Tage Bestätigung, Stufen 3/7/14; Lücke: mehr als 3 Tage, Vergleich bis zur 5. Messung), `src/app/` für die Seite. Jede dieser Regeln hat genau einen Ort, benannt nach ihr (etwa `src/verdict/verdict.ts`, `src/verdict/gap.ts`, `src/trend/pace.ts`).

> Die Logik in `src/measurement/` (außer dem Google-Zugriff), `src/trend/` und `src/verdict/` besteht aus reinen Funktionen ohne Browser- oder React-Bezug; „heute“ wird als Parameter übergeben, die Uhr liest nur die UI. So läuft sie später unverändert auf einem Server.

> Nur ein Modul in `src/measurement/` spricht mit Google; es liefert Messungen oder einen typisierten Fehler, den die UI anzeigt.

> Tests wie in `einsatz`: neben dem Code (`*.test.ts`), eine Testdatei je Quelldatei. Fixture `src/test/fixtures/gewicht-2026-07-bis-10.csv` ist der Auszug 1.7.–17.10.2026 aus `~/Projects/patientenakte-jorgen/unterlagen/gewicht.csv` im Format `datum,kg` (ein Wert pro Tag, ohne Uhrzeit). Fälle mit mehreren Messungen pro Tag (AC-2), Uhrzeiten und dem künstlichen Ausreißer (AC-6) sind künstliche Testdaten.

> Code und Bezeichner auf Englisch nach `UBIQUITOUS_LANGUAGE.md`, Texte auf der Seite auf Deutsch.

> Bei technisch verschiedenen Optionen mit ähnlichem Aufwand die wählen, die den späteren Server (`changes/backlog/server-mit-webhook.md`) besser vorbereitet.

## Context
Ticket 01 left a Next.js app with the check command and a placeholder page; no domain code exists.

**What `src/measurement/` provides to the others.** Tickets 03, 04 and 05 build on it and do not re-implement any of it:
- the measurement as a domain object (the instant it was taken, kg) and the counting measurement (glossary: `countingMeasurement`), carrying its Berlin calendar day;
- the conversion of an instant into its Berlin calendar day, which ticket 05 also uses to turn the clock into "today";
- the counting rule;
- gap detection: where among the counting measurements a gap lies and how long it is, as the glossary defines `gap`. Ticket 04 breaks the trend line at gaps and ticket 07 compares across them; both use this and neither finds gaps itself. The nudge places the gap rule in `src/verdict/`; it lives here instead because `src/trend/` needs it too and must not import from `src/verdict/`. Record that departure under `## Left standing`.
- the cache format: turning the stored value into measurements and back, per the Stored formats decision above, with a missing, unreadable or differently versioned entry reported as "no valid cache";
- the fetch period rule and the replacement of the cache's period with the fetched measurements. "Now" is a parameter.

The cache keeps all raw measurements; the counting rule is applied in code, on reading. Ticket 03 adds the thin adapter that touches `localStorage`, under `src/app/`, and the Google module in `src/measurement/`.

**Structural check.** This ticket introduces the first domain directory, and with it the check, run by the check command, that holds the boundary: code in `src/measurement/` uses no React, Next.js or browser API and does not read the clock - the one exception being the Google module, which ticket 03 adds and names in the check; no domain directory imports from `src/app/`; the domain directories import only downwards - `src/verdict/` may import `src/trend/` and `src/measurement/`, `src/trend/` only `src/measurement/`, and `src/measurement/` neither (this order governs imports among `src/measurement/`, `src/trend/`, `src/verdict/` and `src/app/` only; tests anywhere may import from `src/test/`); the clock is read only under `src/app/`. Ticket 04 adds `src/trend/` and ticket 07 `src/verdict/` to the same check.

## Not here
- Google, `localStorage`, the page: ticket 03.
- Trend and pace: ticket 04. Verdict: ticket 07.
- From `CRITERIA.md`'s out of scope:
- Server, Webhook, serverseitiger Cache, Anmeldung ohne Klick bei jedem Besuch (`changes/backlog/server-mit-webhook.md`).
- Mehrere Nutzer; Import der alten CSV-Historie.

## Left standing
