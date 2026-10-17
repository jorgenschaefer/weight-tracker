# Criteria: Gewichtstrend mit Urteil aus Google Health

## Problem

Du willst abnehmen und kannst mit dem Essen gegensteuern, sobald du weißt, dass es nicht mehr läuft. Du merkst aber nicht verlässlich und nicht früh genug, wenn dein Gewicht aufgehört hat zu fallen oder wieder steigt. Tägliche Schwankungen und Ausreißertage machen die Werte schwer zu deuten: Eine Zunahme kann von einem einzelnen Tag kommen oder eine echte Umkehr sein, und du kannst das nicht unterscheiden. Hält eine Zunahme an, erklärst du sie dir erst weg und beachtest sie dann nicht mehr, weil sie jeden Tag gleich aussieht. Stattdessen solltest du innerhalb weniger Tage wissen, ob dein Gewicht noch fällt, auch wenn einzelne Tage aus der Reihe fallen. Und eine anhaltende Umkehr sollte dir weiter auffallen, statt zur Gewohnheit zu werden.

Das ist mehrfach passiert. Der deutlichste Fall: Ab Anfang August 2026 stieg das Gewicht von etwa 96 kg auf 98 kg (20.8.), der Ausreißertag am 30.8. (101,0 kg, zu viel gegessen) verstärkte das, und bis Mitte September ging es auf über 100 kg, ohne dass gegengesteuert wurde. Die Zunahme nach dem 30.8. wurde erst dem Ausreißer zugeschrieben und dann nicht mehr beachtet; über eine Woche, in der mit dem Essen hätte gegengesteuert werden können, verging. Die Werte stehen in `~/Projects/patientenakte-jorgen/unterlagen/gewicht.csv`; der Auszug 1.7.–17.10.2026 kommt als Testdaten ins Repo.

Bisher wurde das Gewicht in Google Fit / Google Health und zusätzlich in einem Google Sheet eingetragen, dessen Trends nicht geholfen haben.

## Acceptance criteria

