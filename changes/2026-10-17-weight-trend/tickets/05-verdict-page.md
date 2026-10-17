---
criteria:  CRITERIA.md
closes:    AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-13, AC-14, AC-15, AC-16, AC-17, AC-23, AC-24
advances:  
after:     03-google-health-and-page, 06-weight-graph, 07-verdict
status:    ready
attempts:  0
---

## Build
The verdict page: the surface coloured by the verdict and its level, the headline growing wider and heavier with it, the pace band, the three numbers, the gap, too-old and no-verdict states, ticket 06's graph in its place, and the wide layout - shown at once from the cache and marked provisional while a fetch runs.

## Done when
> **AC-2** Pro Kalendertag (Europe/Berlin) zählt die erste Messung; spätere Messungen desselben Tages ändern weder Trend, Tempo noch Urteil noch den angezeigten Wert „Gemessen“.

> **AC-3** Fällt der Trend über die letzten 14 Tage schneller als 0,2 kg pro Woche, lautet das Urteil „Nimmt ab“.

> **AC-4** Fällt der Trend seit 3 oder mehr Tagen nicht mehr schneller als 0,2 kg pro Woche, lautet das Urteil „Seit N Tagen kein Abnehmen“, wobei N die Tage vom letzten Tag mit fallendem Trend bis zum Tag der letzten zählenden Messung sind. Davor bleibt es bei „Nimmt ab“. „Seit 1 Tag“ oder „Seit 2 Tagen kein Abnehmen“ erscheint nie. Gibt es in den vorhandenen Messungen keinen Tag mit fallendem Trend, lautet das Urteil „Seit mindestens N Tagen kein Abnehmen“, mit N als Tagen vom ersten Tag, für den es einen Trend gibt, bis zum Tag der letzten zählenden Messung.

> **AC-5** Das Urteil „kein Abnehmen“ hat drei sichtbar unterscheidbare, mit N zunehmend auffällige Stufen: 3–6 Tage, 7–13 Tage, ab 14 Tagen.

> **AC-6** Fällt der Trend mit 0,5 kg pro Woche oder schneller, ändert ein einzelner abweichender Messwert das Urteil „Nimmt ab“ nicht, egal wie hoch er ist. Geprüft mit dem 12.10.2026 aus den Testdaten und einem künstlichen Fall mit einem Einzelwert 3 kg über dem Trend.

> **AC-7** Mit den Testdaten gilt: spätestens am 8.8.2026 lautet das Urteil „kein Abnehmen“; am 30.8.2026 steht es auf der höchsten Stufe; am 12.10.2026 (Ausreißer 99,7 kg) und am 17.10.2026 lautet es „Nimmt ab“.

> **AC-8** Liegt die letzte Messung mehr als 3 Tage zurück, zeigt die Seite „Letzte Messung vor N Tagen“ statt eines Urteils. Das gilt auch für das Urteil aus dem Cache (AC-14) und wenn die Messungen nicht für einen Trend reichen (AC-23).

> **AC-9** Nach einer Lücke zeigt die Seite, bis wieder 5 zählende Messungen nach der Lücke vorliegen, statt des Urteils den Vergleich „Nach N Tagen ohne Messung: ±x kg gegenüber vorher“. Verglichen wird der Median der zählenden Messungen nach der Lücke mit dem Trend am letzten Tag vor der Lücke. „Deutlich mehr als die normale Schwankung“ steht dabei, wenn der Betrag des Unterschieds größer ist als 2 · s / √n, mit s als Streuung der zählenden Messungen um den Trend in den 4 Wochen vor der Lücke und n als Zahl der zählenden Messungen nach der Lücke; sonst „im Rahmen der normalen Schwankung“. Eine deutliche Zunahme ist orange hervorgehoben, alles andere neutral. Ab der 5. Messung gilt wieder das Urteil aus AC-3 bis AC-5.

> **AC-10** Unter dem Urteil steht das Tempo der letzten 4 Wochen in kg pro Woche mit genau einer Stufe: „Zunahme“ (über +0,1), „Gewicht gehalten“ (von −0,1 bis +0,1 einschließlich), „Langsames Abnehmen“ (unter −0,1 bis −0,5 einschließlich), „Moderates Abnehmen“ (unter −0,5 bis −1,0 einschließlich), „Schnelles Abnehmen“ (unter −1,0).

