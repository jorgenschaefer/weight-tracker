---
criteria:  CRITERIA.md
closes:    AC-1, AC-18, AC-19, AC-20
advances:  AC-14, AC-15, AC-16, AC-17, AC-24
after:     02-measurement-rules
status:    done
attempts:  1
---

## Build
Get the measurements from Google Health into the page: the one module that talks to Google (sign-in with the token client, reading weight measurements, revoking access), the `localStorage` adapter for the cache, and the page's states around where the verdict will stand - first visit, „Daten abrufen“, „Wird aktualisiert …“, the fetch error, „Letzte Messung“ and „Abmelden“.

## Done when
> **AC-1** Eine in Google Health eingetragene Gewichtsmessung erscheint nach dem nächsten Abruf als „Letzte Messung“ mit Datum, Uhrzeit und Wert, ohne dass sie anderswo eingetragen werden muss. „Letzte Messung“ ist immer der neueste Eintrag, auch wenn er nicht zählt (AC-2).

> **AC-18** Beim ersten Abruf holt die Seite die Messungen der letzten 90 Tage. Jeder weitere Abruf holt die letzten 14 Tage vollständig neu, oder alles seit dem letzten Abruf, wenn dieser länger zurückliegt, höchstens aber 90 Tage, und ersetzt damit den Cache für diesen Zeitraum; in Google Health korrigierte oder gelöschte Messungen dieses Zeitraums sind danach korrigiert bzw. verschwunden. Ältere Messungen im Cache bleiben unverändert.

> **AC-19** Die Seite schreibt nie etwas in Google Health.

> **AC-20** Ganz unten steht klein „Abmelden“; es löscht ohne Rückfrage den Cache in diesem Browser, verwirft das Zugriffstoken und widerruft den Zugriff der Seite bei Google; liegt kein Zugriffstoken vor, holt es dafür zuerst eines über die Anmeldung bei Google. Danach zeigt die Seite den Zustand des ersten Besuchs (AC-16).

Toward the ACs below, this ticket makes true:

- AC-14: on opening, „Letzte Messung: …“ from the cached measurements appears at once, without waiting for Google. There is no verdict yet.
- AC-15: while a fetch runs, „Wird aktualisiert …“ stands where the verdict will stand, and disappears once the fetch is over.
- AC-16: whenever a fetch needs sign-in, the page shows a clearly visible button „Daten abrufen“; one click signs in and fetches, with no further step on the page. On the first visit without a cache, the page shows only this button and one sentence of explanation.
- AC-17: when a fetch fails, a short error message stands next to „Letzte Messung“, and the cached measurements stay.
- AC-24: „Letzte Messung“ shows date, time and weight in German format (99,7 kg, 5.8.).

## Toward
> **AC-14** Beim Öffnen erscheint sofort, ohne auf Google zu warten, das Urteil aus den zwischengespeicherten Messungen mit „Letzte Messung: …“.

> **AC-15** Solange die Seite Daten abruft, steht direkt am Urteil „Wird aktualisiert …“ und das Urteil ist als vorläufig gekennzeichnet; nach dem Abruf verschwinden beide.

> **AC-16** Braucht die Seite für einen Abruf eine Anmeldung bei Google, zeigt sie direkt am Urteil einen deutlich sichtbaren Knopf „Daten abrufen“; das Urteil aus dem Cache bleibt sichtbar. Ein Klick darauf startet den Abruf ohne weiteren Schritt auf der Seite. Beim ersten Besuch ohne Cache zeigt die Seite nur diesen Knopf und einen Satz Erklärung.

> **AC-17** Schlägt der Abruf fehl, steht neben „Letzte Messung“ eine kurze Fehlermeldung, und das Urteil aus dem Cache bleibt stehen.

> **AC-24** Zahlen und Daten sind deutsch formatiert (99,7 kg, 5.8.).