- **AC-1** Eine in Google Health eingetragene Gewichtsmessung erscheint nach dem nächsten Abruf als „Letzte Messung“ mit Datum, Uhrzeit und Wert, ohne dass sie anderswo eingetragen werden muss. „Letzte Messung“ ist immer der neueste Eintrag, auch wenn er nicht zählt (AC-2).
- **AC-2** Pro Kalendertag (Europe/Berlin) zählt die erste Messung; spätere Messungen desselben Tages ändern weder Trend, Tempo noch Urteil noch den angezeigten Wert „Gemessen“.
- **AC-3** Fällt der Trend über die letzten 14 Tage schneller als 0,2 kg pro Woche, lautet das Urteil „Nimmt ab“.
- **AC-4** Fällt der Trend seit 3 oder mehr Tagen nicht mehr schneller als 0,2 kg pro Woche, lautet das Urteil „Seit N Tagen kein Abnehmen“, wobei N die Tage seit dem letzten Tag mit fallendem Trend sind. Davor bleibt es bei „Nimmt ab“. „Seit 1 Tag“ oder „Seit 2 Tagen kein Abnehmen“ erscheint nie. Gibt es in den vorhandenen Messungen keinen Tag mit fallendem Trend, lautet das Urteil „Seit mindestens N Tagen kein Abnehmen“, mit N als Tagen seit dem ersten Tag, für den es einen Trend gibt.
- **AC-5** Das Urteil „kein Abnehmen“ hat drei sichtbar unterscheidbare, mit N zunehmend auffällige Stufen: 3–6 Tage, 7–13 Tage, ab 14 Tagen.
- **AC-6** Fällt der Trend mit 0,5 kg pro Woche oder schneller, ändert ein einzelner abweichender Messwert das Urteil „Nimmt ab“ nicht, egal wie hoch er ist. Geprüft mit dem 12.10.2026 aus den Testdaten und einem künstlichen Fall mit einem Einzelwert 3 kg über dem Trend.
- **AC-7** Mit den Testdaten gilt: spätestens am 8.8.2026 lautet das Urteil „kein Abnehmen“; am 30.8.2026 steht es auf der höchsten Stufe; am 12.10.2026 (Ausreißer 99,7 kg) und am 17.10.2026 lautet es „Nimmt ab“.
- **AC-8** Liegt die letzte Messung mehr als 3 Tage zurück, zeigt die Seite „Letzte Messung vor N Tagen“ statt eines Urteils. Das gilt auch für das Urteil aus dem Cache (AC-14).
- **AC-9** Nach einer Lücke zeigt die Seite, bis wieder 5 zählende Messungen nach der Lücke vorliegen, statt des Urteils den Vergleich „Nach N Tagen ohne Messung: ±x kg gegenüber vorher“. Verglichen wird der Median der zählenden Messungen nach der Lücke mit dem Trend am letzten Tag vor der Lücke. „Deutlich mehr als die normale Schwankung“ steht dabei, wenn der Betrag des Unterschieds größer ist als 2 · s / √n, mit s als Streuung der zählenden Messungen um den Trend in den 4 Wochen vor der Lücke und n als Zahl der zählenden Messungen nach der Lücke; sonst „im Rahmen der normalen Schwankung“. Eine deutliche Zunahme ist orange hervorgehoben, alles andere neutral. Ab der 5. Messung gilt wieder das Urteil aus AC-3 bis AC-5.
- **AC-10** Unter dem Urteil steht das Tempo der letzten 4 Wochen in kg pro Woche mit genau einer Stufe: „Zunahme“ (über +0,1), „Gewicht gehalten“ (von −0,1 bis +0,1 einschließlich), „Langsames Abnehmen“ (unter −0,1 bis −0,5 einschließlich), „Moderates Abnehmen“ (unter −0,5 bis −1,0 einschließlich), „Schnelles Abnehmen“ (unter −1,0).
- **AC-11** Die Seite zeigt die Zahlen Trend (kg), Gemessen (die zählende Messung des letzten Tages mit Messung, kg) und Tempo (4 Wochen, kg pro Woche, derselbe Wert wie in AC-10). Eine weitere Tempo-Zahl, etwa über 14 Tage, zeigt sie nicht.
- **AC-12** Der Graph zeigt die letzten 6 Wochen: zählende Messungen als Punkte, den Trend als Linie. Messungen, die mehr als 0,9 kg vom Trend ihres Tages abweichen, sind sichtbar anders markiert als die übrigen Punkte.
- **AC-13** Auf einem Bildschirm von 360 × 640 px sind Urteil, Tempo-Stufe und Zahlen ohne Scrollen sichtbar, der Graph folgt darunter, und nichts scrollt horizontal. Auf breiten Bildschirmen ist der Inhalt auf etwa 960 px begrenzt und zentriert.
- **AC-14** Beim Öffnen erscheint sofort, ohne auf Google zu warten, das Urteil aus den zwischengespeicherten Messungen mit „Letzte Messung: …“.
- **AC-15** Solange die Seite Daten abruft, steht direkt am Urteil „Wird aktualisiert …“ und das Urteil ist als vorläufig gekennzeichnet; nach dem Abruf verschwinden beide.
- **AC-16** Braucht die Seite für einen Abruf eine Anmeldung bei Google, zeigt sie direkt am Urteil einen deutlich sichtbaren Knopf „Daten abrufen“; das Urteil aus dem Cache bleibt sichtbar. Ein Klick darauf startet den Abruf ohne weiteren Schritt auf der Seite. Beim ersten Besuch ohne Cache zeigt die Seite nur diesen Knopf und einen Satz Erklärung.
- **AC-17** Schlägt der Abruf fehl, steht neben „Letzte Messung“ eine kurze Fehlermeldung, und das Urteil aus dem Cache bleibt stehen.
- **AC-18** Beim ersten Abruf holt die Seite die Messungen der letzten 90 Tage. Jeder weitere Abruf holt die letzten 14 Tage vollständig neu und ersetzt damit den Cache für diesen Zeitraum; in Google Health korrigierte oder gelöschte Messungen der letzten 14 Tage sind danach korrigiert bzw. verschwunden. Ältere Messungen im Cache bleiben unverändert.
- **AC-19** Die Seite schreibt nie etwas in Google Health.
- **AC-20** Ganz unten steht klein „Abmelden“; es löscht ohne Rückfrage den Cache in diesem Browser, verwirft das Zugriffstoken und widerruft den Zugriff der Seite bei Google. Danach zeigt die Seite den Zustand des ersten Besuchs (AC-16).
- **AC-22** Die Seite ist unter https://gewicht.jorgenschaefer.de erreichbar; Zahlen und Daten sind deutsch formatiert (99,7 kg, 5.8.).

## Agreed design

Variante A, „Urteil mit Dauer“: oben ein großes Urteil auf einer Fläche, deren Farbe mit der Dauer eskaliert, darunter die Zahlen, darunter der Graph. Gegenüber dem Muster neu: die Zeile mit der Tempo-Stufe (AC-10), der Knopf „Daten abrufen“ und „Wird aktualisiert …“ am Urteil (AC-15, AC-16), das Handy-Layout (AC-13). Die Unterzeile des Urteils nennt keine Tempo-Zahl mehr (AC-11). Der Regler „Stand am“ gehörte nur zum Muster. Nur heller Modus.

- Artifact: https://claude.ai/artifact/9QccWmoDGn9BM3mqJ3a3nn (Artboard „A · Urteil mit Dauer“; B und C dort sind verworfen)
- Kopie: [`specimens/Main.dc.html`](specimens/Main.dc.html)

