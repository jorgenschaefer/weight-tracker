# Criteria: Anmeldung und Abruf sichtbar machen

## Problem
Auf der Seite ist nicht zu sehen, ob sie bei Google angemeldet ist. „Abmelden“ steht als unscheinbarer Link ganz unten. Neue Messungen holt die Seite nur von selbst, beim Öffnen und beim Zurückkehren in den Tab, auch wenn man das nicht will; bleibt sie offen, gibt es nach der Anmeldung keinen Weg, selbst abzurufen. Nach dem Eintragen ist nicht zu sehen, ob der Wert bei Google schon gespeichert ist. Stattdessen soll man jederzeit sehen, ob die Seite angemeldet ist, „Abmelden“ an einer erkennbaren Stelle erreichen, abrufen, wann man will, und sonst nicht bei jedem Tab-Wechsel, und sehen, ob Abruf oder Eintragen noch laufen. Ob Google einen angenommenen Wert auch speichert, bleibt bis zum Spike in `changes/backlog/auf-operation-warten.md` offen; hier geht es darum, zu sehen, dass das Eintragen noch läuft.

Einen festgehaltenen Fall gibt es nicht. Die Backlog-Einträge `changes/backlog/abrufen-ohne-neuladen.md` und `changes/backlog/auf-operation-warten.md` beschreiben das Verhalten, wie es heute bei jeder Benutzung auftritt.