## Technical decisions
> **Stored formats** Cache im `localStorage` des Browsers unter dem versionierten Schlüssel `gewicht:v1`: `{ "fetchedAt": "<ISO-Zeit>", "measurements": [{ "time": "<ISO-Zeit>", "kg": <Zahl> }] }` mit allen rohen Messungen der abgerufenen Zeiträume; die Regel „erste Messung pro Tag“ wendet erst der Code an. Bei fehlendem, unlesbarem oder anders versioniertem Eintrag wird er verworfen und neu geladen. Das Zugriffstoken wird nicht gespeichert. Nichts wird auf dem Server gespeichert; es gibt keine bestehenden Daten zu überführen.

> **Wire formats** Die Seite bietet nach außen keine Schnittstelle. Sie liest den Gewichts-Endpunkt der Google Health API. Die OAuth-Client-ID kommt zur Build-Zeit als `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. Der Container ist als `gewicht` im `service_network` auf Port 3000 erreichbar. Zu dieser Änderung gehört im Repo `~/Projects/infrastructure`: ein Site-Block `gewicht.jorgenschaefer.de` in `hosts/jorgenschaefer/Caddyfile` mit `import security` und `reverse_proxy gewicht:3000`, der Eintrag in `bin/check-redirects`, und vor dem Deployment ein DNS-Eintrag für `gewicht.jorgenschaefer.de` auf den Host (README dort, Abschnitt zu neuen Sites).

> **Trust boundaries** Anmeldung über den Token-Client von Google Identity Services im Browser, ausgelöst durch den Klick auf „Daten abrufen“, mit nur dem Lese-Scope für Health Metrics & Measurements der Google Health API (`https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly`, am 17.10.2026 am echten Konto bestätigt). Das Zugriffstoken liegt nur im Arbeitsspeicher. Gesundheitsdaten werden nur im `localStorage` der eigenen Geräte zwischengespeichert. Ausgehende Aufrufe nur an Google (Identity Services, Health API); Schriften werden mit der App ausgeliefert (`next/font`), nicht zur Laufzeit von Google Fonts geladen. Die App sendet selbst `Cross-Origin-Opener-Policy: same-origin-allow-popups`, weil die Vorgabe `same-origin` aus `caddy/snippets.caddy` das Anmelde-Popup bricht; sendet sie eine eigene Content-Security-Policy, muss diese Google Identity Services zulassen. Das OAuth-Projekt liegt im eigenen Google-Konto; erlaubte JavaScript-Herkünfte sind `https://gewicht.jorgenschaefer.de` und `http://localhost:3000`. Keine Secrets: die Client-ID ist öffentlich.

> **Dependencies** next 16.4.2, react und react-dom 19.3.1, @mantine/core und @mantine/hooks 9.7.2, postcss 8.5.30, postcss-preset-mantine 1.18.0, postcss-simple-vars 7.0.1, typescript 7.0.2, @biomejs/biome 2.5.15, vitest 5.0.5, @vitejs/plugin-react 6.1.2, jsdom 30.1.3, @testing-library/react 16.3.3, @testing-library/dom 10.4.2, @testing-library/jest-dom 7.0.1, @testing-library/user-event 14.6.8, die passenden `@types/*`-Pakete, Node LTS im Docker-Image; das Google-Identity-Services-Skript von Google; keine Chart-Bibliothek, kein Tailwind. Dienst: Google Health API.

## Nudges
> Feature-Module nach `UBIQUITOUS_LANGUAGE.md`: `src/measurement/` (Abruf von Google Health, Cache, erste Messung pro Berliner Kalendertag), `src/trend/` (robuster Trend und Steigung, Tempo mit fünf Stufen), `src/verdict/` (Urteil: Schwelle 0,2 kg/Woche, 3 Tage Bestätigung, Stufen 3/7/14; Lücke: mehr als 3 Tage, Vergleich bis zur 5. Messung), `src/app/` für die Seite. Jede dieser Regeln hat genau einen Ort, benannt nach ihr (etwa `src/verdict/verdict.ts`, `src/verdict/gap.ts`, `src/trend/pace.ts`).

> Die Logik in `src/measurement/` (außer dem Google-Zugriff), `src/trend/` und `src/verdict/` besteht aus reinen Funktionen ohne Browser- oder React-Bezug; „heute“ wird als Parameter übergeben, die Uhr liest nur die UI. So läuft sie später unverändert auf einem Server.

