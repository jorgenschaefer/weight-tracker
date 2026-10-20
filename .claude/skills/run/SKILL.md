---
name: run
description: Start the weight-tracker page locally and drive it on any date of the test data, without Google - for walking acceptance criteria or checking a change in the real page.
---

# Run the page

1. `npm run dev` serves http://localhost:3000 (run it in the background).
2. Open the page in Chrome (claude-in-chrome). Without a cache it shows the
   first visit: the status line „Google Health, nicht angemeldet“ with ⟳
   beside it, one sentence and the hint to tap the line.

If the page shows code older than the working tree, look for a service
worker another project registered for localhost:3000
(`navigator.serviceWorker.getRegistrations()`); this app has none.

## The page on a date of the test data

1. Once per browser profile, and again after either CSV changes: `node .claude/skills/run/fixture-snippet.mjs`
   prints a snippet; run it on the page (javascript tool). It stores the
   test data under `walk:fixture`: the extract
   `src/test/fixtures/gewicht-2026-07-bis-10.csv` and 18.10. to 20.10. from
   `gewicht-2026-10-18-bis-20.csv`. If `walk:fixture` holds fewer days
   than the snippet reports (a profile stored before 18.10. to 20.10. were
   added has 97), run it again.
2. Run `walk-on.js` on the page once. Then `await walkOn("2026-08-30")`
   returns the surface's colour and the page's text on that day;
   `{ keep: true }` leaves the frame open to screenshot, and `only` puts
   made-up measurements in place of the test data.

Measurements of the test data are at 07:00 Berlin. A fetch from this state
goes to the real Google.

To move the clock of the page itself (for example to let its kept token
expire), replace `window.Date` with a subclass whose `now()` and whose
constructor without arguments are both later, as `walk-on.js` does - the
page reads the clock both ways - and dispatch `visibilitychange` on
`document`. The page drops an expired token on that event as well as on a
timeout at the moment it expires, which a moved clock does not bring
forward.

## Signing in, fetching and entering without Google

Only the deployed page at https://gewicht.jorgenschaefer.de asks Google for
the scope to write; a real sign-in here only reads, and the page answers
„Eintragen“ with writing not granted. Never drive „Eintragen“ on the
deployed page: it enters into the person's real weights. To drive
„Eintragen“, sign-in and fetching here, run
`google-stand-in.js` on the page once it has loaded (javascript tool). It
puts a Google in memory in place of the real one until the next reload;
`window.standIn` holds its measurements and how it answers - grants only
reading, declines, hangs, answers 403 - and every request the page sent.
Its header lists the settings.

Under `next dev`, Next.js's round badge at the bottom left lies over
„Abmelden“ in the sheet of the status line at 360 px and takes a pointer's
click; focus the button and press Enter instead.

The page keeps the token of each sign-in under `gewicht:token:v1` until it
expires and fetches with it at once when opened again. A reload removes the
stand-in, so the page then sends the stand-in's token to the real Google,
which rejects it. To see the page opened again with the token, call
`await standInReopen()` in place of the reload: it opens the page anew in a
frame whose Google is the same stand-in, with the same measurements and
tokens. `walkOn` removes the entry before it opens the page.

## Clean up

Remove `walk:fixture`, `gewicht:v1`, `gewicht:eingetragen:v1` and
`gewicht:token:v1` from `localStorage` (or tap the status line and
„Abmelden“ in its sheet), close the frames, and stop the dev server.
