---
criteria:  CRITERIA.md
closes:    AC-1, AC-2, AC-3
advances:  
after:     
status:    ready
attempts:  0
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
