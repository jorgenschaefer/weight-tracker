---
criteria:  CRITERIA.md
closes:    AC-4, AC-5, AC-6, AC-7, AC-9, AC-13
advances:  
after:     01-statuszeile
status:    ready
attempts:  0
---

## Build
Ein Tipp auf die Statuszeile einer angemeldeten Seite öffnet ein Blatt mit dem Stand der Anmeldung und „Abmelden“; der Link „Abmelden“ unten auf der Seite fällt weg. Die Seite ruft nicht mehr von selbst ab, wenn sie wieder sichtbar wird; läuft die Anmeldung ab, während sie offen ist, zeigt die Statuszeile das von selbst. Eine Anmeldung, die „Eintragen“ geholt hat, bleibt, auch wenn das Speichern danach scheitert, und die Seite ruft mit ihr ab.

## Done when
> **AC-4** Ist die Seite angemeldet, öffnet ein Tipp auf die Statuszeile, auch nach einem fehlgeschlagenen Abruf und während etwas läuft, ein Blatt von unten im Stil des Blatts zum Eintragen. Darin stehen „Google Health“, „Angemeldet bis <Uhrzeit> Uhr“ (der Ablaufzeitpunkt der Anmeldung), mit dem Zusatz „, nur Lesen“, wenn die Anmeldung das Eintragen nicht erlaubt, „Abgerufen …“ wie in AC-2 mit großem A (oder „Noch nicht abgerufen“), und „Abmelden“. X, ein Tipp neben das Blatt und Escape schließen es. Läuft die Anmeldung ab, während das Blatt offen ist, schließt es sich von selbst.

> **AC-5** „Abmelden“ im Blatt fragt nicht nach und tut, was „Abmelden“ heute tut; danach zeigt die Seite den ersten Besuch. Der erste Besuch, vor jedem Abruf und nach „Abmelden“, zeigt in jedem Zustand der Statuszeile den Satz „Diese Seite liest deine Gewichtsmessungen aus Google Health, trägt neue ein und zeigt dir, ob du noch abnimmst.“, und darunter „Tippe oben auf die Zeile, um dich bei Google anzumelden.“ Nach „Abmelden“ sagt die Statuszeile „nicht angemeldet“.

> **AC-6** Die Seite ruft genau dann ab: beim Öffnen mit einer noch gültigen Anmeldung, nach dem Anmelden über Statuszeile oder ⟳, nach dem Eintragen, nach einer Anmeldung über „Eintragen“, deren Speichern scheitert (AC-13), und auf ⟳. Wird sie wieder sichtbar, ruft sie nicht ab; dass sie dann den heutigen Tag neu liest, bleibt.

> **AC-7** Läuft die Anmeldung ab, während die Seite offen ist, zeigt die Statuszeile ab dem Ablaufzeitpunkt ohne Zutun „nicht angemeldet“ mit dem leeren Kreis, außer AC-2 lässt etwas anderes vorgehen.

> **AC-9** „Daten abrufen“ und der Link „Abmelden“ unten auf der Seite gibt es nicht mehr. Ein fehlgeschlagener Abruf steht nur in der Statuszeile, nicht mehr in einer eigenen Zeile. Ein fehlgeschlagener Widerruf steht weiter in der bekannten Zeile mit dem Link zum Google-Konto.

> **AC-13** Meldet „Eintragen“ bei Google an und scheitert danach das Speichern, etwa weil die Anmeldung das Eintragen nicht erlaubt, behält die Seite diese Anmeldung: Das Blatt zum Eintragen zeigt den Fehler wie heute, die Seite ist danach angemeldet und ruft ab, und im Blatt der Statuszeile steht „, nur Lesen“, wo die Anmeldung das Eintragen nicht erlaubt. Lehnt Google die Anmeldung beim Speichern ab, behält die Seite sie nicht.

## Technical decisions
> **Stored formats** keine. „abgerufen …“ nimmt `fetchedAt` aus `gewicht:v1`; Ablaufzeitpunkt und Schreibrecht der Anmeldung stehen schon in `gewicht:token:v1`.

> **Wire formats** keine.

> **Trust boundaries** keine.

> **Dependencies** keine.