## Acceptance criteria
- **AC-1** Über „Letzte Messung“ steht eine zweizeilige Statuszeile: oben „Google Health“, darunter kleiner und blasser der Zustand. Davor steht ein gefüllter Punkt, wenn die Seite angemeldet ist, ein leerer Kreis, wenn nicht, und ein Ausrufezeichen nach einem fehlgeschlagenen Abruf. Rechts daneben steht ein eigener Knopf ⟳ von mindestens 48 × 48 px. Das Zeichen folgt der zweiten Zeile (AC-2): das Ausrufezeichen steht genau dann, wenn sie „Abruf fehlgeschlagen: …“ sagt, sonst Punkt oder Kreis danach, ob die Seite angemeldet ist. Beide sind in jedem Zustand der Seite da, auch beim ersten Besuch.
- **AC-2** Die zweite Zeile sagt genau eines von: „nicht angemeldet“; „meldet an …“; „ruft ab …“; „speichert <Gewicht> kg …“ (etwa „speichert 84,1 kg …“); „abgerufen <Uhrzeit> Uhr“, wenn der letzte erfolgreiche Abruf an dem Tag war, nach dem die Seite urteilt (etwa „abgerufen 7:14 Uhr“), sonst „abgerufen <Tag> um <Uhrzeit> Uhr“ (etwa „abgerufen 19.10. um 22:10 Uhr“), vor dem ersten erfolgreichen Abruf „noch nicht abgerufen“; nach einem fehlgeschlagenen Abruf oder einer fehlgeschlagenen Anmeldung über Statuszeile oder ⟳ „Abruf fehlgeschlagen: <Grund>“ mit den Gründen, die die Seite schon kennt, nicht blass und fett. Es gilt das erste, das zutrifft: „meldet an …“, solange ein Anmelde-Popup offen ist, auch eines von „Eintragen“; „speichert …“, solange ein Eintragen auf Google wartet, auch während ein Abruf läuft; „ruft ab …“; „Abruf fehlgeschlagen: …“, bis der nächste Abruf oder die nächste Anmeldung beginnt, auch wenn die Seite inzwischen nicht mehr angemeldet ist; „nicht angemeldet“; „abgerufen …“ bzw. „noch nicht abgerufen“. Ein fehlgeschlagenes Eintragen ändert die Statuszeile nicht, außer dass die Seite nicht mehr angemeldet ist, wenn Google dabei die Anmeldung ablehnt; der Fehler steht wie heute im Blatt zum Eintragen. Reicht die Breite nicht, bricht die zweite Zeile nur zwischen Wörtern um, nie zwischen Uhrzeit und „Uhr“.
- **AC-3** Ist die Seite nicht angemeldet, meldet ein Tipp auf die Statuszeile oder auf ⟳ bei Google an (ein Popup) und ruft danach ab. Ist sie angemeldet, ruft ⟳ ab. Solange eine Anmeldung, ein Abruf oder ein Eintragen läuft, dreht sich ⟳ und nimmt keinen Tipp an, und ein Tipp auf die Statuszeile einer nicht angemeldeten Seite tut nichts. Bevor die Seite ihren Speicher in diesem Browser gelesen hat, zeigt die Statuszeile nur „Google Health“, ohne Zeichen davor und ohne zweite Zeile, und weder sie noch ⟳ nehmen einen Tipp an.
- **AC-4** Ist die Seite angemeldet, öffnet ein Tipp auf die Statuszeile, auch nach einem fehlgeschlagenen Abruf und während etwas läuft, ein Blatt von unten im Stil des Blatts zum Eintragen. Darin stehen „Google Health“, „Angemeldet bis <Uhrzeit> Uhr“ (der Ablaufzeitpunkt der Anmeldung), mit dem Zusatz „, nur Lesen“, wenn die Anmeldung das Eintragen nicht erlaubt, „Abgerufen …“ wie in AC-2 mit großem A (oder „Noch nicht abgerufen“), und „Abmelden“. X, ein Tipp neben das Blatt und Escape schließen es. Läuft die Anmeldung ab, während das Blatt offen ist, schließt es sich von selbst.
- **AC-5** „Abmelden“ im Blatt fragt nicht nach und tut, was „Abmelden“ heute tut; danach zeigt die Seite den ersten Besuch. Der erste Besuch, vor jedem Abruf und nach „Abmelden“, zeigt in jedem Zustand der Statuszeile den Satz „Diese Seite liest deine Gewichtsmessungen aus Google Health, trägt neue ein und zeigt dir, ob du noch abnimmst.“, und darunter „Tippe oben auf die Zeile, um dich bei Google anzumelden.“ Nach „Abmelden“ sagt die Statuszeile „nicht angemeldet“.
- **AC-6** Die Seite ruft genau dann ab: beim Öffnen mit einer noch gültigen Anmeldung, nach dem Anmelden über Statuszeile oder ⟳, nach dem Eintragen, nach einer Anmeldung über „Eintragen“, deren Speichern scheitert (AC-13), und auf ⟳. Wird sie wieder sichtbar, ruft sie nicht ab; dass sie dann den heutigen Tag neu liest, bleibt.
- **AC-7** Läuft die Anmeldung ab, während die Seite offen ist, zeigt die Statuszeile ab dem Ablaufzeitpunkt ohne Zutun „nicht angemeldet“ mit dem leeren Kreis, außer AC-2 lässt etwas anderes vorgehen.
- **AC-8** Während eines Abrufs bleibt der Rest der Seite, wie er ist: Nichts wird abgedunkelt, und „Vorläufig, wird aktualisiert …“ und „Wird aktualisiert …“ gibt es nicht mehr.
- **AC-9** „Daten abrufen“ und der Link „Abmelden“ unten auf der Seite gibt es nicht mehr. Ein fehlgeschlagener Abruf steht nur in der Statuszeile, nicht mehr in einer eigenen Zeile. Ein fehlgeschlagener Widerruf steht weiter in der bekannten Zeile mit dem Link zum Google-Konto.
- **AC-10** Ein Eintragen gilt als abgeschlossen, sobald Google den Wert annimmt. Bis dahin sagt die Statuszeile nach AC-2 „meldet an …“, solange das Anmelde-Popup offen ist, dann „speichert <Gewicht> kg …“, beim Abruf danach „ruft ab …“. Das Blatt zum Eintragen und der Zusatz „, noch nicht aus Google Health abgerufen“ in „Letzte Messung“ bleiben unverändert.
- **AC-11** Für Screenreader heißt die Statuszeile nach ihrem ganzen Text, etwa „Google Health, abgerufen 7:14 Uhr“, und ⟳ heißt „Abrufen“, ist die Seite nicht angemeldet, „Anmelden und abrufen“. Ein Wechsel des Zustands wird höflich angesagt, ohne laufende Ansagen zu unterbrechen.
- **AC-12** Auf 360 × 640 px stehen das Urteil und die vier Zahlen in jedem Zustand weiter vollständig über dem unteren Rand. Ab 65em Breite sitzen Statuszeile und ⟳ zusammen rechts, so breit wie die Spalte der vier Zahlen und bündig über ihr. Nichts scrollt horizontal.
- **AC-13** Meldet „Eintragen“ bei Google an und scheitert danach das Speichern, etwa weil die Anmeldung das Eintragen nicht erlaubt, behält die Seite diese Anmeldung: Das Blatt zum Eintragen zeigt den Fehler wie heute, die Seite ist danach angemeldet und ruft ab, und im Blatt der Statuszeile steht „, nur Lesen“, wo die Anmeldung das Eintragen nicht erlaubt. Lehnt Google die Anmeldung beim Speichern ab, behält die Seite sie nicht.

