---
criteria:  CRITERIA.md
closes:    AC-1, AC-2, AC-3
advances:  
after:     
status:    done
attempts:  1
---

## Build
Der run-Skill geht die Seite auf `http://walk.localhost:<Port>` durch statt auf localhost:3000, sodass ein Walk den `localStorage` von localhost:3000 nicht berührt; die drei Snippets weigern sich auf jedem anderen Host.

## Done when
> **AC-1** Wer die Seite mit dem run-Skill durchgeht – Testdaten speichern, `walkOn`, Anmelden, Abrufen und Eintragen über den Stand-in, `standInReopen` und Aufräumen nach `SKILL.md` –, findet danach im `localStorage` von http://localhost:3000 im selben Browserprofil dieselben Einträge mit denselben Werten wie vorher.

> **AC-2** `SKILL.md` lässt die Seite auf `http://walk.localhost:<Port>` durchgehen, mit dem Port des Dev-Servers, der schon läuft (bei `npm run dev` 3000), auch eines selbst gestarteten; nur wenn keiner läuft, startet der Skill einen. Dort gehen Testdaten speichern, `walkOn`, der Stand-in mit Anmelden, Abrufen, Eintragen und `standInReopen`, und das Verstellen der Uhr wie heute auf localhost:3000. Eine echte Anmeldung bei Google geht dort nicht, und `SKILL.md` sagt das, statt von einer echten Anmeldung oder einem Abruf beim echten Google auf dieser Seite zu sprechen.

> **AC-3** Läuft eines der drei Snippets – das von `fixture-snippet.mjs` ausgegebene, `walk-on.js` oder `google-stand-in.js` – auf einem Host außer `walk.localhost`, gleich welcher Port, schreibt und löscht es nichts im `localStorage`, ersetzt weder Google noch `fetch` und wirft einen Fehler, der `http://walk.localhost` mit dem Port der Seite nennt, auf der es lief (etwa http://walk.localhost:3000 auf localhost:3000).

## Technical decisions
> **Stored formats** keine. Was der Skill auf `walk.localhost` speichert, liegt dort unter denselben Schlüsseln; `walk:fixture` muss dort einmal neu gespeichert werden.

> **Wire formats** keine. `walkOn`, `standIn` und `standInReopen` behalten Namen und Optionen.

> **Trust boundaries** keine. Auf `walk.localhost` geht keine echte Anmeldung bei Google; der Skill braucht keine.

> **Dependencies** keine.

## Nudges
> Die Prüfung des Hosts steht in jedem Snippet zuerst, vor allem anderen.

> `next.config.ts` bleibt unverändert: Subdomains von `localhost` lässt der Dev-Server ohne `allowedDevOrigins` zu.

## Context
Der run-Skill liegt in `.claude/skills/run/`: `SKILL.md`, `fixture-snippet.mjs` (gibt das Snippet aus, das die Testdaten unter `walk:fixture` speichert), `walk-on.js` (`walkOn`, schreibt `gewicht:v1` und entfernt `gewicht:token:v1`) und `google-stand-in.js` (`standIn`, `standInReopen`). Alle nennen heute localhost:3000; `SKILL.md` lässt beim Aufräumen die Schlüssel der Seite entfernen, was auf dem Origin der Walks so bleiben kann.

`localStorage` gehört zum Origin, und Chrome löst jede Subdomain von `localhost` auf die eigene Maschine auf. Next.js 16 lässt nur ein `next dev` pro Projekt zu (`.next/dev/lock`); deshalb nutzt der Skill den Server, der schon läuft, über `walk.localhost` mit dessen Port.

Die Snippets laufen im Browser und haben keine Tests unter Vitest; das Durchgehen auf `walk.localhost` und auf localhost:3000 zeigt AC-1 bis AC-3.

## Not here
Die vierte Zahl („Bilanz“) baut 02. Eine echte Anmeldung bei Google auf `walk.localhost` gehört nicht dazu, und was schon im `localStorage` von localhost:3000 liegt, auch frühere Testdaten von Walks, bleibt unangetastet.

## Left standing

- **Fix after the last review** (answers the review's only finding, a nit:
  on a page whose URL has no port, such as https://gewicht.jorgenschaefer.de,
  the refusal named http://walk.localhost, i.e. port 80, where no dev server
  listens): there the three snippets now name
  `http://walk.localhost:<port of the dev server, in .next/dev/lock>`. With a
  port in the URL the message is unchanged (http://walk.localhost:3000 on
  localhost:3000). No reviewer saw this fix. I checked the printed fixture
  snippet with a stubbed `location` and the other two by reading them.
- **No automated test proves AC-1, AC-2 or AC-3.** As the ticket's Context
  says, the snippets have no Vitest tests (the test layout check covers only
  `.ts`/`.tsx` sources). I checked them in headless Chrome over the DevTools
  protocol, with one throwaway profile and the `next dev` on port 3000. The
  reviewer did the same check again on its own.
  - AC-3: on localhost:3000 and on 127.0.0.1:3000, each snippet threw with
    http://walk.localhost:3000 in its message. `localStorage` was unchanged,
    `walkOn`, `standIn` and `standInReopen` stayed undefined, and `fetch`
    and `initTokenClient` stayed the real ones. Before the change, the same
    run on localhost:3000 stored `walk:fixture` and replaced `fetch`.
  - AC-2: on walk.localhost:3000 the first visit showed. The fixture snippet
    stored 100 days and `walkOn("2026-08-30")` returned the verdict. Through
    the stand-in, signing in, fetching, „Eintragen“ (POST) and
    `standInReopen` all worked, and moving the page's clock dropped the kept
    token. The `.next/dev/lock` command in `SKILL.md` printed 3000.
  - AC-1: I seeded localhost:3000 with `gewicht:v1`, `gewicht:eingetragen:v1`,
    `gewicht:token:v1` and an old `walk:fixture`, then did the whole walk and
    the cleanup on walk.localhost. Afterwards localhost:3000 held exactly the
    same entries with the same values.
  - Not checked: a real Google sign-in on walk.localhost. `SKILL.md` says it
    does not work, because walk.localhost is not an origin the OAuth client
    lists. The ticket rules it out, so I did not try it.
- **Decision that spreads:** `SKILL.md` finds the running dev server through
  `.next/dev/lock` (its `port` field), as Next.js 16 writes it, and confirms
  it with a `curl` to walk.localhost, since the file can outlive a server
  that crashed. This depends on that file's format in Next.js.
