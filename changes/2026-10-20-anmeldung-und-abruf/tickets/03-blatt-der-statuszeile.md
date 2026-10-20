---
criteria:  CRITERIA.md
closes:    AC-4, AC-5, AC-6, AC-7, AC-9, AC-13
advances:  
after:     01-statuszeile
status:    done
attempts:  1
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

**Befunde des Reviews, nicht behoben**
- Nit (1. und 2. Runde): der Name des Felds für die Anmeldung in `Measurements`. Die 1. Runde fand `signedIn` für ein Objekt irreführend, es heißt jetzt `signIn`; die 2. Runde findet, `signIn` lese sich wie eine Aktion und teile den Namen mit der Funktion `signIn` aus `google-health.ts`. Bleibt so: der Compiler hält beides auseinander, siehe unten bei den Namen.
- Nit (1. Runde): unter `next dev` liegt das Abzeichen von Next.js bei 360 px über „Abmelden“ im Blatt. Nur im Entwicklungsmodus, kein Fehler der Seite; in `.claude/skills/run/SKILL.md` vermerkt.

**Nach dem letzten Review behoben**
- Should-fix der 2. Runde, kein Test hielt fest, dass beide Blätter über `Sheet` gezeichnet werden: je ein Test in `EntrySheet.test.tsx` und `GoogleStatus.test.tsx` prüft die Klassen von `Sheet.module.css` am Blatt, an dessen Kopf und Inhalt. Gegengeprüft: mit Mantines `Drawer` statt `Sheet` in `GoogleStatus.tsx` schlägt der Test fehl.

**Nicht automatisch geprüft**
- AC-4 „im Stil des Blatts zum Eintragen“ und AC-9 auf echten Bildschirmen: beide Reviews haben die Seite mit `google-stand-in.js` in Chromium bei 360 × 640 und 1440 × 900 gefahren (gleiche Farben, Ecken, Titel, Breite, Overlay; X, Escape und ein Tipp daneben schließen beide Blätter; kein „Abmelden“ und kein „Daten abrufen“ unten). Die Tests prüfen nur Klassen und Stylesheet.
- AC-7 und das Schließen des Blatts beim Ablauf: in den Tests mit gefälschter Uhr und gefälschtem `setTimeout`, im Review mit Playwrights Uhr (59:57 noch angemeldet, 60:00 „nicht angemeldet“, Blatt zu, keine Anfrage). Auf einem echten Gerät, das schläft, nicht geprüft; dafür lässt die Seite ein abgelaufenes Token auch beim Zurückkehren in den Tab fallen.
- AC-13 mit nur lesender Anmeldung im Browser mit der Google-Attrappe geprüft; gegen das echte Google nicht gefahren.

**Schwer umkehrbare Entscheidungen**
- `Measurements.signedIn: boolean` ist jetzt `signIn: Omit<HeldToken, "token"> | null` (Ablaufzeitpunkt und Schreibrecht, `null` ohne Anmeldung).
- Neue Komponente `src/app/Sheet.tsx` mit `Sheet.module.css`: das helle Blatt von unten, das „Gewicht eintragen“ und das Blatt der Statuszeile teilen (Should-fix der 1. Runde). `.sheet`, `.part` und `.title` sind aus `EntrySheet.module.css` dorthin umgezogen, mit ihrem Test zur Breite.
- `src/test/open-page.tsx`: `logoutButton` ist ersetzt durch `logOut(user)` (öffnet das Blatt und tippt „Abmelden“) und `statusSheet()`; neu sind `runTimersFrom(now)` und `passTime(ms)`, die auch `setTimeout` fälschen; `changeVisibility` ist in `comeIntoView` aufgegangen.
- In `google-status.ts` stehen die Zeilen des Blatts als `signedInUntil` und `lastFetch`.

**Abweichungen von Nudges und Auslegungen**
- Nudge „ein Timer auf den Ablaufzeitpunkt“: gebaut, und zusätzlich lässt die Seite ein abgelaufenes Token fallen, wenn sie wieder sichtbar wird (ohne abzurufen). Ein Timeout läuft nicht unbedingt, während das Gerät schläft; so zeigt die Seite nach dem Aufwachen nicht weiter „angemeldet“.
- Nudge „das Blatt nimmt die Farben und Klassen von `EntrySheet.tsx`“: statt die Einstellungen des `Drawer` zu kopieren, nutzen beide Blätter `Sheet` (siehe oben).
- „Abmelden“ tut, was es heute tut: hat das Token zwischen Ablauf und Timeout schon keine Gültigkeit mehr, meldet es weiter neu an, um zu widerrufen. Zwei Tests fallen weg, deren Ausgang die Seite nicht mehr erreicht, weil es „Abmelden“ nur noch im Blatt einer angemeldeten Seite gibt: „signs in first where it has no token, to revoke the access“ und „does not keep the sign-in of a fetch it overtook for the next open“. Ebenso fallen die Tests zum Abruf beim Zurückkehren weg; „does not fetch, however long ago the last fetch was“ hält AC-6 fest.
- `src/app/EntrySheet.tsx` nannte „Daten abrufen“ nicht mehr; der Kommentar in `enter` (`useMeasurements.ts`) ist ersetzt.

**Namen nicht aus dem Glossar, zu bestätigen**
- `Sheet` (Komponente) und „Blatt der Statuszeile“ im Text der Tests und Kommentare; „Blatt“ steht nicht im Glossar.
- `signIn` (Feld von `Measurements`), `signedInUntil`, `lastFetch`, `logOut` und `statusSheet` (Testhelfer), `runTimersFrom`, `passTime`.