> Nur ein Modul in `src/measurement/` spricht mit Google; es liefert Messungen oder einen typisierten Fehler, den die UI anzeigt.

> Mantine-Komponenten für Knöpfe, Hinweise, Ladeanzeige und Layout; die Urteilsfläche und der Graph (handgeschriebenes SVG) sind eigener Code. Farben, Schrift Archivo (variabel mit Breiten- und Gewichtsachse, über `next/font`) und Aufteilung wie im Muster.

> Tests wie in `einsatz`: neben dem Code (`*.test.ts`), eine Testdatei je Quelldatei. Fixture `src/test/fixtures/gewicht-2026-07-bis-10.csv` ist der Auszug 1.7.–17.10.2026 aus `~/Projects/patientenakte-jorgen/unterlagen/gewicht.csv` im Format `datum,kg` (ein Wert pro Tag, ohne Uhrzeit). Fälle mit mehreren Messungen pro Tag (AC-2), Uhrzeiten und dem künstlichen Ausreißer (AC-6) sind künstliche Testdaten.

> Code und Bezeichner auf Englisch nach `UBIQUITOUS_LANGUAGE.md`, Texte auf der Seite auf Deutsch.

> Bei technisch verschiedenen Optionen mit ähnlichem Aufwand die wählen, die den späteren Server (`changes/backlog/server-mit-webhook.md`) besser vorbereitet.

## Context
Ticket 01 left a Next.js app with Mantine, the check command and a placeholder page, which this ticket replaces. Ticket 02 left in `src/measurement/` the measurement and counting measurement, the Berlin calendar day, the cache format and the fetch period rule with the cache replacement - use them, do not re-implement them - and the structural check, in which the Google module added here is named as the one exception. The `localStorage` adapter goes under `src/app/`, so `src/measurement/` stays free of browser APIs apart from the Google module.

**Google Health, as confirmed on the user's real account on 17.10.2026** with a throwaway page on `http://localhost:3000` (Google Identity Services token client, client ID as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, which ticket 01 put into the build):
- Scope `https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly`, granted as requested.
- `GET https://health.googleapis.com/v4/users/me/dataTypes/weight/dataPoints` with `Authorization: Bearer <token>` and the query parameter `filter=weight.sample_time.physical_time >= "<ISO instant>"` (AIP-160; `<` closes a range). Response `{ "dataPoints": [...], "nextPageToken": "..." }`; the token is absent when the response is complete. `pageSize` defaults to 1440, maximum 10000. 14 days came back as 14 data points, newest first - do not rely on the order.
- A data point, as returned (ids shortened): `{ "name": "users/…/dataTypes/weight/dataPoints/…", "dataSource": { "recordingMethod": "MANUAL", "device": {}, "application": { "packageName": "com.google.android.apps.fitness" }, "platform": "HEALTH_CONNECT" }, "weight": { "sampleTime": { "physicalTime": "2026-10-17T07:57:00Z", "utcOffset": "7200s", "civilTime": { "date": { "year": 2026, "month": 10, "day": 17 }, "time": { "hours": 9, "minutes": 57 } } }, "weightGrams": 98599 } }`. A measurement entered in the Google Health app that morning was among them.
- `weightGrams` is an integer and not exact: a value entered as 98,6 kg came back as 98599. The measurement's instant is `physicalTime`; its Berlin day comes from ticket 02's conversion, not from `civilTime`.

The tests drive everything behind the Google module through a stand-in for it; the real sign-in is tried at acceptance. No build step needs the user.

**Google module.** The only code that loads Google Identity Services or calls Google; it returns measurements or a typed error the page shows in German. It only reads. The access token lives in memory, never in storage. Every visit needs the click on „Daten abrufen“, because the token is not kept; that is accepted.

**Abmelden.** It clears the cache, discards the token and revokes the page's access; where no token is in memory, it first gets one through the same sign-in. Then the page shows the first-visit state.

