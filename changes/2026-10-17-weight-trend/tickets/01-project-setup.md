---
criteria:  CRITERIA.md
closes:    AC-22
advances:  
after:     
status:    done
attempts:  1
---

## Build
Set the repository up as a Next.js app modelled on `~/Projects/einsatz`, with the single check command declared in `CLAUDE.md`, and add what it takes to run the app as the container `gewicht` and serve it at `gewicht.jorgenschaefer.de`, including the changes in `~/Projects/infrastructure`.

## Done when
> **AC-22** Die Seite ist unter https://gewicht.jorgenschaefer.de erreichbar.

AC-22 is proven as far as a build can: the Docker image builds; started from `compose.prod.yaml`, the container is reachable as `gewicht` in `service_network` on port 3000; `bin/deploy-prod` exists, modelled on einsatz's, targets the jorgenschaefer host, and is not run; in `~/Projects/infrastructure` the site block for `gewicht.jorgenschaefer.de` and its entry in `bin/check-redirects` exist, and `bin/check-redirects jorgenschaefer` passes locally. The live check, `bin/check-redirects jorgenschaefer --live`, runs at acceptance, after the DNS record and the deploys.

Besides that, this ticket leaves in place:

- `CLAUDE.md` with the check command on a line of its own (it is `npm run check` already; the script behind it becomes the real check), in exactly this form: ``Check: `npm run check` `` (the English word `Check:` at the start of the line, the command in backticks, nothing after it). The command builds, type-checks, lints, tests and runs the structural checks, and exits non-zero on any failure.
- A structural check, run by the check command, holding einsatz's test-file rule: every test file sits next to the source file it is named after, and no source file has more than one test file. Its messages name the file and the fix.
- `npm run dev` serves a page on `http://localhost:3000`, and how to start the app is written in `CLAUDE.md` or the README.

## Technical decisions
> **Stored formats** Cache im `localStorage` des Browsers unter dem versionierten Schlüssel `gewicht:v1`: `{ "fetchedAt": "<ISO-Zeit>", "measurements": [{ "time": "<ISO-Zeit>", "kg": <Zahl> }] }` mit allen rohen Messungen der abgerufenen Zeiträume; die Regel „erste Messung pro Tag“ wendet erst der Code an. Bei fehlendem, unlesbarem oder anders versioniertem Eintrag wird er verworfen und neu geladen. Das Zugriffstoken wird nicht gespeichert. Nichts wird auf dem Server gespeichert; es gibt keine bestehenden Daten zu überführen.

> **Wire formats** Die Seite bietet nach außen keine Schnittstelle. Sie liest den Gewichts-Endpunkt der Google Health API. Die OAuth-Client-ID kommt zur Build-Zeit als `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. Der Container ist als `gewicht` im `service_network` auf Port 3000 erreichbar. Zu dieser Änderung gehört im Repo `~/Projects/infrastructure`: ein Site-Block `gewicht.jorgenschaefer.de` in `hosts/jorgenschaefer/Caddyfile` mit `import security` und `reverse_proxy gewicht:3000`, der Eintrag in `bin/check-redirects`, und vor dem Deployment ein DNS-Eintrag für `gewicht.jorgenschaefer.de` auf den Host (README dort, Abschnitt zu neuen Sites).

> **Trust boundaries** Anmeldung über den Token-Client von Google Identity Services im Browser, ausgelöst durch den Klick auf „Daten abrufen“, mit nur dem Lese-Scope für Health Metrics & Measurements der Google Health API (`https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly`, am 17.10.2026 am echten Konto bestätigt). Das Zugriffstoken liegt nur im Arbeitsspeicher. Gesundheitsdaten werden nur im `localStorage` der eigenen Geräte zwischengespeichert. Ausgehende Aufrufe nur an Google (Identity Services, Health API); Schriften werden mit der App ausgeliefert (`next/font`), nicht zur Laufzeit von Google Fonts geladen. Die App sendet selbst `Cross-Origin-Opener-Policy: same-origin-allow-popups`, weil die Vorgabe `same-origin` aus `caddy/snippets.caddy` das Anmelde-Popup bricht; sendet sie eine eigene Content-Security-Policy, muss diese Google Identity Services zulassen. Das OAuth-Projekt liegt im eigenen Google-Konto; erlaubte JavaScript-Herkünfte sind `https://gewicht.jorgenschaefer.de` und `http://localhost:3000`. Keine Secrets: die Client-ID ist öffentlich.

