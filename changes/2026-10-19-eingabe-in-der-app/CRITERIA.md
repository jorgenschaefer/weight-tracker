# Criteria: Gewicht auf der Seite eintragen

## Problem

Nach dem Wiegen trägst du das Gewicht in der Google-App ein und wechselst dann auf diese Seite. Dort erscheint der neue Wert erst etwa 10 Minuten später, weil er zuerst in Google Health ankommen muss. Bis dahin zeigt die Seite den alten Stand und sagt nicht, dass ein Wert noch unterwegs ist. Stattdessen soll ein gerade eingetragenes Gewicht sofort auf der Seite stehen, ohne Wechsel zwischen zwei Apps.

Der Fall: Am 17.10.2026 kam 98,6 kg dazu (`src/test/fixtures/gewicht-2026-07-bis-10.csv`). Bis der Wert in Google Health angekommen war, zeigte die Seite noch den Stand vom 16.10., „Seit 6 Tagen kein Abnehmen“ mit Trend 97,3 kg und Gemessen 98,3 kg, statt „Nimmt zu“. Die etwa 10 Minuten stammen aus dem früheren Backlog-Eintrag `sync-verzoegerung.md` (zusammengeführt in Commit 21a33ca).

## Acceptance criteria

- **AC-1** Unten rechts auf der Seite steht ein runder Knopf mit „+“, für Screenreader „Gewicht eintragen“. Er ist in jedem Zustand der Seite da, auch vor dem ersten Abruf, und bleibt beim Scrollen an seinem Platz.
- **AC-2** Der Knopf öffnet ein Blatt von unten mit dem Feld „Gewicht heute“ (kg), dem Knopf „Eintragen“ und einem X. Der Fokus liegt im Feld, das Handy zeigt die Zahlentastatur. X, ein Tipp neben das Blatt und Escape schließen es, ohne etwas zu speichern.
- **AC-3** Angenommen werden 30 bis 250 kg mit höchstens einer Nachkommastelle, mit Komma oder Punkt. Bei allem anderen, auch einem leeren Feld, speichert „Eintragen“ nichts, und unter dem Feld steht „Bitte ein Gewicht von 30 bis 250 kg eingeben, mit höchstens einer Nachkommastelle.“ Eingetragen wird immer mit dem jetzigen Zeitpunkt.
- **AC-4** „Eintragen“ meldet bei Google an, wo die Seite keine gültige Anmeldung mit Schreibzugriff hält (ein Popup), und schreibt den Wert in Google Health. Dann schließt sich das Blatt, und der Wert steht sofort auf der Seite: in „Letzte Messung“ mit Uhrzeit, und ist er der erste des Tages, auch in Gemessen, Trend, Urteil und Graph. Danach ruft die Seite ab wie bei „Daten abrufen“.
- **AC-5** Während des Speicherns zeigt der Knopf „Wird gespeichert …“ und nimmt keinen weiteren Tipp an, und X, ein Tipp neben das Blatt und Escape schließen das Blatt nicht; ein Tipp sendet höchstens eine Anfrage an Google. Meldet die Seite nach 20 Sekunden ohne Antwort „Google antwortet nicht.“, kann der Wert trotzdem bei Google angekommen sein, und ein erneuter Tipp speichert ihn ein zweites Mal. Das wird hingenommen: Gezählt wird ohnehin nur die erste Messung des Tages, und die zweite lässt sich in der Google-App löschen.
- **AC-6** Schlägt das Speichern fehl, bleibt das Blatt mit dem Wert offen, darunter steht „Speichern fehlgeschlagen: <Grund>“ mit den Gründen, die die Seite schon kennt, und der Wert erscheint nicht auf der Seite. Schlägt danach nur der Abruf fehl, bleibt der Wert auf der Seite, und es steht die bekannte Zeile „Abruf fehlgeschlagen: …“.
- **AC-7** Ein eingetragener Wert bleibt auf der Seite, auch nach Neuladen und nach Abrufen, die ihn noch nicht enthalten. Ein Abruf enthält ihn, wenn er eine Messung mit demselben Gewicht auf 0,1 kg gerundet hat, deren Zeitpunkt höchstens eine Minute von dem des eingetragenen Werts abweicht. Sobald ein Abruf ihn enthält, steht er genau einmal da. Er verschwindet, wenn ein Abruf, der mindestens eine Stunde nach dem Eintragen beginnt, ihn nicht enthält, etwa weil er in der Google-App gelöscht wurde.
- **AC-8** Die Anmeldung fragt Lesen und Schreiben zusammen ab. Wird nur Lesen erlaubt, funktioniert der Abruf wie bisher, und „Eintragen“ zeigt „Speichern fehlgeschlagen: Das Speichern in Google Health wurde nicht erlaubt.“
- **AC-9** „Abmelden“ löscht auch die eingetragenen Werte in diesem Browser und widerruft den Zugriff samt Schreibzugriff.
- **AC-10** Auf 360 × 640 px verdeckt der Knopf weder Überschrift, Satz, Ampel, Zahlen, „Daten abrufen“ noch die Zeile mit einem Fehler; ganz nach unten gescrollt verdeckt er auch nicht den neuesten Punkt im Graphen und nicht „Abmelden“. Bei offener Tastatur sind Feld und „Eintragen“ sichtbar. Auf breiten Bildschirmen sitzt der Knopf unten rechts im Fenster, und der Inhalt des Blatts ist höchstens so breit wie der Inhalt der Seite (960 px) und mittig. Nichts scrollt horizontal.
- **AC-11** „Daten abrufen“, der Abruf beim Zurückkehren auf die Seite, die Berechnung von Trend, Tempo und Urteil, „Letzte Messung“ und „Abmelden“ bleiben sonst unverändert.
- **AC-12** Solange ein eingetragener Wert in keinem Abruf enthalten war, steht in „Letzte Messung“ hinter ihm „, noch nicht aus Google Health abgerufen“, etwa „Letzte Messung 17.10. um 7:02 Uhr: 98,6 kg, noch nicht aus Google Health abgerufen“. Sobald ein Abruf ihn enthält, fällt der Zusatz weg.
- **AC-13** Wird ein Wert eingetragen, bevor je abgerufen wurde, oder liegt nach dem Neuladen nur ein eingetragener Wert und kein Cache vor, zeigt die Seite sofort die volle Ansicht mit diesem Wert (in der Regel „Noch kein Urteil“) statt des Begrüßungstexts, bis der Abruf den Rest bringt.
- **AC-14** Zwei Texte nennen das Schreiben: Der Satz vor dem ersten Abruf lautet „Diese Seite liest deine Gewichtsmessungen aus Google Health, trägt neue ein und zeigt dir, ob du noch abnimmst.“ Nach einem fehlgeschlagenen Widerruf steht „Die Seite darf deine Gewichtsmessungen weiter lesen und eintragen.“ statt „… weiter lesen.“