## Agreed design
Eine zweizeilige Statuszeile „Google Health“ über der Seite zeigt Anmeldung, Abruf und Speichern; ⟳ daneben ruft ab; ein Tipp auf die Zeile öffnet ein Blatt mit dem Stand der Anmeldung und „Abmelden“. Wo Muster und Kriterien auseinandergehen, gelten die Kriterien:
- Nach einem fehlgeschlagenen Abruf öffnet der Tipp auf die Zeile das Blatt (AC-4), statt erneut abzurufen; das tut ⟳.
- Die zweite Zeile sagt nach einem Fehler „Abruf fehlgeschlagen: <Grund>“ (AC-2), nicht „…, erneut versuchen“.
- „Letzte Messung“ bleibt wie heute (AC-10); das Muster ändert sie beim Eintragen.
- Das Blatt hat ein X (AC-4), und seine Zeile zum letzten Abruf folgt AC-2.
- Abgemeldet heißt ⟳ „Anmelden und abrufen“ (AC-11), wie im Muster.

- Artifact: https://claude.ai/artifact/CMSQm6dcjkgT9xhbBZfXJj (Variante D, „Statuszeile mit Abruf“)
- Kopie: [`specimens/StatuszeileAbruf.dc.html`](specimens/StatuszeileAbruf.dc.html)

**Agreed; build to this, do not redesign.**

## Technical decisions
- **Stored formats** keine. „abgerufen …“ nimmt `fetchedAt` aus `gewicht:v1`; Ablaufzeitpunkt und Schreibrecht der Anmeldung stehen schon in `gewicht:token:v1`.
- **Wire formats** keine.
- **Trust boundaries** keine.
- **Dependencies** keine.

## Nudges
- Was die zweite Zeile sagt (AC-2), steht an einem Ort: einer reinen Funktion in `src/app/google-status.ts`, mit „jetzt“ als Parameter. Zeile, ⟳ und Blatt sind die Komponente `src/app/GoogleStatus.tsx`; das Blatt ist Mantines `Drawer` wie in `EntrySheet.tsx` und nimmt dessen Farben und Klassen.
- In `src/app/useMeasurements.ts` fallen `fetchOnReturn`, `REFETCH_AFTER_MS` und `lastFetchStarted` weg; dazu kommen ein Timer auf den Ablaufzeitpunkt des Tokens, die Zustände „meldet an“ und „speichert“ sowie Ablaufzeitpunkt und Schreibrecht in `Measurements`.
- In `src/app/page.tsx` und `src/app/page.module.css` fallen `FetchButton`, `.logout`, `.busy` mit dem Abdunkeln und der Abruf-Zweig von `ProblemLine` weg.
- `src/test/open-page.tsx`, `.claude/skills/run/SKILL.md` und `.claude/skills/run/walk-on.js` sprechen nicht mehr von „Daten abrufen“; die Kommentare in `src/app/EntrySheet.tsx` und `src/app/useMeasurements.ts`, die „Daten abrufen“ nennen, werden angepasst.
- `enter` in `src/app/useMeasurements.ts` behält die Anmeldung, die es selbst geholt hat, auch wenn das Speichern scheitert (AC-13); der Kommentar, der das Verwerfen mit „Daten abrufen“ begründet, fällt weg.
- `changes/backlog/abrufen-ohne-neuladen.md` geht in dieser Änderung auf und wird mit ihr gelöscht.

## Out of scope
- Auf das Ende der Operation von Google warten und der Spike dazu (`changes/backlog/auf-operation-warten.md`).
- Ein Profilbild von Google.
- Eintragen ohne Anmeldung oder ohne Google-Konto, und damit „Synchronisieren“ (`changes/backlog/eintragen-ohne-anmeldung.md`).
- Anmelden ohne Klick, nachdem die Anmeldung abgelaufen ist.
- Dass „Abmelden“ in einem Tab auf andere, schon offene Tabs wirkt.

## Ruled out
- **A, Menü mit Profilbild oben rechts** - Anmelden, die häufigste Aktion, bräuchte zwei Tipps, und das Bild einen weiteren Scope.
- **B, zwei Symbole oben rechts** - der Zustand ist nur an Symbolen abzulesen.
- **C, Statuszeile ohne ⟳** - Abrufen bräuchte zwei Tipps.
- **Neuladen als Abruf** - die installierte App (`display: "standalone"`) hat kein Neuladen.
- **Rückfrage vor „Abmelden“** - von der Person abgelehnt; das Blatt ist schon ein eigener Schritt.
- **Statuszeile über die volle Breite auf breiten Bildschirmen** - ein langes, fast leeres Feld über dem Urteil.
- **Eintragen erst abgeschlossen, wenn ein Abruf den Wert enthält, mit Abruf jede Minute** - S statt XS, dafür ein Timer; zurückgestellt bis zum Spike in `auf-operation-warten.md`.
- **Dasselbe ohne wiederholten Abruf** - wie oben.
