---
criteria:  CRITERIA.md
closes:    AC-1, AC-2, AC-3, AC-8, AC-10, AC-11, AC-12
advances:  AC-5, AC-9
after:     
status:    ready
attempts:  0
---

## Build
Über „Letzte Messung“ steht die Statuszeile „Google Health“ mit ihrem Zeichen und ⟳ daneben. „Daten abrufen“, das Abdunkeln, „Vorläufig, wird aktualisiert …“, „Wird aktualisiert …“ und die eigene Zeile für einen fehlgeschlagenen Abruf fallen weg.

## Done when
> **AC-1** Über „Letzte Messung“ steht eine zweizeilige Statuszeile: oben „Google Health“, darunter kleiner und blasser der Zustand. Davor steht ein gefüllter Punkt, wenn die Seite angemeldet ist, ein leerer Kreis, wenn nicht, und ein Ausrufezeichen nach einem fehlgeschlagenen Abruf. Rechts daneben steht ein eigener Knopf ⟳ von mindestens 48 × 48 px. Das Zeichen folgt der zweiten Zeile (AC-2): das Ausrufezeichen steht genau dann, wenn sie „Abruf fehlgeschlagen: …“ sagt, sonst Punkt oder Kreis danach, ob die Seite angemeldet ist. Beide sind in jedem Zustand der Seite da, auch beim ersten Besuch.

> **AC-2** Die zweite Zeile sagt genau eines von: „nicht angemeldet“; „meldet an …“; „ruft ab …“; „speichert <Gewicht> kg …“ (etwa „speichert 84,1 kg …“); „abgerufen <Uhrzeit> Uhr“, wenn der letzte erfolgreiche Abruf an dem Tag war, nach dem die Seite urteilt (etwa „abgerufen 7:14 Uhr“), sonst „abgerufen <Tag> um <Uhrzeit> Uhr“ (etwa „abgerufen 19.10. um 22:10 Uhr“), vor dem ersten erfolgreichen Abruf „noch nicht abgerufen“; nach einem fehlgeschlagenen Abruf oder einer fehlgeschlagenen Anmeldung über Statuszeile oder ⟳ „Abruf fehlgeschlagen: <Grund>“ mit den Gründen, die die Seite schon kennt, nicht blass und fett. Es gilt das erste, das zutrifft: „meldet an …“, solange ein Anmelde-Popup offen ist, auch eines von „Eintragen“; „speichert …“, solange ein Eintragen auf Google wartet, auch während ein Abruf läuft; „ruft ab …“; „Abruf fehlgeschlagen: …“, bis der nächste Abruf oder die nächste Anmeldung beginnt, auch wenn die Seite inzwischen nicht mehr angemeldet ist; „nicht angemeldet“; „abgerufen …“ bzw. „noch nicht abgerufen“. Ein fehlgeschlagenes Eintragen ändert die Statuszeile nicht, außer dass die Seite nicht mehr angemeldet ist, wenn Google dabei die Anmeldung ablehnt; der Fehler steht wie heute im Blatt zum Eintragen. Reicht die Breite nicht, bricht die zweite Zeile nur zwischen Wörtern um, nie zwischen Uhrzeit und „Uhr“.

> **AC-3** Ist die Seite nicht angemeldet, meldet ein Tipp auf die Statuszeile oder auf ⟳ bei Google an (ein Popup) und ruft danach ab. Ist sie angemeldet, ruft ⟳ ab. Solange eine Anmeldung, ein Abruf oder ein Eintragen läuft, dreht sich ⟳ und nimmt keinen Tipp an, und ein Tipp auf die Statuszeile einer nicht angemeldeten Seite tut nichts. Bevor die Seite ihren Speicher in diesem Browser gelesen hat, zeigt die Statuszeile nur „Google Health“, ohne Zeichen davor und ohne zweite Zeile, und weder sie noch ⟳ nehmen einen Tipp an.

> **AC-8** Während eines Abrufs bleibt der Rest der Seite, wie er ist: Nichts wird abgedunkelt, und „Vorläufig, wird aktualisiert …“ und „Wird aktualisiert …“ gibt es nicht mehr.

> **AC-10** Ein Eintragen gilt als abgeschlossen, sobald Google den Wert annimmt. Bis dahin sagt die Statuszeile nach AC-2 „meldet an …“, solange das Anmelde-Popup offen ist, dann „speichert <Gewicht> kg …“, beim Abruf danach „ruft ab …“. Das Blatt zum Eintragen und der Zusatz „, noch nicht aus Google Health abgerufen“ in „Letzte Messung“ bleiben unverändert.

> **AC-11** Für Screenreader heißt die Statuszeile nach ihrem ganzen Text, etwa „Google Health, abgerufen 7:14 Uhr“, und ⟳ heißt „Abrufen“, ist die Seite nicht angemeldet, „Anmelden und abrufen“. Ein Wechsel des Zustands wird höflich angesagt, ohne laufende Ansagen zu unterbrechen.