## Agreed design

Ein FAB unten rechts öffnet ein Blatt von unten mit dem Feld und „Eintragen“. „Eintragen“ meldet an, wo nötig, speichert, zeigt den Wert sofort und ruft danach ab. „Daten abrufen“ bleibt für Tage, an denen nur geschaut wird.

- Artifact: https://claude.ai/artifact/MU33eTTxtriVqqbgJ6WyJy
- Kopie: [`specimens/Main.dc.html`](specimens/Main.dc.html)

**Agreed; build to this, do not redesign.**

## Technical decisions

- **Stored formats** Neuer `localStorage`-Schlüssel `gewicht:eingetragen:v1`: eine Liste von `{time, kg}` (Zeit als ISO-Text wie im Cache) für Werte, die die Seite eingetragen und Google noch nicht zurückgegeben hat. `gewicht:v1` bleibt unverändert; keine Migration.
- **Wire formats** Neu: `POST https://health.googleapis.com/v4/users/me/dataTypes/weight/dataPoints` mit `{"weight": {"sampleTime": {"physicalTime", "utcOffset"}, "weightGrams"}}`; das Speichern gilt als erfolgreich, wenn Google mit 2xx antwortet und die Operation kein `error` enthält; ob sie schon `done` ist, spielt keine Rolle. 401 ist wie beim Abruf eine abgelaufene Anmeldung, 403 die fehlende Erlaubnis aus AC-8. Die Anmeldung fragt zusätzlich `https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.writeonly` ab. Der Scope muss im OAuth-Zustimmungsbildschirm des Google-Cloud-Projekts eingetragen werden; das macht die Person selbst, außerhalb des Repositorys.
- **Trust boundaries** Die Seite schreibt jetzt Gesundheitsdaten in das Google-Konto der Person, mit dem neuen Schreibzugriff. Die Eingabe wird vor dem Senden nach AC-3 geprüft. Eingetragene Werte liegen wie der Cache im `localStorage` dieses Browsers.
- **Dependencies** Keine; Mantine bringt `Drawer`, `Affix` und `ActionIcon` mit.