> **AC-11** Die Seite zeigt die Zahlen Trend (kg), Gemessen (die zählende Messung des letzten Tages mit Messung, kg) und Tempo (4 Wochen, kg pro Woche, derselbe Wert wie in AC-10). Eine weitere Tempo-Zahl, etwa über 14 Tage, zeigt sie nicht.

> **AC-13** Auf einem Bildschirm von 360 × 640 px sind Urteil, Tempo-Stufe und Zahlen ohne Scrollen sichtbar, der Graph folgt darunter, und nichts scrollt horizontal. Auf breiten Bildschirmen ist der Inhalt auf etwa 960 px begrenzt und zentriert.

> **AC-14** Beim Öffnen erscheint sofort, ohne auf Google zu warten, das Urteil aus den zwischengespeicherten Messungen mit „Letzte Messung: …“.

> **AC-15** Solange die Seite Daten abruft, steht direkt am Urteil „Wird aktualisiert …“ und das Urteil ist als vorläufig gekennzeichnet; nach dem Abruf verschwinden beide.

> **AC-16** Braucht die Seite für einen Abruf eine Anmeldung bei Google, zeigt sie direkt am Urteil einen deutlich sichtbaren Knopf „Daten abrufen“; das Urteil aus dem Cache bleibt sichtbar. Ein Klick darauf startet den Abruf ohne weiteren Schritt auf der Seite. Beim ersten Besuch ohne Cache zeigt die Seite nur diesen Knopf und einen Satz Erklärung.

> **AC-17** Schlägt der Abruf fehl, steht neben „Letzte Messung“ eine kurze Fehlermeldung, und das Urteil aus dem Cache bleibt stehen.

> **AC-23** Reichen die zählenden Messungen nicht für einen Trend, oder gibt es nach einer Lücke keinen Trend vor der Lücke, zeigt die Seite in den neutralen Farben statt eines Urteils „Noch kein Urteil“ mit dem Satz „Ein Urteil gibt es ab der 5. Messung.“, dazu „Letzte Messung“ und die Zahl Gemessen; die Zahlen Trend und Tempo fehlen, der Graph zeigt nur die Punkte.

> **AC-24** Zahlen und Daten sind deutsch formatiert (99,7 kg, 5.8.).

