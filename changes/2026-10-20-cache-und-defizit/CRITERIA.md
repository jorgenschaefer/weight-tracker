# Criteria: Walks ohne den echten Cache, „Bilanz“ bei einem Tempo von ±0,00

## Problem
Die Änderung hat zwei Teile, die nichts miteinander zu tun haben.

**Teil 1, der run-Skill.** Wer die Seite mit dem run-Skill auf localhost:3000 durchgeht, im selben Browserprofil, in dem man die Seite selbst benutzt, ändert, was die Seite in diesem Browser gespeichert hat: `walkOn` überschreibt den Cache und entfernt die Anmeldung, jedes Anmelden, Abrufen oder Eintragen über den Stand-in ersetzt sie durch erfundene Daten, und das Aufräumen des Skills löscht alles. Danach zeigt die Seite den ersten Besuch, und man muss sich anmelden und neu abrufen; bei Google geht nichts verloren. Stattdessen soll die Seite in diesem Profil nach einem Walk so sein wie vorher, mit demselben Cache, derselben Anmeldung und denselben noch nicht abgerufenen Einträgen.

Der Fall: Am 19.10.2026 hat der Review der Frühwarnung, die nicht mehr springt, so einen Cache mit Daten vom 19.10., 10:52 UTC gelöscht (`changes/backlog/run-skill-cache-sichern.md`).

**Teil 2, „Defizit“ neben „±0,00“.** Zeigt die Seite das Tempo als „±0,00 kg/Wo“, sagt also nicht, ob man ab- oder zunimmt, behauptet die vierte Zahl daneben trotzdem eine Richtung: „Defizit“ oder „Überschuss“, und manchmal 10 kcal statt 0. Die beiden Zahlen widersprechen sich. Stattdessen soll die vierte Zahl über die Richtung nicht mehr sagen als „Tempo“.

Der Fall: Am 3.7. der Testdaten steht „±0,00 … kg/Wo“ neben „Defizit 0 ± 560 kcal/Tag“, aufgefallen bei der Abnahme der Einschätzung mit dem Kalman-Filter (`changes/backlog/defizit-bei-tempo-null.md`).

