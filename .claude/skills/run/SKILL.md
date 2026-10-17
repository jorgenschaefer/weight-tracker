---
name: run
description: Start the weight-tracker page locally and drive it on any date of the test data, without Google - for walking acceptance criteria or checking a change in the real page.
---

# Run the page

1. `npm run dev` serves http://localhost:3000 (run it in the background).
2. Open the page in Chrome (claude-in-chrome). Without a cache it shows the
   first visit: one sentence and „Daten abrufen“.

If the page shows code older than the working tree, look for a service
worker another project registered for localhost:3000
(`navigator.serviceWorker.getRegistrations()`); this app has none.

## The page on a date of the test data

1. Once per browser profile: `node .claude/skills/run/fixture-snippet.mjs`
   prints a snippet; run it on the page (javascript tool). It stores the
   fixture `src/test/fixtures/gewicht-2026-07-bis-10.csv` under
   `walk:fixture`.
2. Run `walk-on.js` on the page once. Then `await walkOn("2026-08-30")`
   returns the headline's emphasis and the page's text on that day;
   `{ keep: true }` leaves the frame open to screenshot, and `only` puts
   made-up measurements in place of the test data.

Measurements of the test data are at 07:00 Berlin. A fetch from this state
goes to the real Google.

To move the clock of the page itself (for example to see it fetch again on
coming back into view after a real sign-in), replace `window.Date` with a
subclass whose `now()` is later and dispatch `visibilitychange` on
`document`.

## Clean up

Remove `walk:fixture` and `gewicht:v1` from `localStorage` (or click
„Abmelden“), close the frames, and stop the dev server.