Each AC above is proven where the user acts, on the rendered page; AC-7 with the fixture (through ticket 04's helper `src/test/weight-history-fixture.ts`) and "today" set to each of its dates. AC-13 depends on real layout, which the test environment does not do: test what it can (order of the content, no fixed width above 360 px, the 960 px limit), check the rest in a browser where one is at hand, and record under `## Left standing` how it was checked; no browser-test dependency is added for it.

## Technical decisions
> **Stored formats** Cache im `localStorage` des Browsers unter dem versionierten Schlüssel `gewicht:v1`: `{ "fetchedAt": "<ISO-Zeit>", "measurements": [{ "time": "<ISO-Zeit>", "kg": <Zahl> }] }` mit allen rohen Messungen der abgerufenen Zeiträume; die Regel „erste Messung pro Tag“ wendet erst der Code an. Bei fehlendem, unlesbarem oder anders versioniertem Eintrag wird er verworfen und neu geladen. Das Zugriffstoken wird nicht gespeichert. Nichts wird auf dem Server gespeichert; es gibt keine bestehenden Daten zu überführen.

> **Wire formats** Die Seite bietet nach außen keine Schnittstelle. Sie liest den Gewichts-Endpunkt der Google Health API. Die OAuth-Client-ID kommt zur Build-Zeit als `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. Der Container ist als `gewicht` im `service_network` auf Port 3000 erreichbar. Zu dieser Änderung gehört im Repo `~/Projects/infrastructure`: ein Site-Block `gewicht.jorgenschaefer.de` in `hosts/jorgenschaefer/Caddyfile` mit `import security` und `reverse_proxy gewicht:3000`, der Eintrag in `bin/check-redirects`, und vor dem Deployment ein DNS-Eintrag für `gewicht.jorgenschaefer.de` auf den Host (README dort, Abschnitt zu neuen Sites).

> **Trust boundaries** Anmeldung über den Token-Client von Google Identity Services im Browser, ausgelöst durch den Klick auf „Daten abrufen“, mit nur dem Lese-Scope für Health Metrics & Measurements der Google Health API (`https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly`, am 17.10.2026 am echten Konto bestätigt). Das Zugriffstoken liegt nur im Arbeitsspeicher. Gesundheitsdaten werden nur im `localStorage` der eigenen Geräte zwischengespeichert. Ausgehende Aufrufe nur an Google (Identity Services, Health API); Schriften werden mit der App ausgeliefert (`next/font`), nicht zur Laufzeit von Google Fonts geladen. Die App sendet selbst `Cross-Origin-Opener-Policy: same-origin-allow-popups`, weil die Vorgabe `same-origin` aus `caddy/snippets.caddy` das Anmelde-Popup bricht; sendet sie eine eigene Content-Security-Policy, muss diese Google Identity Services zulassen. Das OAuth-Projekt liegt im eigenen Google-Konto; erlaubte JavaScript-Herkünfte sind `https://gewicht.jorgenschaefer.de` und `http://localhost:3000`. Keine Secrets: die Client-ID ist öffentlich.

> **Dependencies** next 16.4.2, react und react-dom 19.3.1, @mantine/core und @mantine/hooks 9.7.2, postcss 8.5.30, postcss-preset-mantine 1.18.0, postcss-simple-vars 7.0.1, typescript 7.0.2, @biomejs/biome 2.5.15, vitest 5.0.5, @vitejs/plugin-react 6.1.2, jsdom 30.1.3, @testing-library/react 16.3.3, @testing-library/dom 10.4.2, @testing-library/jest-dom 7.0.1, @testing-library/user-event 14.6.8, die passenden `@types/*`-Pakete, Node LTS im Docker-Image; das Google-Identity-Services-Skript von Google; keine Chart-Bibliothek, kein Tailwind. Dienst: Google Health API.

## Nudges
> Feature-Module nach `UBIQUITOUS_LANGUAGE.md`: `src/measurement/` (Abruf von Google Health, Cache, erste Messung pro Berliner Kalendertag), `src/trend/` (robuster Trend und Steigung, Tempo mit fünf Stufen), `src/verdict/` (Urteil: Schwelle 0,2 kg/Woche, 3 Tage Bestätigung, Stufen 3/7/14; Lücke: mehr als 3 Tage, Vergleich bis zur 5. Messung), `src/app/` für die Seite. Jede dieser Regeln hat genau einen Ort, benannt nach ihr (etwa `src/verdict/verdict.ts`, `src/verdict/gap.ts`, `src/trend/pace.ts`).

> Die Logik in `src/measurement/` (außer dem Google-Zugriff), `src/trend/` und `src/verdict/` besteht aus reinen Funktionen ohne Browser- oder React-Bezug; „heute“ wird als Parameter übergeben, die Uhr liest nur die UI. So läuft sie später unverändert auf einem Server.

> Mantine-Komponenten für Knöpfe, Hinweise, Ladeanzeige und Layout; die Urteilsfläche und der Graph (handgeschriebenes SVG) sind eigener Code. Farben, Schrift Archivo (variabel mit Breiten- und Gewichtsachse, über `next/font`) und Aufteilung wie im Muster.

> Tests wie in `einsatz`: neben dem Code (`*.test.ts`), eine Testdatei je Quelldatei. Fixture `src/test/fixtures/gewicht-2026-07-bis-10.csv` ist der Auszug 1.7.–17.10.2026 aus `~/Projects/patientenakte-jorgen/unterlagen/gewicht.csv` im Format `datum,kg` (ein Wert pro Tag, ohne Uhrzeit). Fälle mit mehreren Messungen pro Tag (AC-2), Uhrzeiten und dem künstlichen Ausreißer (AC-6) sind künstliche Testdaten.

> Code und Bezeichner auf Englisch nach `UBIQUITOUS_LANGUAGE.md`, Texte auf der Seite auf Deutsch.

> Bei technisch verschiedenen Optionen mit ähnlichem Aufwand die wählen, die den späteren Server (`changes/backlog/server-mit-webhook.md`) besser vorbereitet.

## Context
**What exists.** Ticket 02 built in `src/measurement/` the counting measurements and the conversion to Berlin calendar days. Ticket 03 built the page with its states in the neutral colours - „Letzte Messung“, „Daten abrufen“, „Wird aktualisiert …“, the fetch error, the first visit, „Abmelden“ - and the German formatting under `src/app/`. Tickets 04 and 07 built, in `src/trend/` and `src/verdict/`, one result from the counting measurements and today: exactly one of „Nimmt ab“, no decrease (N, "at least", level), gap comparison, last measurement too old, no verdict yet; with trend, „Gemessen“, pace and band, and the 6-week series with outlier flags. Ticket 06 built the graph from that series, as a component of its own; this ticket places it under the numbers, as the design says. This ticket renders all that and decides no rule itself; where a rule turns out missing, it goes into `src/trend/` or `src/verdict/`. Add the verdict into ticket 03's page and keep its states where they stand. The clock is read here, under `src/app/`, and turned into today's Berlin day with ticket 02's conversion.

**Agreed design**, as `CRITERIA.md` gives it:

> „Farbfeld“: Der ganze Bildschirm ist die Urteilsfläche. Ihre Farbe eskaliert mit den Stufen aus AC-5, und die Überschrift wird mit jeder Stufe breiter und schwerer (Breiten- und Gewichtsachse von Archivo). Darunter stehen die Tempo-Stufe, die drei Zahlen und der Graph, alles in der Schriftfarbe der Fläche; Ausreißer sind hohle Ringe, die zählende Messung des letzten Tages ist ein größerer voller Punkt, die Trendlinie ist an Lücken unterbrochen. Auf breiten Bildschirmen füllt die Farbe das ganze Fenster, der Inhalt ist auf 960 px begrenzt: Urteil links, Zahlen rechts daneben, Graph darunter. Gegenüber den ACs neu: nach einer Lücke der Satz „Ein Urteil gibt es wieder ab der 5. Messung nach der Lücke.“ Die mehreren Tage nebeneinander und die Markierung bei 640 px gehören nur zum Muster. Nur heller Modus.
>
> Farben (Fläche / Schrift):
>
> - „Nimmt ab“: `#D5E4F1` / `#10355A`
> - 3–6 Tage: `#F5E1CB` / `#5A2C06`
> - 7–13 Tage und Lücke mit deutlicher Zunahme: `#EDA562` / `#3A1801`
> - ab 14 Tagen: `#8A380A` / `#FFF3E8`
> - neutral (Lücke im Rahmen, Messung zu alt, erster Besuch, noch kein Urteil): `#DDE1E5` / `#20262C`
>
> - Artifact: https://claude.ai/artifact/AQy9j1PdWULSjXSoCDuvNr (Artboards „A: Farbfeld“, „A: weitere Zustände“, „A: breiter Bildschirm“; „B: Kalender“ und „C: Skala“ dort sind verworfen)
> - Kopien: [`specimens/Main.dc.html`](specimens/Main.dc.html) (Urteil in allen Stufen, Abruf, Anmeldung), [`specimens/Zustaende.dc.html`](specimens/Zustaende.dc.html) (Lücke, Messung zu alt, Fehler, erster Besuch), [`specimens/Breit.dc.html`](specimens/Breit.dc.html) (breiter Bildschirm)
>
> **Agreed; build to this, do not redesign.**

The specimens are in `changes/2026-10-17-weight-trend/specimens/`. They do not render on their own - they load a `support.js` that is not in the repository - so read them: the CSS, the list of states and the script hold every size, colour, text and state. The per-level sizes, weights and widths of the headline, the fetch button's colours per level, the dimmed headline while busy, the texts of the gap state („Deutlich mehr als die normale Schwankung. …“ / „Im Rahmen der normalen Schwankung. …“), the 640 px fold and the wide layout are all there. While a fetch runs, the specimen shows the line „Vorläufig, wird aktualisiert …“ at the dimmed headline: that is how AC-15's „Wird aktualisiert …“ and the provisional marking look together, replacing ticket 03's plain „Wird aktualisiert …“. The "no verdict yet" state (AC-23) has no specimen: it is the neutral surface, laid out like the gap state.

## Not here
- Computing trend and pace: ticket 04; verdict and gap: ticket 07. Drawing the graph: ticket 06. Fetching, cache, sign-in, logout: tickets 02 and 03. Reachability (AC-22): ticket 01 and the deploy at acceptance.
- The rejected design variants („B: Kalender“, „C: Skala“ in the artifact) are not built.
- From `CRITERIA.md`'s out of scope:
- Benachrichtigungen und Mails.
- Zeiträume über 90 Tage im Graphen (`changes/backlog/langzeitansicht.md`).
- Erklärung, wie Werte und Urteil entstehen (`changes/backlog/anzeige-nachvollziehen.md`).
- Dunkler Modus.

## Left standing
