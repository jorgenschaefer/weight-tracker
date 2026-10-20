# weight-tracker

A small web page that reads one person's weight from Google Health and
says, in one sentence and one colour, whether they are still losing weight. The page is
in German ("Gewicht"); the code is in English.

It is a personal project, built for one person and one phone. It is public so
others can read it, borrow from it or run their own copy.

## What the page shows

- **The verdict** (*Urteil*): an Ampel - green where the weight is very
  probably going down by more than 0.1 kg a week, red where it very probably
  is not, yellow in between - which colours the whole screen; a sentence
  about this morning ("Du nimmst seit 6 Tagen ab."), and above it how
  certain the likelier side is ("90 % sicher, dass du abnimmst").
- **Four figures** of the last day with a measurement: the estimated weight,
  the measured one, the pace in kg per week and the calories a day it stands
  for, each estimate with its uncertainty.
- **A graph of the last six weeks, of this month and the two before, or of
  this calendar year**, switched above it: the measurements, the estimated
  weight as a line inside a band of ± its uncertainty, and the outliers.
- **A field to enter today's weight**, which writes it to Google Health.

The verdict comes from a Kalman filter of weight and pace, stepping from one
day with a measurement to the next, so a gap needs no special handling; a
measurement far off what it expected counts less. Only the first measurement
of a calendar day counts. The graph draws the same filter's estimate.

`UBIQUITOUS_LANGUAGE.md` defines every term and threshold, with the word the
page uses and the name the code uses.

## How it works

There is no server-side logic and no database. The page runs in the browser:

1. It signs in with Google Identity Services for a short-lived access token
   and keeps it in `localStorage` until it expires (about an hour), so a
   reload within that time fetches without signing in again. Any script on
   the page can read it there; "Abmelden" removes it.
2. It fetches the weight measurements from the Google Health API and keeps
   them in `localStorage` in that browser.
3. Everything else - trend, verdict, graph - is computed in the browser from
   that cache.

Next.js only serves the page. Your measurements go from Google to your
browser and nowhere else. "Abmelden" revokes the page's access.

## Running your own copy

You need your own Google OAuth client; the one in `google-client-id.env`
only accepts this project's own origins.

1. In the [Google Cloud Console](https://console.cloud.google.com/), create a
   project and enable the Google Health API.
2. Set up the OAuth consent screen with these scopes, and add your Google
   account as a test user:
   - `https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly`
   - `https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.writeonly`
3. Create an OAuth client ID of type *Web application* and add
   `http://localhost:3000` (and the origin you deploy to) as an authorized
   JavaScript origin.
4. Put the client ID in `google-client-id.env`:

   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your client ID>.apps.googleusercontent.com
   ```

5. Install and start:

   ```sh
   npm ci
   npm run dev
   ```

   and open http://localhost:3000.

The client ID is not a secret; it is inlined into the page at build time.

Calendar days are those of Europe/Berlin, and the page text is German. Both
are fixed in the code.

### Deploying

`Dockerfile` builds a production image that runs `next start` on port 3000.
`bin/deploy-prod` and `compose.prod.yaml` are this project's own deployment
(build locally, copy over SSH, run behind Caddy); adapt them or use the
Dockerfile with your own setup. Google sign-in needs the page served over
HTTPS everywhere but localhost.

## Development

Requires Node.js 24.

| Command | What it does |
|---|---|
| `npm run dev` | Serves the app on http://localhost:3000 |
| `npm run check` | Type-checks, lints, tests and builds; the work is done when it is green |
| `npm test` / `npm run test:watch` | Runs the tests (Vitest) once / in watch mode |
| `npm run format` | Applies the Biome formatter |
| `bin/render-icons` | Renders the PNG icons and favicon from the SVGs in `src/app/` |

Stack: Next.js (App Router), React, TypeScript, Mantine, Vitest with Testing
Library, Biome.

### Layout

- `src/measurement/` - measurements, calendar days, gaps, the cache, and
  `google-health.ts`, the only code that talks to Google.
- `src/trend/` - the trend, outliers and pace.
- `src/verdict/` - the verdict and what the page says on a day.
- `src/app/` - the page: React components and hooks, the only code that
  reads the clock.
- `src/test/` - shared test helpers, a fixture of test data, and structural
  tests that keep the layout honest.

The domain directories are pure TypeScript and import only downwards
(`verdict` → `trend` → `measurement`). Tests sit beside the code, one test
file per source file. `src/test/domain-boundaries.test.ts` and
`src/test/test-files.test.ts` enforce both rules.

### How it is built

The project is developed with [Claude Code](https://claude.com/claude-code).
`CLAUDE.md` holds the conventions it works by, `.claude/skills/` the
project's own skills (for example `run`, which drives the page on any date of
the test data without Google), and `changes/backlog/` the ideas not built yet
(in German).

## License

Copyright (C) 2026 Jorgen Schaefer

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU Affero General Public License as published by the Free
Software Foundation, either version 3 of the License, or (at your option) any
later version. If you run a modified version for others over a network, you
must offer them its source. See [`LICENSE`](LICENSE).
