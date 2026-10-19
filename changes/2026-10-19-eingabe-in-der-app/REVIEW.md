# Review: Gewicht auf der Seite eintragen

## For you

1. **Not tried against the real Google** (01). The `writeonly` scope has to go on the OAuth consent screen first. Until then the POST body, `utcOffset`, the operation answer and the 403 are proven only against stubs and the stand-in.
2. **Not tried on a real phone** (01, 03). Nobody has checked that the sign-in popup from „Eintragen“ gets through a real popup blocker, that the number keyboard appears, or that field and „Eintragen“ stay visible above the open keyboard on iOS Safari, which ignores `interactive-widget=resizes-content`.
3. **The new point can sit under the „+“** (03, review). With a full cache at 360 × 640 and the page at the top, the button covers the right end of the graph, newest point included. AC-10 only asks for it to be free when scrolled to the bottom, and the value shows in „Letzte Messung“ and Gemessen at once.
4. **The button grows while saving** (01). „Wird gespeichert …“ is longer than „Eintragen“, so the field shrinks for as long as the save runs.
5. **„Abmelden“ in another tab while this tab saves** (02) can let this tab store the value again. This tab's cache and token were never cleared by another tab's „Abmelden“ anyway.

## What this review did

There was one round. The critique ran in a fresh context against CRITERIA.md and the problem. It drove the page through the run skill's Google stand-in in headless Chromium at 360 × 640 and 1440 × 900, covering AC-1 to AC-14 including the failures, the 20 s timeout, a read-only grant, reload and „Abmelden“. It found no blockers and no should-fix findings. Its one nit is fixed in 9f2ed8a: the run skill's clean-up now also removes `gewicht:eingetragen:v1`. That fix changes no screen, so no second round was run. `npm run check` is green after it (29 files, 575 tests).

## Findings the builds left standing, settled

- **`useMeasurements.test.tsx` over 420 lines** (01, should-fix). The 420 target was there so 02 could add to the file without splitting it. 02 split the hook instead (`useEnteredMeasurements.ts`). The file now has 427 lines, under the standard's 500, and the critique found nothing to report on sizes. No fix made.
- **Placeholder turning red on a refused empty field** (03, should-fix). Fixed in the build and pinned by a test. This review's driving refused an empty field at both sizes and reported nothing wrong. Nobody looked at the placeholder's colour specifically.

## Left for acceptance

- The colours the specimen does not settle for levels 2 and 3 (`sheetColours` in `EntrySheet.tsx`, 03) were checked by 03's reviews only.
- 03 departed from the `Affix` nudge and used an `ActionIcon` with its own `position: fixed` class instead. The build gave its reasons in its ticket, and this review saw no problem with it.
- The sign-in decisions AC-4 and AC-8 leave open (01). A sign-in is kept only after a save succeeds, so a retry after a failed save opens the popup again.