**Agreed; build to this, do not redesign.**

## Technical decisions

- **Stored formats** Cache im `localStorage` des Browsers unter dem versionierten Schlüssel `gewicht:v1`: `{ "fetchedAt": "<ISO-Zeit>", "measurements": [{ "time": "<ISO-Zeit>", "kg": <Zahl> }] }` mit allen rohen Messungen der abgerufenen Zeiträume; die Regel „erste Messung pro Tag“ wendet erst der Code an. Bei fehlendem, unlesbarem oder anders versioniertem Eintrag wird er verworfen und neu geladen. Das Zugriffstoken wird nicht gespeichert. Nichts wird auf dem Server gespeichert; es gibt keine bestehenden Daten zu überführen.
- **Wire formats** Die Seite bietet nach außen keine Schnittstelle. Sie liest den Gewichts-Endpunkt der Google Health API. Die OAuth-Client-ID kommt zur Build-Zeit als `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. Der Container ist als `gewicht` im `service_network` auf Port 3000 erreichbar. Zu dieser Änderung gehört im Repo `~/Projects/infrastructure`: ein Site-Block `gewicht.jorgenschaefer.de` in `hosts/jorgenschaefer/Caddyfile` mit `import security` und `reverse_proxy gewicht:3000`, der Eintrag in `bin/check-redirects`, und vor dem Deployment ein DNS-Eintrag für `gewicht.jorgenschaefer.de` auf den Host (README dort, Abschnitt zu neuen Sites).
- **Trust boundaries** Anmeldung über den Token-Client von Google Identity Services im Browser, ausgelöst durch den Klick auf „Daten abrufen“, mit nur dem Lese-Scope für Health Metrics & Measurements der Google Health API (genauer Scope-Name laut developers.google.com/health/data-types, im ersten Ticket bestätigt). Das Zugriffstoken liegt nur im Arbeitsspeicher. Gesundheitsdaten werden nur im `localStorage` der eigenen Geräte zwischengespeichert. Ausgehende Aufrufe nur an Google (Identity Services, Health API); Schriften werden mit der App ausgeliefert (`next/font`), nicht zur Laufzeit von Google Fonts geladen. Die App sendet selbst `Cross-Origin-Opener-Policy: same-origin-allow-popups`, weil die Vorgabe `same-origin` aus `caddy/snippets.caddy` das Anmelde-Popup bricht; sendet sie eine eigene Content-Security-Policy, muss diese Google Identity Services zulassen. Das OAuth-Projekt liegt im eigenen Google-Konto; erlaubte JavaScript-Herkünfte sind `https://gewicht.jorgenschaefer.de` und `http://localhost:3000`. Keine Secrets: die Client-ID ist öffentlich.
- **Dependencies** next 16.4.2, react und react-dom 19.3.1, @mantine/core und @mantine/hooks 9.7.2, postcss 8.5.30, postcss-preset-mantine 1.18.0, postcss-simple-vars 7.0.1, typescript 7.0.2, @biomejs/biome 2.5.15, vitest 5.0.5, @vitejs/plugin-react 6.1.2, jsdom 30.1.3, @testing-library/react 16.3.3, @testing-library/dom 10.4.2, @testing-library/jest-dom 7.0.1, @testing-library/user-event 14.6.8, die passenden `@types/*`-Pakete, Node LTS im Docker-Image; das Google-Identity-Services-Skript von Google; keine Chart-Bibliothek, kein Tailwind. Dienst: Google Health API.

## Nudges

