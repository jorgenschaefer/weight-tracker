---
name: run
description: Start the weight-tracker page locally and drive it on any date of the test data, without Google - for walking acceptance criteria or checking a change in the real page.
---

# Run the page

The walk goes through the page on http://walk.localhost:<port>, never on
localhost:<port>: `localStorage` belongs to the origin, so what the walk
stores and removes on walk.localhost leaves the person's own entries on
http://localhost:3000 in the same browser profile as they are. Chrome
resolves every subdomain of `localhost` to this machine, and `next dev`
serves them without `allowedDevOrigins`. The three snippets below throw on
any other host before they touch anything, and name the address to use.

1. Use the dev server that already runs, whoever started it: Next.js allows
   one `next dev` per project and writes its port to `.next/dev/lock`.
   `node -p 'JSON.parse(require("fs").readFileSync(".next/dev/lock")).port'`
   prints it, and `curl -s -o /dev/null http://walk.localhost:<port>/`
   succeeds while it runs (the lock file can outlive a server that crashed).
   Where the command fails because there is no lock file, or the `curl`
   fails, none runs. Only if none runs, start one with `npm run dev` in the background
   (port 3000 unless that is taken) and read its port the same way.
2. Open http://walk.localhost:<port> in Chrome (claude-in-chrome). Without a
   cache it shows the first visit: the status line „Google Health, nicht
   angemeldet“ with ⟳ beside it, one sentence and the hint to tap the line.

A real sign-in with Google does not work on walk.localhost: Google accepts
it only from the origins the OAuth client lists, and walk.localhost is not
one of them. The walk needs none; signing in, fetching and entering go
through the stand-in below.

If the page shows code older than the working tree, look for a service
worker another project registered for walk.localhost:<port>
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

Measurements of the test data are at 07:00 Berlin.

To move the clock of the page itself (for example to let its kept token
expire), replace `window.Date` with a subclass whose `now()` and whose
constructor without arguments are both later, as `walk-on.js` does - the
page reads the clock both ways - and dispatch `visibilitychange` on
`document`. The page drops an expired token on that event as well as on a
timeout at the moment it expires, which a moved clock does not bring
forward.

## Signing in, fetching and entering without Google

To drive signing in, fetching and „Eintragen“, run `google-stand-in.js` on
the page once it has loaded (javascript tool). It puts a Google in memory in
place of the real one until the next reload; `window.standIn` holds its
measurements and how it answers - grants reading and writing, only reading,
declines, hangs, answers 403 - and every request the page sent. Its header
lists the settings. Never drive „Eintragen“ on the deployed page at
https://gewicht.jorgenschaefer.de: it enters into the person's real weights.

Under `next dev`, Next.js's round badge at the bottom left lies over
„Abmelden“ in the sheet of the status line at 360 px and takes a pointer's
click; focus the button and press Enter instead.

The page keeps the token of each sign-in under `gewicht:token:v1` until it
expires and fetches with it at once when opened again. A reload removes the
stand-in, and the page opened again fails to fetch with the stand-in's
token. To see the page opened again with the token, call
`await standInReopen()` in place of the reload: it opens the page anew in a
frame whose Google is the same stand-in, with the same measurements and
tokens. `walkOn` removes the entry before it opens the page.

## Clean up

On walk.localhost, remove `walk:fixture`, `gewicht:v1`,
`gewicht:eingetragen:v1` and `gewicht:token:v1` from `localStorage` (or tap
the status line and „Abmelden“ in its sheet), and close the frames. Stop the
dev server only if the walk started it. Leave the `localStorage` of
localhost:3000 alone, earlier walks' `walk:fixture` there included.