## Nudges

- Das Schreiben gehört in `src/measurement/google-health.ts`, den einzigen Code, der mit Google spricht. Sein Kommentar „It only ever reads health data“ und `HEALTH_SCOPE` werden zu einem Lese- und einem Schreib-Scope.
- Die Regel, welche Eingabe angenommen wird (AC-3), und die Regel, wann ein eingetragener Wert bleibt oder geht (AC-7), stehen zusammen in `src/measurement/entered-measurement.ts`, rein, mit „jetzt“ als Parameter.
- Das Glossar bekommt „Eintragen“ / `enter` (einen Wert auf der Seite in Google Health schreiben) und „Eingetragene Messung“ / `enteredMeasurement` (ein eingetragener Wert, den Google noch nicht zurückgegeben hat).
- Das Blatt ist Mantines `Drawer` mit `position="bottom"`, der Knopf `Affix` mit `ActionIcon`.
- Die Anmeldung startet in „Eintragen“ vor dem ersten `await`, wie in `fetchData` in `src/app/useMeasurements.ts`.

## Out of scope

- Eintragen für einen anderen Tag oder eine andere Uhrzeit.
- Rückgängig und Löschen in der App; ein Tippfehler wird in der Google-App gelöscht.
- Notizen zur Messung.
- Speichern ohne Verbindung; es schlägt nach AC-6 fehl.
- Der Server aus `changes/backlog/server-mit-webhook.md`.

## Ruled out

- **Feld ganz oben auf der Seite** - verworfen zugunsten des FAB, der die Seite unverändert lässt.
- **Knopf beim Urteil, der das Feld aufklappt** - verworfen zugunsten des FAB.
- **Feste Leiste am unteren Rand** - verworfen zugunsten des FAB; sie braucht dauerhaft Platz unter dem Graphen.
- **Werte nur in diesem Browser speichern** - Handy und Rechner sähen Verschiedenes, und Abmelden löschte die Werte endgültig.
- **Ein eigener Speicher der App** - das ist der Server, also XL.
- **Weiter in der Google-App eintragen und öfter abrufen** - der Wechsel zwischen zwei Apps bliebe.
- **Anmeldung schon beim FAB** - das Popup käme vor dem Tippen, und das Blatt öffnete sich erst nach einem asynchronen Schritt.
- **FAB statt „Daten abrufen“** - nur schauen, etwa am Rechner, ginge dann nur über das Blatt.
- **„Rückgängig“ für ein paar Sekunden nach dem Speichern** - von der Person abgelehnt; ein Tippfehler wird in der Google-App gelöscht.
- **Löschen der heutigen Messungen in der App** - von der Person abgelehnt, wie „Rückgängig“.
- **Auf die Operation von Google warten statt den Wert zu merken** - verlässt sich darauf, dass Google den Wert danach sofort liefert, was nirgends zugesagt ist.
- **Den Wert nur in den Cache legen** - der nächste Abruf ersetzt den Zeitraum und nähme den Wert wieder weg, solange Google ihn noch nicht liefert.
- **Eingetragene Werte als Markierung in `gewicht:v1`** - bräuchte `gewicht:v2` und eine Migration; ein eigener Schlüssel nicht.
- **Ein eigenes Zeichen im Graphen oder ein Symbol für „noch nicht abgerufen“** - der Satz in „Letzte Messung“ sagt es ohne Raten; ein weiteres Zeichen wäre mit dem Ring eines Ausreißers zu verwechseln.