> **Dependencies** next 16.4.2, react und react-dom 19.3.1, @mantine/core und @mantine/hooks 9.7.2, postcss 8.5.30, postcss-preset-mantine 1.18.0, postcss-simple-vars 7.0.1, typescript 7.0.2, @biomejs/biome 2.5.15, vitest 5.0.5, @vitejs/plugin-react 6.1.2, jsdom 30.1.3, @testing-library/react 16.3.3, @testing-library/dom 10.4.2, @testing-library/jest-dom 7.0.1, @testing-library/user-event 14.6.8, die passenden `@types/*`-Pakete, Node LTS im Docker-Image; das Google-Identity-Services-Skript von Google; keine Chart-Bibliothek, kein Tailwind. Dienst: Google Health API.

## Nudges
> Vorlage für Stack, Aufbau, Tests und Deployment ist `~/Projects/einsatz` (Mantine-Setup, `src/`, `biome.json`, `vitest.config.mts`, `npm run check`, Dockerfile, `docker-entrypoint.sh`, `compose.prod.yaml`, `bin/deploy-prod`), ohne Datenbank, Auth und sops.

> Tests wie in `einsatz`: neben dem Code (`*.test.ts`), eine Testdatei je Quelldatei. Fixture `src/test/fixtures/gewicht-2026-07-bis-10.csv` ist der Auszug 1.7.–17.10.2026 aus `~/Projects/patientenakte-jorgen/unterlagen/gewicht.csv` im Format `datum,kg` (ein Wert pro Tag, ohne Uhrzeit). Fälle mit mehreren Messungen pro Tag (AC-2), Uhrzeiten und dem künstlichen Ausreißer (AC-6) sind künstliche Testdaten.

> Code und Bezeichner auf Englisch nach `UBIQUITOUS_LANGUAGE.md`, Texte auf der Seite auf Deutsch.

> Bei technisch verschiedenen Optionen mit ähnlichem Aufwand die wählen, die den späteren Server (`changes/backlog/server-mit-webhook.md`) besser vorbereitet.

## Context
The repository holds no code yet: only the change's paper (`changes/`), `UBIQUITOUS_LANGUAGE.md`, placeholders so the runner can start - a `package.json` from `npm init -y` whose only script is a `check` that just prints a line, and a `CLAUDE.md` holding only the `Check:` line - which this ticket replaces with the real ones, keeping the command `npm run check`, the test fixture `src/test/fixtures/gewicht-2026-07-bis-10.csv` (tickets 04 to 07 use it), a `.gitignore` that so far holds only `.env`, and an untracked `.env` from the user's OAuth setup with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. That `.env` is the user's: it stays untracked and out of the image, `.gitignore` keeps covering it as this ticket extends the file, and no code reads, copies or relies on it. The app needs no client secret. This ticket comes before every other one, and each of them runs the check command it declares.

Google Health was confirmed on the user's real account before the tickets were written (ticket 03 carries the details); nothing here talks to Google or needs the user.

**Template.** `~/Projects/einsatz` has the stack this app uses: `package.json` scripts (there `check` = `tsc --noEmit && npm run lint && npm test`; here it also builds, as defined above), `biome.json`, `vitest.config.mts` (a `dom` and a `node` project), `postcss.config.cjs`, `tsconfig.json`, `next.config.ts`, `src/test/setup.ts`, its test-file check `src/test/test-files.test.ts`, `Dockerfile`, `docker-entrypoint.sh`, `compose.prod.yaml`, `bin/deploy-prod`. Leave out what this app has none of: database, auth, sops and `secrets.prod.env`, migrations and seeding in the entrypoint, the uploads volume, `database_network`. einsatz's health check probes `/login`; this app has only `/`. Versions are the ones the Dependencies decision lists, not einsatz's. einsatz's `CLAUDE.md` carries a Next.js agent-rules block that `next dev` writes; commit it.

**The page** served here is a placeholder; ticket 03 replaces it with the real page.

**Client ID.** `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is inlined at build time, and `bin/deploy-prod` builds the image locally, so the value has to reach `next build` inside the image build. It is public and goes into the repository: `828353772168-3lujju230hd46nvq86hrjb5sqpjh0jtc.apps.googleusercontent.com`, from the OAuth client in the user's Google account, which allows the origins `https://gewicht.jorgenschaefer.de` and `http://localhost:3000`. It goes into a committed file of its own that holds only `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, which both `npm run dev` and the image build read; which file is this ticket's decision. einsatz's `.dockerignore` keeps every `.env*` file out of the image; whatever gets the committed file past that must still keep the user's `.env` out.