**Headers.** `Cross-Origin-Opener-Policy: same-origin-allow-popups` is sent by the app itself (from `next.config.ts`), since the gateway's default `same-origin` breaks the sign-in popup. A Content-Security-Policy is optional; one that is sent allows Google Identity Services.

**Design.** The agreed design is „Farbfeld“: the whole screen is the verdict surface, everything on it in the surface's text colour. Until ticket 05 adds the verdict, every state here uses the neutral colours `#DDE1E5` / `#20262C`. The states are drawn in `changes/2026-10-17-weight-trend/specimens/`: `Zustaende.dc.html` (first visit, with the sentence „Diese Seite liest deine Gewichtsmessungen aus Google Health und zeigt dir, ob du noch abnimmst.“; fetch failed) and `Main.dc.html` (fetch running - its line „Vorläufig, wird aktualisiert …“ marks a verdict as provisional, which ticket 05 adds; here the line is AC-15's plain „Wird aktualisiert …“; sign-in needed), with „Letzte Messung“ at the top, the button, the busy line and the error at the verdict, and „Abmelden“ small at the bottom. They do not render on their own - they load a `support.js` that is not in the repository - so read them: the CSS, the list of states and the script hold every size, colour, text and state. Build to them, do not redesign. Archivo, variable with width and weight axes, is set up here through `next/font` for the whole page; ticket 05 uses the axes for the verdict headline. Light mode only.

**What tickets 05 and 06 build on.** Ticket 05 adds the verdict, the pace band, the numbers and ticket 06's graph into this page and colours it by the verdict, keeping these states where they are. German number and date formatting has one home under `src/app/`, which tickets 05 and 06 use and extend.

## Not here
- Measurement rules and cache format: ticket 02. Trend, pace and outliers: ticket 04. Verdict and gap comparison: ticket 07. The coloured verdict surface, the numbers and the wide layout: ticket 05. The graph: ticket 06.
- Marking a verdict as provisional (AC-15) and keeping the cached verdict visible (AC-14, AC-16, AC-17): ticket 05, once there is a verdict.
- From `CRITERIA.md`'s out of scope:
- Öffnen der Seite ohne Netz (Service Worker).
- Server, Webhook, serverseitiger Cache, Anmeldung ohne Klick bei jedem Besuch (`changes/backlog/server-mit-webhook.md`).
- Werte auf der Seite eintragen (`changes/backlog/eingabe-in-der-app.md`).
- Mehrere Nutzer; Import der alten CSV-Historie.
- Dunkler Modus.

## Left standing

**Checks not run, and what no automated test proves:**
- **Real Google, end to end.** Signing in, fetching from the Health API and revoking were not run against the user's account; that is for acceptance. The tests drive the page through an in-memory stand-in for the Google module, and they test the module against stand-ins for Google Identity Services and `fetch`.
- **The script loader.** `loadGoogleSignIn` adds the GIS `<script>` tag and has no test, because it is a thin adapter. The reviewer drove `npm run dev` in headless Chromium. The popup opened straight from the click with only the read-only scope. Closing the popup, and blocking accounts.google.com, each showed their error. The response carried `Cross-Origin-Opener-Policy: same-origin-allow-popups`.
- **A console warning.** GIS logs "Cross-Origin-Opener-Policy policy would block the window.closed call" for each popup. Noticing a closed popup still works.
- **AC-19.** It is proven by tests: the only scope asked for is `…health_metrics_and_measurements.readonly`, and every request is a `GET`.
- **The design.** The reviewer checked it in the browser at 360 px and 1440 px: Archivo, the neutral colours, and the button at 48 px in `#20262C` on `#DDE1E5`. Nothing overflowed.
- **Not deployed.** `bin/deploy-prod` was not run.

