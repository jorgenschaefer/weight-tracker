---
criteria:  CRITERIA.md
closes:    AC-1, AC-2, AC-3, AC-4, AC-5, AC-6
advances:  
after:     
status:    ready
attempts:  0
---

## Build
The access token of each sign-in, with its expiry and whether it may write, kept in `localStorage` under `gewicht:token:v1`, so a page opened before that expiry holds it as if signed in during this visit and fetches at once; dropped on „Abmelden“, on expiry and when Google rejects it.

## Done when
> **AC-1** Lädt man die Seite vor dem Ablaufzeitpunkt neu, den Google bei der letzten Anmeldung für das Zugriffstoken genannt hat (etwa eine Stunde danach), auch in einem neuen Tab oder nach erneutem Öffnen der installierten App, öffnet sich kein Anmelde-Popup: Die Seite ruft sofort von selbst ab, zeigt dabei dieselbe Anzeige wie bei einem Abruf nach Klick, und „Daten abrufen“ bleibt verborgen wie vor dem Neuladen.

> **AC-2** Erlaubte diese Anmeldung das Eintragen, trägt „Eintragen“ nach einem solchen Neuladen ohne Anmelde-Popup ein. Erlaubte sie es nicht, öffnet „Eintragen“ nach dem Neuladen das Anmelde-Popup, wie heute.

> **AC-3** Ist dieser Ablaufzeitpunkt beim Öffnen erreicht, fragt die Seite Google nicht, sondern zeigt den Cache und „Daten abrufen“ ohne Fehlermeldung und ruft nicht von selbst ab, wie heute.

> **AC-4** Lehnt Google das Token beim Abruf nach dem Neuladen ab (etwa nach Widerruf im Google-Konto), zeigt die Seite die Fehlermeldung und „Daten abrufen“ wie heute, und ein weiteres Neuladen ruft nicht wieder von selbst ab.

> **AC-5** Nach „Abmelden“ zeigt ein Neuladen den Zustand des ersten Besuchs und ruft nicht von selbst ab. „Abmelden“ widerruft den Zugriff weiterhin mit dem Token, solange es gilt.

> **AC-6** Ist der gespeicherte Eintrag des Tokens unlesbar oder anders aufgebaut, verhält sich die Seite wie ohne Anmeldung.

## Technical decisions
> **Stored formats** Neuer `localStorage`-Schlüssel `gewicht:token:v1` mit `{ "token": "<Zugriffstoken>", "expiresAt": "<ISO-Zeit>", "writeGranted": <bool> }`. Geschrieben bei jeder Anmeldung. Entfernt bei „Abmelden“, wenn die Seite ihn abgelaufen vorfindet, und wenn Google das Token ablehnt, dann aber nur, solange der Eintrag noch dieses Token hält: ein anderer Tab kann inzwischen ein neueres abgelegt haben. Ein fehlender, unlesbarer oder anders aufgebauter Eintrag wird verworfen. `gewicht:v1` bleibt unverändert. Es gibt keine bestehenden Daten zu überführen.

> **Wire formats** keine.

> **Trust boundaries** Das Zugriffstoken (Lesen, wo erlaubt auch Schreiben) liegt im `localStorage` und ist für jedes Skript der Seite lesbar. Es bleibt dort bis zum nächsten Öffnen nach seinem Ablauf, bis „Abmelden“ oder bis Google es ablehnt; brauchbar ist es nur bis zu seinem Ablaufzeitpunkt, etwa eine Stunde nach der Anmeldung. Das ersetzt „nur im Arbeitsspeicher“. Keine neuen ausgehenden Aufrufe, keine Secrets.

> **Dependencies** keine.

## Nudges
> `HeldToken`, `hasExpired`, `maySave` sowie Lesen und Schreiben des gespeicherten Eintrags ziehen aus `useMeasurements.ts` in ein reines Modul `src/app/held-token.ts`, mit „jetzt“ als Parameter. Die Regel, wann ein gehaltenes Token gilt, hat dort ihren einen Ort.

> Der Zugriff auf `localStorage` steht neben `loadCache`/`saveCache` in `useMeasurements.ts`.

> Der Abruf beim Öffnen läuft über dasselbe `fetchData(cache, token)` wie der Klick.

> Der run-Skill kommt mit dem neuen Schlüssel zurecht: `.claude/skills/run/walk-on.js` entfernt `gewicht:token:v1`, bevor es die Seite öffnet, damit kein echtes Token einen Abruf bei Google auslöst und kein Token des Stand-ins in den nächsten Gang mitgeht; der Kopf von `google-stand-in.js` sagt nicht mehr, dass Neuladen alles rückgängig macht; das Aufräumen in `.claude/skills/run/SKILL.md` nennt `gewicht:token:v1` neben `gewicht:v1` und `gewicht:eingetragen:v1`.

> Die Kommentare, die „in memory only“ sagen (`google-health.ts`, `useMeasurements.ts`), und die Beschreibung im README werden angepasst. An der Ablage erklärt ein Kommentar, warum das Token gespeichert wird.

## Context
What exists: `useMeasurements` in `src/app/useMeasurements.ts` holds the token of a sign-in in this visit as a `HeldToken` (`token`, `expiresAt` in epoch milliseconds, `writeGranted`) in React state, built by `held()` from `signIn()`'s `SignedIn`. While it holds one, `signedIn` is true and `FetchButton` in `page.tsx` hides „Daten abrufen“. `fetchData` signs in where it holds none, drops the token on `tokenRejected`, and `enter` and `logOut` (`revoke`) use `maySave`/`hasExpired`. The cache is read in the mount effect beside `loadGoogleSignIn()`; the hook returns `null` until then. While it holds a token, a `visibilitychange` back into view fetches again after 5 minutes or drops an expired token.

`revoke` in „Abmelden“ signs in anew where the visit holds no valid token; storing that sign-in, or one a log-out overtook, would break AC-5.

The tests of the hook sit in `src/app/useMeasurements.test.tsx`, run on the page through `src/test/open-page.tsx`, whose `standInForGoogle` clears `localStorage` before each test. `held-token.ts` gets its own `held-token.test.ts`, as `src/test/test-files.test.ts` requires.

The move of `HeldToken`, `hasExpired` and `maySave` into `held-token.ts`, with behaviour unchanged, is its own commit before the behaviour change.

## Not here
- Out of scope: Anmeldung ohne Klick, nachdem das Token abgelaufen ist (`changes/backlog/server-mit-webhook.md`).
- Out of scope: Abrufen ohne Neuladen, solange die Seite offen und sichtbar bleibt (`changes/backlog/abrufen-ohne-neuladen.md`).
- Out of scope: Dass „Abmelden“ in einem Tab auf andere, schon offene Tabs wirkt.

## Left standing
