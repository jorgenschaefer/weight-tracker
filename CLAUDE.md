# weight-tracker

Shows the trend of one person's weight from Google Health (Next.js App Router,
React 19, TypeScript, Mantine 9). Code in English, the page in German; the
names come from `UBIQUITOUS_LANGUAGE.md`.

Check: `npm run check`

It type-checks (`tsc --noEmit`), lints and checks formatting (Biome), runs
the tests (Vitest) including the structural checks, and builds (`next build`),
stopping at the first failure. The work is done when it is green.

## Code layout

- Domain code lives in feature directories under `src/` named after the
  glossary, starting with `src/measurement/`. It is pure: no React, Next.js,
  Mantine or browser API, and "now" comes in as a parameter. The one
  exception is `src/measurement/google-health.ts`, the only code that talks
  to Google: it may use the browser, though still no React, Next.js or
  Mantine.
- Domain directories import only downwards - `src/verdict/` from
  `src/trend/` and `src/measurement/`, `src/trend/` from `src/measurement/` -
  and never from `src/app/`; tests may also import from `src/test/`. Only
  `src/app/` reads the clock, and no test outside it does.
  `src/test/domain-boundaries.test.ts` enforces this, and each of its messages
  names the file and the fix.

## Running

- `npm run dev` serves the app on http://localhost:3000.
- `npm run build` / `npm start` build and start it for production.
- `npm run format` applies the Biome formatter.
- `npm run test:watch` runs Vitest in watch mode.
- `bin/render-icons` renders the manifest's PNGs in `public/` and
  `src/app/favicon.ico` from `src/app/app-icon.svg` and `src/app/icon.svg`;
  run it after changing either SVG.

The public Google OAuth client ID is in `google-client-id.env`, which
`next.config.ts` reads for every build. A local `.env` is the user's own: it
stays out of git and the image, and while `next dev` and `next build` load
it, no code of the app uses its values.

## Deploying

`bin/deploy-prod` builds the image locally from `compose.prod.yaml`, carries
it to the jorgenschaefer host over SSH and starts it as the container
`gewicht` in `service_network` on port 3000. Caddy in `~/Projects/infrastructure`
serves it at https://gewicht.jorgenschaefer.de.

## Tests

- Vitest and Testing Library; tests sit beside the code (`Foo.tsx` →
  `Foo.test.tsx`). `*.test.tsx` runs under jsdom, `*.test.ts` under Node;
  a `.test.ts` also tests a browser snippet in `.js` or `.mjs`, as in
  `.claude/skills/run/`.
- One test file per source file, named after it; no topic files like
  `Foo.bar.test.tsx`. `src/test/test-files.test.ts` enforces it, and each of
  its messages names the file and the fix.
- TDD: every change of behaviour is pinned by a test that fails first.

## Accepting a change

The „+“ button may lie on the graph's newest days on a short screen; that
is accepted, do not file it.

@AGENTS.md