**Infrastructure.** `~/Projects/infrastructure` is a separate git repository: commit the change there too, never push. Its README, section "Adding an app", lists the steps: the site block in `hosts/jorgenschaefer/Caddyfile` (`import security`, `reverse_proxy gewicht:3000`), and in `bin/check-redirects` a stand-in under the alias in `start_local_caddy` plus the expected answer in the host's checks. The host's SSH name is in that repository's `lib/`.

**Not deployed.** The DNS record for `gewicht.jorgenschaefer.de` and the deploys happen with the user at acceptance: first the gateway, which on that host also serves other sites, then the app. Record that under `## Left standing`, with the commands to run.

## Not here
- The Google module, the sign-in on the page and the header `Cross-Origin-Opener-Policy: same-origin-allow-popups`: ticket 03, with the sign-in.
- Measurement rules and cache: ticket 02. Page content: tickets 03, 05 and 06. German formatting (AC-24): tickets 03 and 05.
- The structural check for which directories may import what and where the clock is read: ticket 02, which introduces the first domain directory.
- From `CRITERIA.md`'s out of scope, for what einsatz's setup tempts you to copy (its web manifest, a colour-scheme switch):
- Öffnen der Seite ohne Netz (Service Worker).
- Dunkler Modus.
- Server, Webhook, serverseitiger Cache, Anmeldung ohne Klick bei jedem Besuch (`changes/backlog/server-mit-webhook.md`).

## Left standing

**Not deployed, and checks not run.** `bin/deploy-prod` was not run, and neither was the live check. To do at acceptance, in this order:
1. Point a DNS record for `gewicht.jorgenschaefer.de` at the jorgenschaefer host (README in `~/Projects/infrastructure`, section "Adding an app").
2. `~/Projects/infrastructure/bin/deploy-jorgenschaefer`: this deploys the gateway, which also serves the other sites on that host.
3. `~/Projects/weight-tracker/bin/deploy-prod`
4. `~/Projects/infrastructure/bin/check-redirects jorgenschaefer --live`

The infrastructure change is commit `9e9101d` in `~/Projects/infrastructure`. It has not been pushed.

**AC-22 has no automated test in this repository.** I checked it by hand:
- `docker compose -f compose.prod.yaml build` builds the image.
- `docker compose -f compose.prod.yaml up -d --wait` brings the container to healthy.
- From another container in `service_network`, `wget http://gewicht:3000/` returned the page.
- The image contains no `.env`.
- `bin/check-redirects jorgenschaefer` failed with the new expectation and passed once the site block was added.

**Decisions that would be costly to reverse:**
- The client ID lives in the committed `google-client-id.env`, a file of my own naming. `next.config.ts` reads it through `env`, so the code reads `process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID`. `next start` reads the file too, so the image carries it.
- I could not use the files Next loads on its own. Only `.env` and `.env.local` are loaded in both dev and build, and `.env` is the user's own. The `.dockerignore` patterns `.env` and `.env.*` do not match `google-client-id.env`, so that file still gets into the build.
- Names on the host: the Compose project and image are `gewicht` / `gewicht/app`, and the directory on the server is `~/gewicht`.
- The image uses Node 24.22.0. That is the current LTS; Node 26 is not LTS yet.

**Departures from the nudges and the template:**
- There is no `docker-entrypoint.sh`. Without migrations and seeding, einsatz's entrypoint only runs `exec next start`, so the Dockerfile starts `next start` directly.
- The Next.js agent-rules block is in `AGENTS.md`, not `CLAUDE.md`. Next 16.4.2 writes it there, so I committed `AGENTS.md`, and `CLAUDE.md` imports it with `@AGENTS.md`.
- The test-file check keeps only einsatz's rule that each test file has a source file beside it and no source file has two. I left out einsatz's checks for server actions, routes and pages, which test login and token handling this app does not have. I also left out its `.mjs` case, because Vitest here only runs `.ts`/`.tsx`.
- `next dev` and `next build` load the user's local `.env` themselves; Next prints "Environments: .env". No app code uses its values, and the `GOOGLE_*` names carry no `NEXT_PUBLIC_` prefix, so nothing from it reaches the page.
- The app has no `next/font` yet. The placeholder uses Mantine's system font stack and loads no web font. The decision "fonts shipped with the app, not from Google Fonts" still holds, and it applies once a page chooses a font.