- Vorlage für Stack, Aufbau, Tests und Deployment ist `~/Projects/einsatz` (Mantine-Setup, `src/`, `biome.json`, `vitest.config.mts`, `npm run check`, Dockerfile, `docker-entrypoint.sh`, `compose.prod.yaml`, `bin/deploy-prod`), ohne Datenbank, Auth und sops.
- Feature-Module nach `UBIQUITOUS_LANGUAGE.md`: `src/measurement/` (Abruf von Google Health, Cache, erste Messung pro Berliner Kalendertag), `src/trend/` (robuster Trend und Steigung, Tempo mit fünf Stufen), `src/verdict/` (Urteil: Schwelle 0,2 kg/Woche, 3 Tage Bestätigung, Stufen 3/7/14; Lücke: mehr als 3 Tage, Vergleich bis zur 5. Messung), `src/app/` für die Seite. Jede dieser Regeln hat genau einen Ort, benannt nach ihr (etwa `src/verdict/verdict.ts`, `src/verdict/gap.ts`, `src/trend/pace.ts`).
- Die Logik in `src/measurement/` (außer dem Google-Zugriff), `src/trend/` und `src/verdict/` besteht aus reinen Funktionen ohne Browser- oder React-Bezug; „heute“ wird als Parameter übergeben, die Uhr liest nur die UI. So läuft sie später unverändert auf einem Server.
- Nur ein Modul in `src/measurement/` spricht mit Google; es liefert Messungen oder einen typisierten Fehler, den die UI anzeigt.
- Mantine-Komponenten für Knöpfe, Hinweise, Ladeanzeige und Layout; die Urteilsfläche und der Graph (handgeschriebenes SVG) sind eigener Code. Farben, IBM Plex Sans und Mono und Aufteilung wie im Muster.
- Startpunkt für den Trend ist der Ansatz des Musters (Theil-Sen über 14 Tage, Niveau als Median der Projektionen); der Build darf davon abweichen, solange die ACs halten.
- Tests wie in `einsatz`: neben dem Code (`*.test.ts`), eine Testdatei je Quelldatei. Fixture `src/test/fixtures/gewicht-2026-07-bis-10.csv` ist der Auszug 1.7.–17.10.2026 aus `~/Projects/patientenakte-jorgen/unterlagen/gewicht.csv` im Format `datum,kg` (ein Wert pro Tag, ohne Uhrzeit). Fälle mit mehreren Messungen pro Tag (AC-2), Uhrzeiten und dem künstlichen Ausreißer (AC-6) sind künstliche Testdaten.
- Das erste Ticket prüft am echten Konto, ob in der Google-Health-App eingetragene Messungen über die Health API ankommen, und bestätigt den Scope. Wenn nicht: anhalten und melden.
- Code und Bezeichner auf Englisch nach `UBIQUITOUS_LANGUAGE.md`, Texte auf der Seite auf Deutsch.
- Bei technisch verschiedenen Optionen mit ähnlichem Aufwand die wählen, die den späteren Server (`changes/backlog/server-mit-webhook.md`) besser vorbereitet.

## Out of scope

- Benachrichtigungen und Mails.
- Öffnen der Seite ohne Netz (Service Worker).
- Die Phase „Gewicht halten“ und das Erkennen langsamer Drift über Monate (`changes/backlog/erhaltungsphase.md`).
- Server, Webhook, serverseitiger Cache, Anmeldung ohne Klick bei jedem Besuch (`changes/backlog/server-mit-webhook.md`).
- Zeiträume über 90 Tage im Graphen (`changes/backlog/langzeitansicht.md`).
- Werte auf der Seite eintragen (`changes/backlog/eingabe-in-der-app.md`).
- Erklärung, wie Werte und Urteil entstehen (`changes/backlog/anzeige-nachvollziehen.md`).
- Dunkler Modus.
- Mehrere Nutzer; Import der alten CSV-Historie.

## Ruled out

- **Google Sheet als Datenquelle** - erzwingt doppeltes Eintragen.
- **Google Fit REST API** - wird Ende 2026 abgeschaltet, keine Neuregistrierung seit Mai 2024.
- **Apps Script im Sheet oder als eigenes Projekt** - das Sheet entfällt; ohne Mails bringt es gegenüber einer statischen Seite nur Token-Ablage und Komplexität.
- **Benachrichtigungen (Mail, Push)** - gewünscht ist, visuell zu sehen, wo man steht, beim regelmäßigen Reinschauen.
- **Variante B „Abstand zum Tief“** - ein altes Tief bleibt monatelang stehen, die Zahl verliert ihre Aussage.
- **Variante C „Tempo über die Zeit“** - zugunsten von A verworfen; mehr Aufwand, das Urteil steht nicht im Vordergrund.
- **Eigener Server schon jetzt** - für das MVP reicht die statische Seite; der Klick auf „Daten abrufen“ wird hingenommen; Server im Backlog.
- **Tailwind wie in `ausgaben`** - die neueren Apps (`einsatz`, `drk-barmbek`, `dom`) nutzen Mantine; gleicher Aufwand.
- **Vite oder reines TypeScript** - gleicher oder kaum geringerer Aufwand, bereitet den Server schlechter vor als Next.js.
- **Service Worker für Offline-Öffnen** - nach dem Wiegen ist in der Regel Netz da; Fehlerfall deckt AC-17.
- **Ausreißer aus dem Urteil ausschließen** - ein anhaltender echter Sprung sähe anfangs aus wie ein Ausreißer und würde zu spät erkannt.
- **Tempo-Ampel über 14 Tage als einziges Signal** - bei ±0,5 kg Tagesschwankung liegt die Unsicherheit über 14 Tage bei ±0,47 kg/Woche, die Stufen würden springen.
- **Schwelle 0,5 kg/Woche für „Nimmt ab“** - nach etwa drei Monaten verlangsamt sich die Abnahme erwartbar (S3-Leitlinie Adipositas 2024, Empfehlung 5.11); das gäbe falschen Alarm.