## Acceptance criteria
- **AC-1** Wer die Seite mit dem run-Skill durchgeht – Testdaten speichern, `walkOn`, Anmelden, Abrufen und Eintragen über den Stand-in, `standInReopen` und Aufräumen nach `SKILL.md` –, findet danach im `localStorage` von http://localhost:3000 im selben Browserprofil dieselben Einträge mit denselben Werten wie vorher.
- **AC-2** `SKILL.md` lässt die Seite auf `http://walk.localhost:<Port>` durchgehen, mit dem Port des Dev-Servers, der schon läuft (bei `npm run dev` 3000), auch eines selbst gestarteten; nur wenn keiner läuft, startet der Skill einen. Dort gehen Testdaten speichern, `walkOn`, der Stand-in mit Anmelden, Abrufen, Eintragen und `standInReopen`, und das Verstellen der Uhr wie heute auf localhost:3000. Eine echte Anmeldung bei Google geht dort nicht, und `SKILL.md` sagt das, statt von einer echten Anmeldung oder einem Abruf beim echten Google auf dieser Seite zu sprechen.
- **AC-3** Läuft eines der drei Snippets – das von `fixture-snippet.mjs` ausgegebene, `walk-on.js` oder `google-stand-in.js` – auf einem Host außer `walk.localhost`, gleich welcher Port, schreibt und löscht es nichts im `localStorage`, ersetzt weder Google noch `fetch` und wirft einen Fehler, der `http://walk.localhost` mit dem Port der Seite nennt, auf der es lief (etwa http://walk.localhost:3000 auf localhost:3000).
- **AC-4** Zeigt „Tempo“ `±0,00`, heißt die vierte Zahl „Bilanz“, und ihr Wert ist 0 mit ihrer Unsicherheit wie bisher, etwa „Bilanz 0 ± 560 kcal/Tag“ am 3.7. der Testdaten. „Defizit“ und „Überschuss“ stehen dann nicht auf der Seite; das gilt auch bei einem Tempo von genau 0.
- **AC-5** Zeigt „Tempo“ ein Minus, heißt die vierte Zahl „Defizit“, zeigt es ein Plus, „Überschuss“. Ihr Wert und ihre Unsicherheit bleiben, wie sie heute sind.

## Agreed design
Teil 1: Der run-Skill geht die Seite auf http://walk.localhost:3000 durch statt auf localhost:3000. `localStorage` gehört zum Origin, und Chrome löst jede Subdomain von `localhost` auf die eigene Maschine auf; so bleibt alles, was ein Walk schreibt oder löscht, auf dem Origin der Walks. Die drei Snippets weigern sich auf jedem anderen Host.

Teil 2: Bei einem Tempo, das als `±0,00` erscheint, heißt die vierte Zahl „Bilanz“ und zeigt 0; an allen anderen Tagen bleibt sie, wie sie ist:

```
Tempo     ±0,00 ± 0,51 kg/Wo      Tempo     −0,46 ± 0,29 kg/Wo
Bilanz    0 ± 560 kcal/Tag        Defizit   510 ± 320 kcal/Tag
```

Ein Muster gibt es nicht; der sichtbare Unterschied ist ein Wort und eine Zahl.

**Agreed; build to this, do not redesign.**

## Technical decisions
- **Stored formats** keine. Was der Skill auf `walk.localhost` speichert, liegt dort unter denselben Schlüsseln; `walk:fixture` muss dort einmal neu gespeichert werden.
- **Wire formats** keine. `walkOn`, `standIn` und `standInReopen` behalten Namen und Optionen.
- **Trust boundaries** keine. Auf `walk.localhost` geht keine echte Anmeldung bei Google; der Skill braucht keine.
- **Dependencies** keine.

## Nudges
- Ob „Tempo“ auf 0 rundet, entscheidet eine Stelle in `src/app/format.ts`, dieselbe Prüfung, mit der `signed` `±` setzt. Bezeichnung und Wert der vierten Zahl nehmen sie von dort; `kcalPerDay` in `src/trend/pace.ts` bleibt, wie es ist.
- Der Eintrag „Tempo“ in `UBIQUITOUS_LANGUAGE.md` nennt „Bilanz“ für ein Tempo, das als `±0,00` erscheint.
- Der Test „say „Überschuss“ at a pace of 0“ in `src/app/Verdict.test.tsx` wird zu „Bilanz“; AC-4 bekommt einen Fall knapp unter und knapp über 0.
- Die Prüfung des Hosts steht in jedem Snippet zuerst, vor allem anderen.
- `next.config.ts` bleibt unverändert: Subdomains von `localhost` lässt der Dev-Server ohne `allowedDevOrigins` zu.

## Out of scope
- Eine echte Anmeldung bei Google auf `walk.localhost`.
- Was schon im `localStorage` von localhost:3000 liegt, auch frühere Testdaten von Walks.

## Ruled out
- **Eigener Port für Walks** - Next.js 16 lässt nur ein `next dev` pro Projekt zu; läuft der eigene Server, müsste der Skill ihn anhalten.
- **Sichern und Zurückschreiben** - ein abgebrochener Walk lässt erfundene Daten stehen.
- **Eigenes Browserprofil** - liegt außerhalb dessen, was der Skill festlegen kann.
- **Nur Dokumentation des Hosts** - ein Versehen bringt den alten Schaden zurück.
- **Immer „Bilanz“ mit Vorzeichen** - ändert die Tage, die heute stimmen, und verlangt zu wissen, dass Minus Defizit heißt.
- **Keine vierte Zahl bei ±0,00** - nimmt die Unsicherheit in kcal gerade dann weg, wenn sie am meisten sagt.
