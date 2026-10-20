# Criteria: Nach dem Neuladen angemeldet bleiben

## Problem
Nach jedem Neuladen der Seite muss man sich wieder bei Google anmelden: „Daten abrufen“ öffnet wieder das Anmelde-Popup, auch wenn die letzte Anmeldung erst Minuten zurückliegt. Stattdessen soll ein Neuladen kurz nach einer Anmeldung, auch in einem neuen Tab oder nach erneutem Öffnen der installierten App, ohne neue Anmeldung auskommen. Der Fall, um den es geht, ist das Neuladen innerhalb der Zeit, die Google die Anmeldung gelten lässt; das Öffnen am nächsten Tag ohne Klick gehört zum Server (`changes/backlog/server-mit-webhook.md`).

Einen konkreten, festgehaltenen Fall gibt es nicht; das Backlog-Item (`changes/backlog/anmeldung-nach-neuladen.md`) beschreibt das Verhalten, wie es jede Anmeldung zeigt.

## Acceptance criteria
- **AC-1** Lädt man die Seite vor dem Ablaufzeitpunkt neu, den Google bei der letzten Anmeldung für das Zugriffstoken genannt hat (etwa eine Stunde danach), auch in einem neuen Tab oder nach erneutem Öffnen der installierten App, öffnet sich kein Anmelde-Popup: Die Seite ruft sofort von selbst ab, zeigt dabei dieselbe Anzeige wie bei einem Abruf nach Klick, und „Daten abrufen“ bleibt verborgen wie vor dem Neuladen.
- **AC-2** Erlaubte diese Anmeldung das Eintragen, trägt „Eintragen“ nach einem solchen Neuladen ohne Anmelde-Popup ein. Erlaubte sie es nicht, öffnet „Eintragen“ nach dem Neuladen das Anmelde-Popup, wie heute.
- **AC-3** Ist dieser Ablaufzeitpunkt beim Öffnen erreicht, fragt die Seite Google nicht, sondern zeigt den Cache und „Daten abrufen“ ohne Fehlermeldung und ruft nicht von selbst ab, wie heute.
- **AC-4** Lehnt Google das Token beim Abruf nach dem Neuladen ab (etwa nach Widerruf im Google-Konto), zeigt die Seite die Fehlermeldung und „Daten abrufen“ wie heute, und ein weiteres Neuladen ruft nicht wieder von selbst ab.
- **AC-5** Nach „Abmelden“ zeigt ein Neuladen den Zustand des ersten Besuchs und ruft nicht von selbst ab. „Abmelden“ widerruft den Zugriff weiterhin mit dem Token, solange es gilt.
- **AC-6** Ist der gespeicherte Eintrag des Tokens unlesbar oder anders aufgebaut, verhält sich die Seite wie ohne Anmeldung.

## Agreed design
Die Seite legt das Zugriffstoken jeder Anmeldung mit seinem Ablaufzeitpunkt und der Angabe, ob es eintragen darf, im `localStorage` ab. Beim Öffnen liest sie es; gilt es noch, hält sie es wie nach einer Anmeldung in diesem Besuch und ruft sofort ab. Neue Anzeigen gibt es nicht, deshalb kein Muster.

## Technical decisions
- **Stored formats** Neuer `localStorage`-Schlüssel `gewicht:token:v1` mit `{ "token": "<Zugriffstoken>", "expiresAt": "<ISO-Zeit>", "writeGranted": <bool> }`. Geschrieben bei jeder Anmeldung. Entfernt bei „Abmelden“, wenn die Seite ihn abgelaufen vorfindet, und wenn Google das Token ablehnt, dann aber nur, solange der Eintrag noch dieses Token hält: ein anderer Tab kann inzwischen ein neueres abgelegt haben. Ein fehlender, unlesbarer oder anders aufgebauter Eintrag wird verworfen. `gewicht:v1` bleibt unverändert. Es gibt keine bestehenden Daten zu überführen.
- **Wire formats** keine.
- **Trust boundaries** Das Zugriffstoken (Lesen, wo erlaubt auch Schreiben) liegt im `localStorage` und ist für jedes Skript der Seite lesbar. Es bleibt dort bis zum nächsten Öffnen nach seinem Ablauf, bis „Abmelden“ oder bis Google es ablehnt; brauchbar ist es nur bis zu seinem Ablaufzeitpunkt, etwa eine Stunde nach der Anmeldung. Das ersetzt „nur im Arbeitsspeicher“. Keine neuen ausgehenden Aufrufe, keine Secrets.
- **Dependencies** keine.

## Nudges
- `HeldToken`, `hasExpired`, `maySave` sowie Lesen und Schreiben des gespeicherten Eintrags ziehen aus `useMeasurements.ts` in ein reines Modul `src/app/held-token.ts`, mit „jetzt“ als Parameter. Die Regel, wann ein gehaltenes Token gilt, hat dort ihren einen Ort.
- Der Zugriff auf `localStorage` steht neben `loadCache`/`saveCache` in `useMeasurements.ts`.
- Der Abruf beim Öffnen läuft über dasselbe `fetchData(cache, token)` wie der Klick.
- Der run-Skill kommt mit dem neuen Schlüssel zurecht: `.claude/skills/run/walk-on.js` entfernt `gewicht:token:v1`, bevor es die Seite öffnet, damit kein echtes Token einen Abruf bei Google auslöst und kein Token des Stand-ins in den nächsten Gang mitgeht; der Kopf von `google-stand-in.js` sagt nicht mehr, dass Neuladen alles rückgängig macht; das Aufräumen in `.claude/skills/run/SKILL.md` nennt `gewicht:token:v1` neben `gewicht:v1` und `gewicht:eingetragen:v1`.
- Die Kommentare, die „in memory only“ sagen (`google-health.ts`, `useMeasurements.ts`), und die Beschreibung im README werden angepasst. An der Ablage erklärt ein Kommentar, warum das Token gespeichert wird.

## Out of scope
- Anmeldung ohne Klick, nachdem das Token abgelaufen ist (`changes/backlog/server-mit-webhook.md`).
- Abrufen ohne Neuladen, solange die Seite offen und sichtbar bleibt (`changes/backlog/abrufen-ohne-neuladen.md`).
- Dass „Abmelden“ in einem Tab auf andere, schon offene Tabs wirkt.

## Ruled out
- **`sessionStorage`** - überlebt das erneute Öffnen der installierten App nicht, das zum Problem gehört.
- **httpOnly-Cookie über den Next.js-Server** - Route, Proxy für die Health-API und Cookie-Handhabung: M statt XS, bei gleichem Ergebnis für das Problem.
- **Abruf beim Öffnen erst 5 Minuten nach dem letzten** - ein bewusstes Neuladen täte dann sichtbar nichts.
- **„Daten abrufen“ nach dem Neuladen wieder zeigen** - kostet den Klick, um den es geht.
- **Stilles Neuanmelden per Klick mit Konto-Hinweis** - löst das Öffnen am nächsten Tag, nicht das Neuladen ohne Klick.
