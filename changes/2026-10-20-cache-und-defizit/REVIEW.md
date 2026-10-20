## For you

No fix here needs your decision, and none departs from a nudge or a technical decision. Still open:

- **Nobody has walked either part in a real browser since the builds** (review, 02). Neither review round had claude-in-chrome. Ticket 01's build checked AC-1 to AC-3 in headless Chrome. Nobody has seen 3.7. („Bilanz 0 ± 560 kcal/Tag“), 20.10. („Defizit“) or a day with a positive Tempo in the running page, at 360 px or at full width. The jsdom tests in `src/app/Verdict.test.tsx` render both days.
- **Two backlog items are solved but still on the backlog** (review): `changes/backlog/run-skill-cache-sichern.md` and `changes/backlog/defizit-bei-tempo-null.md`. Past acceptance commits dropped such items, so I left them for acceptance.
- **The run skill finds the dev server through `.next/dev/lock`** (01). It reads the file's `port` field as Next.js 16 writes it, so a change to that format in Next.js breaks step 1 of `SKILL.md`.
- **The test-layout check now lets a `.test.ts` test a `.js` or `.mjs` source** (review). I made this change so that the snippets' new tests can sit beside them. Vitest now also runs `.claude/skills/**/*.test.ts`.
- **Nit: the fourth figure has no single name** (review, 02). `balanceFigure` in `src/app/Verdict.tsx` decides all three labels. The glossary uses „Bilanz“ only for the zero case and calls the figure `kcalPerDay`.
- **Nit: `testFilesOf` and `example` in `src/test/test-files.ts` read `SOURCE_EXTENSIONS` backwards** (review). They treat it as "source → test extensions" where it is "test → source". Today this gives no wrong result, but whoever widens the map next also changes the rule against two test files.

## Findings not fixed

- The two nits above. Both are names and structure, and neither gives a wrong result. Settling the first needs a name for the figure, which the glossary would have to give.
- Round 1 also pointed out that each of the three snippets builds its own refusal message. Each snippet is pasted into the browser on its own, so they cannot share code, and this stays as it is.

## Fixes

Round 1 found one should-fix and no blockers. Nothing tested the check of the host at the top of the three snippets, which is all that keeps a walk away from the person's own `localStorage` (AC-1, AC-3). 259715b adds `walk-on.test.ts`, `google-stand-in.test.ts` and `fixture-snippet.test.ts` beside the snippets, with the helper `src/test/browser-snippet.ts`. On localhost:3000, 127.0.0.1:3001 and the deployed page, each snippet must throw naming walk.localhost with the page's port, or the `.next/dev/lock` hint where the page has no port. It must also write nothing and replace nothing. On walk.localhost it must do its work. With the checks of the host disabled, the 9 refusal tests failed. These tests also confirm ticket 01's fix after its review, the message on a page without a port.

dc0660b answers a nit from round 1. `SKILL.md` step 1 now says that no dev server runs when there is no lock file or the `curl` fails.

Round 2 reviewed those two commits and found only nits. I fixed two of them after it, and **no reviewer has seen these fixes**:
- b78e299: the fake `localStorage` also records property writes and `delete`. A `localStorage["gewicht:v1"] = …` above the check now fails the tests, which I tried.
- a09f095: step 1 names `node -p` as the command that fails, and the lines are rewrapped.

I checked the builds' fixes after their last reviews against the findings they answer. Ticket 01's message without a port is now pinned by the tests above. Ticket 02's new test title says what the test checks. Neither needed more.

## Checks

`npm run check` is green on a09f095 (34 test files, 953 tests). Not run: a walk in a real browser (see above), and a real Google sign-in on walk.localhost, which the criteria rule out.