> **AC-12** Auf 360 × 640 px stehen das Urteil und die vier Zahlen in jedem Zustand weiter vollständig über dem unteren Rand. Ab 65em Breite sitzen Statuszeile und ⟳ zusammen rechts, so breit wie die Spalte der vier Zahlen und bündig über ihr. Nichts scrollt horizontal.

Für AC-5: Der erste Besuch zeigt in jedem Zustand der Statuszeile den Satz zur Seite und darunter „Tippe oben auf die Zeile, um dich bei Google anzumelden.“; „Abmelden“ selbst bleibt, wo und wie es ist.

Für AC-9: „Daten abrufen“ gibt es nicht mehr, ein fehlgeschlagener Abruf steht nur in der Statuszeile, und ein fehlgeschlagener Widerruf steht weiter in der bekannten Zeile mit dem Link zum Google-Konto; der Link „Abmelden“ unten bleibt.

## Toward
> **AC-5** „Abmelden“ im Blatt fragt nicht nach und tut, was „Abmelden“ heute tut; danach zeigt die Seite den ersten Besuch. Der erste Besuch, vor jedem Abruf und nach „Abmelden“, zeigt in jedem Zustand der Statuszeile den Satz „Diese Seite liest deine Gewichtsmessungen aus Google Health, trägt neue ein und zeigt dir, ob du noch abnimmst.“, und darunter „Tippe oben auf die Zeile, um dich bei Google anzumelden.“ Nach „Abmelden“ sagt die Statuszeile „nicht angemeldet“.

> **AC-9** „Daten abrufen“ und der Link „Abmelden“ unten auf der Seite gibt es nicht mehr. Ein fehlgeschlagener Abruf steht nur in der Statuszeile, nicht mehr in einer eigenen Zeile. Ein fehlgeschlagener Widerruf steht weiter in der bekannten Zeile mit dem Link zum Google-Konto.

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

## Context
Heute gibt `useMeasurements` (`src/app/useMeasurements.ts`) der Seite `fetching`, `signedIn`, `problem` (ein Abruf oder ein Widerruf, der fehlschlug), `fetchData`, `enter` und `logOut`; ein Abruf ohne Anmeldung öffnet zuerst das Anmelde-Popup. Der Cache hat `fetchedAt`. Die Gründe eines Fehlers stehen in `src/app/failure-reason.ts`, Tag und Uhrzeit wie „19.10.“ und „7:14“ formatiert `src/app/format.ts`. Den Tag, nach dem die Seite urteilt, liest `useToday` in `src/app/page.tsx`.

Das Muster ist `specimens/StatuszeileAbruf.dc.html` (Variante D, „Statuszeile mit Abruf“) neben `CRITERIA.md`: gebaut wird danach, nicht neu entworfen. `CRITERIA.md` sagt dazu: „Wo Muster und Kriterien auseinandergehen, gelten die Kriterien:
- Nach einem fehlgeschlagenen Abruf öffnet der Tipp auf die Zeile das Blatt (AC-4), statt erneut abzurufen; das tut ⟳.
- Die zweite Zeile sagt nach einem Fehler „Abruf fehlgeschlagen: <Grund>“ (AC-2), nicht „…, erneut versuchen“.
- „Letzte Messung“ bleibt wie heute (AC-10); das Muster ändert sie beim Eintragen.
- Das Blatt hat ein X (AC-4), und seine Zeile zum letzten Abruf folgt AC-2.
- Abgemeldet heißt ⟳ „Anmelden und abrufen“ (AC-11), wie im Muster.“

Was dieses Ticket mit 03 teilt:
- Dieses Ticket legt `src/app/google-status.ts` und `src/app/GoogleStatus.tsx` an; 03 setzt das Blatt in dieselbe Komponente.
- Dieses Ticket baut in `useMeasurements` die Zustände „meldet an“ und „speichert“. 03 gibt Ablaufzeitpunkt und Schreibrecht der Anmeldung in `Measurements` heraus, baut den Timer auf den Ablaufzeitpunkt, nimmt den Abruf beim Zurückkehren heraus und ändert, was `enter` nach einem gescheiterten Speichern mit seiner Anmeldung tut; bis dahin bleibt beides, wie es ist.
- Dieses Ticket ersetzt in `src/test/open-page.tsx` `fetchButton` durch Helfer für Statuszeile und ⟳; 03 nimmt dieselben.

## Not here
- Das Blatt der Statuszeile, „Abmelden“ darin und das Ende des Links „Abmelden“ unten: 03. Bis dahin tut ein Tipp auf die Statuszeile einer angemeldeten Seite nichts.
- Wann die Seite von selbst abruft (beim Zurückkehren in den Tab, mit dem Timer auf den Ablaufzeitpunkt) und dass `enter` eine Anmeldung behält, deren Speichern scheiterte: 03, mit dem Kommentar in `enter`, der „Daten abrufen“ nennt, und `changes/backlog/abrufen-ohne-neuladen.md`.
- Auf das Ende der Operation von Google warten und der Spike dazu (`changes/backlog/auf-operation-warten.md`).
- Ein Profilbild von Google.
- Eintragen ohne Anmeldung oder ohne Google-Konto, und damit „Synchronisieren“ (`changes/backlog/eintragen-ohne-anmeldung.md`).

## Left standing