**Review findings not fixed:**
- **Should-fix, second round: `src/app/page.test.tsx` was over 500 lines.** I shortened it to 440 lines, keeping every case, with shared setup and assertion helpers. That is still above the "about 400" the standard aims for. Ticket 05 adds to this file, so it should split the page first.
- **Nit, first round: no button after a fetch fails while a token is held.** This happens when Google is unreachable, answers 5xx, or answers unexpectedly. Then the page offers no retry; only reloading the page helps. The button shows exactly when this visit holds no token. That matches AC-16 ("braucht die Seite eine Anmeldung") and the error state in `Zustaende.dc.html`, which has no button. The criteria do not settle whether a retry should be offered, so the user decides.
- **Nit, second round: a self-contradicting message.** Suppose that during „Abmelden“ without a token, the person unticks the scope at Google. The page then says „Widerruf fehlgeschlagen: Der Zugriff auf die Gewichtsmessungen wurde nicht erlaubt.“ and next „Die Seite darf deine Gewichtsmessungen weiter lesen.“ Google rarely shows the checkbox again for a scope it has already granted, so I left it.

**Decisions that would be costly to reverse:**
- **The Google module's API** (`src/measurement/google-health.ts`):
  - Functions: `loadGoogleSignIn()`, `signIn()`, `fetchMeasurements(token, from)` and `revokeAccess(token)`.
  - Each call returns `GoogleHealthResult<T>` (`{ ok: true, value } | { ok: false, error }`). The error is a `GoogleHealthError` union with the kinds `signInUnavailable`, `signInFailed`, `accessNotGranted`, `tokenRejected`, `unreachable`, `failed` (with `status`), `unexpectedResponse` and `revokeFailed`.
  - `AccessToken` is a plain string alias.
  - `signIn` has to be called before anything is awaited in the click handler, or the browser blocks the popup.
  - `CLAUDE.md` and `src/test/domain-boundaries.ts` name this file as the one module in `src/measurement/` that may use the browser.
- **The request.** It filters only `weight.sample_time.physical_time >= "<from>"`; no upper bound is sent, because only `>=` was confirmed against the real API. `replaceFetchedPeriod` already drops anything outside the period. Pages are followed through `nextPageToken`. An absent `dataPoints` counts as an empty list.
- **Weights in the cache are not rounded.** `kg = weightGrams / 1000` is cached as is (for example 98.599), and only the display rounds.
- **German formatting.** It lives in `src/app/format.ts`: `formatKg` (`98,6`), `formatDay` (`5.8.`) and `formatTime` (`7:12`), all on Berlin time. Tickets 05 and 06 extend this file.
- **Page state.**
  - The hook `useMeasurements` lives in `src/app/page.tsx` beside the view, so the page keeps one test file; it returns `null` until the cache has been read after mounting.
  - The `localStorage` adapter is three small functions at the bottom of the same file.
  - A counter of log-outs makes a fetch that outlives „Abmelden“ drop its result.
- **„Abmelden“.**
  - It clears the cache and the token at once, before it signs in or revokes, so the cache is gone even if Google fails.
  - If revoking fails, the first-visit page says so. It then says the page can still read the weights and links to https://myaccount.google.com/connections.
- **Where things stand and what they say.**
  - On the first visit, an error stands under the button. In the cached state it stands under „Letzte Messung“, and the button comes after it.
  - A cache with no measurements shows „Noch keine Messung in Google Health in den letzten 90 Tagen“.
  - The error texts are in `reason()` in `page.tsx`.
- **The font.** Archivo comes from `next/font/google` with the `wdth` axis. It is downloaded at build time, so `next build` and the Docker build need network, and the browser never asks Google Fonts. Vitest cannot run `next/font`, so `src/app/layout.test.ts` replaces it with a stand-in.
- **New names not in `UBIQUITOUS_LANGUAGE.md`:** `latestMeasurement` („Letzte Messung“), `GoogleHealthError`, `Problem` and `AccessToken`. The glossary is unchanged, since nobody could be asked during the run; the user should confirm them, along with ticket 02's `MeasurementCache` and `FetchPeriod`.

**Departures from the nudges and from earlier tickets' Left standing:**
- **No Mantine loader.** The nudge names a Mantine loading indicator. The design draws the busy line as text only, so „Wird aktualisiert …“ is a `Text` with no `Loader`.
- **No old cache keys removed.** Ticket 02 left removing old cache keys to the `localStorage` adapter. `gewicht:v1` is the first version, so there is nothing to remove, and the adapter does not try.