## Nudges
> Was die zweite Zeile sagt (AC-2), steht an einem Ort: einer reinen Funktion in `src/app/google-status.ts`, mit „jetzt“ als Parameter. Zeile, ⟳ und Blatt sind die Komponente `src/app/GoogleStatus.tsx`; das Blatt ist Mantines `Drawer` wie in `EntrySheet.tsx` und nimmt dessen Farben und Klassen.

> In `src/app/useMeasurements.ts` fallen `fetchOnReturn`, `REFETCH_AFTER_MS` und `lastFetchStarted` weg; dazu kommen ein Timer auf den Ablaufzeitpunkt des Tokens, die Zustände „meldet an“ und „speichert“ sowie Ablaufzeitpunkt und Schreibrecht in `Measurements`.

> In `src/app/page.tsx` und `src/app/page.module.css` fallen `FetchButton`, `.logout`, `.busy` mit dem Abdunkeln und der Abruf-Zweig von `ProblemLine` weg.

> `src/test/open-page.tsx`, `.claude/skills/run/SKILL.md` und `.claude/skills/run/walk-on.js` sprechen nicht mehr von „Daten abrufen“; die Kommentare in `src/app/EntrySheet.tsx` und `src/app/useMeasurements.ts`, die „Daten abrufen“ nennen, werden angepasst.

> `enter` in `src/app/useMeasurements.ts` behält die Anmeldung, die es selbst geholt hat, auch wenn das Speichern scheitert (AC-13); der Kommentar, der das Verwerfen mit „Daten abrufen“ begründet, fällt weg.

> `changes/backlog/abrufen-ohne-neuladen.md` geht in dieser Änderung auf und wird mit ihr gelöscht.

## Context
01 hat die Statuszeile mit ⟳ gebaut (`src/app/GoogleStatus.tsx`, mit dem Text der zweiten Zeile in `src/app/google-status.ts`), in `useMeasurements` die Zustände „meldet an“ und „speichert“, den Satz und den Hinweis des ersten Besuchs und in `src/test/open-page.tsx` die Helfer für Statuszeile und ⟳. Was 01 offen lässt, steht unter `## Left standing` in `01-statuszeile.md`.

Das Token der Anmeldung (`HeldToken` in `src/app/held-token.ts`) hat `expiresAt` und `writeGranted`. „Abmelden“ ist heute `logOut` in `src/app/useMeasurements.ts` und ein Link unten in `src/app/page.tsx`; `logoutButton` in `src/test/open-page.tsx` findet ihn, und Tests in `useMeasurements.test.tsx`, `useEnteredMeasurements.test.tsx` und `page.test.tsx` gehen darüber. Das Blatt zum Eintragen (`src/app/EntrySheet.tsx`, `EntrySheet.module.css`) ist das Vorbild für das Blatt.

Heute ruft `useMeasurements` beim Zurückkehren in den Tab ab, frühestens 5 Minuten nach dem letzten Abruf, und lässt dabei ein abgelaufenes Token fallen; anders bemerkt die Seite den Ablauf nicht, solange sie offen ist. `enter` behält eine Anmeldung, die es selbst geholt hat, nur, wenn das Speichern gelingt. Tests in `src/app/useMeasurements.test.tsx` halten beides fest. Dass die Seite beim Zurückkehren den heutigen Tag neu liest, ist `useToday` in `src/app/page.tsx` und bleibt. `.claude/skills/run/SKILL.md` beschreibt, wie man die Seite nach einer echten Anmeldung beim Zurückkehren erneut abrufen sieht.

Das Muster ist `specimens/StatuszeileAbruf.dc.html` (Variante D) neben `CRITERIA.md`; wo es von den Kriterien abweicht, gelten die Kriterien: Das Blatt hat ein X, seine Zeile zum letzten Abruf folgt AC-2, und nach einem fehlgeschlagenen Abruf öffnet der Tipp auf die Zeile das Blatt.

## Not here
- Statuszeile, ⟳ und der Text der zweiten Zeile: 01.
- Anmelden ohne Klick, nachdem die Anmeldung abgelaufen ist.
- Auf das Ende der Operation von Google warten und der Spike dazu (`changes/backlog/auf-operation-warten.md`).
- Dass „Abmelden“ in einem Tab auf andere, schon offene Tabs wirkt.
- Ein Profilbild von Google.

## Left standing
