---
criteria:  CRITERIA.md
closes:    AC-3, AC-4, AC-5, AC-6, AC-8, AC-12, AC-14
advances:  AC-7, AC-9, AC-11, AC-13
after:     03-blatt
status:    done
attempts:  1
---

## Build
„Eintragen“ im Blatt meldet an, wo nötig, schreibt den Wert in Google Health, zeigt ihn sofort auf der Seite und ruft danach ab. Die eingetragenen Werte hält die Seite in diesem Besuch, im Speicher.

## Done when
> **AC-3** Angenommen werden 30 bis 250 kg mit höchstens einer Nachkommastelle, mit Komma oder Punkt. Bei allem anderen, auch einem leeren Feld, speichert „Eintragen“ nichts, und unter dem Feld steht „Bitte ein Gewicht von 30 bis 250 kg eingeben, mit höchstens einer Nachkommastelle.“ Eingetragen wird immer mit dem jetzigen Zeitpunkt.

> **AC-4** „Eintragen“ meldet bei Google an, wo die Seite keine gültige Anmeldung mit Schreibzugriff hält (ein Popup), und schreibt den Wert in Google Health. Dann schließt sich das Blatt, und der Wert steht sofort auf der Seite: in „Letzte Messung“ mit Uhrzeit, und ist er der erste des Tages, auch in Gemessen, Trend, Urteil und Graph. Danach ruft die Seite ab wie bei „Daten abrufen“.

> **AC-5** Während des Speicherns zeigt der Knopf „Wird gespeichert …“ und nimmt keinen weiteren Tipp an, und X, ein Tipp neben das Blatt und Escape schließen das Blatt nicht; ein Tipp sendet höchstens eine Anfrage an Google. Meldet die Seite nach 20 Sekunden ohne Antwort „Google antwortet nicht.“, kann der Wert trotzdem bei Google angekommen sein, und ein erneuter Tipp speichert ihn ein zweites Mal. Das wird hingenommen: Gezählt wird ohnehin nur die erste Messung des Tages, und die zweite lässt sich in der Google-App löschen.

> **AC-6** Schlägt das Speichern fehl, bleibt das Blatt mit dem Wert offen, darunter steht „Speichern fehlgeschlagen: <Grund>“ mit den Gründen, die die Seite schon kennt, und der Wert erscheint nicht auf der Seite. Schlägt danach nur der Abruf fehl, bleibt der Wert auf der Seite, und es steht die bekannte Zeile „Abruf fehlgeschlagen: …“.

> **AC-8** Die Anmeldung fragt Lesen und Schreiben zusammen ab. Wird nur Lesen erlaubt, funktioniert der Abruf wie bisher, und „Eintragen“ zeigt „Speichern fehlgeschlagen: Das Speichern in Google Health wurde nicht erlaubt.“

> **AC-12** Solange ein eingetragener Wert in keinem Abruf enthalten war, steht in „Letzte Messung“ hinter ihm „, noch nicht aus Google Health abgerufen“, etwa „Letzte Messung 17.10. um 7:02 Uhr: 98,6 kg, noch nicht aus Google Health abgerufen“. Sobald ein Abruf ihn enthält, fällt der Zusatz weg.

> **AC-14** Zwei Texte nennen das Schreiben: Der Satz vor dem ersten Abruf lautet „Diese Seite liest deine Gewichtsmessungen aus Google Health, trägt neue ein und zeigt dir, ob du noch abnimmst.“ Nach einem fehlgeschlagenen Widerruf steht „Die Seite darf deine Gewichtsmessungen weiter lesen und eintragen.“ statt „… weiter lesen.“

Für die ACs unter `## Toward` gilt nach diesem Ticket:

- AC-7: Innerhalb eines Besuchs bleibt ein eingetragener Wert auf der Seite, auch nach Abrufen, die ihn nicht enthalten; enthält ein Abruf ihn nach der Regel aus AC-7, steht er genau einmal da.
- AC-9: „Abmelden“ verwirft die eingetragenen Werte dieses Besuchs und widerruft den Zugriff samt Schreibzugriff.
- AC-11: Alles, was AC-11 nennt, verhält sich außer an den Stellen, die AC-4 bis AC-8, AC-12 und AC-14 ändern, wie vorher.
- AC-13: Ein Wert, der eingetragen wird, bevor je abgerufen wurde, zeigt sofort die volle Ansicht mit diesem Wert statt des Begrüßungstexts, bis der Abruf den Rest bringt.

## Toward
> **AC-7** Ein eingetragener Wert bleibt auf der Seite, auch nach Neuladen und nach Abrufen, die ihn noch nicht enthalten. Ein Abruf enthält ihn, wenn er eine Messung mit demselben Gewicht auf 0,1 kg gerundet hat, deren Zeitpunkt höchstens eine Minute von dem des eingetragenen Werts abweicht. Sobald ein Abruf ihn enthält, steht er genau einmal da. Er verschwindet, wenn ein Abruf, der mindestens eine Stunde nach dem Eintragen beginnt, ihn nicht enthält, etwa weil er in der Google-App gelöscht wurde.

> **AC-9** „Abmelden“ löscht auch die eingetragenen Werte in diesem Browser und widerruft den Zugriff samt Schreibzugriff.

> **AC-11** „Daten abrufen“, der Abruf beim Zurückkehren auf die Seite, die Berechnung von Trend, Tempo und Urteil, „Letzte Messung“ und „Abmelden“ bleiben sonst unverändert.

> **AC-13** Wird ein Wert eingetragen, bevor je abgerufen wurde, oder liegt nach dem Neuladen nur ein eingetragener Wert und kein Cache vor, zeigt die Seite sofort die volle Ansicht mit diesem Wert (in der Regel „Noch kein Urteil“) statt des Begrüßungstexts, bis der Abruf den Rest bringt.

## Technical decisions
> **Stored formats** Neuer `localStorage`-Schlüssel `gewicht:eingetragen:v1`: eine Liste von `{time, kg}` (Zeit als ISO-Text wie im Cache) für Werte, die die Seite eingetragen und Google noch nicht zurückgegeben hat. `gewicht:v1` bleibt unverändert; keine Migration.

> **Wire formats** Neu: `POST https://health.googleapis.com/v4/users/me/dataTypes/weight/dataPoints` mit `{"weight": {"sampleTime": {"physicalTime", "utcOffset"}, "weightGrams"}}`; das Speichern gilt als erfolgreich, wenn Google mit 2xx antwortet und die Operation kein `error` enthält; ob sie schon `done` ist, spielt keine Rolle. 401 ist wie beim Abruf eine abgelaufene Anmeldung, 403 die fehlende Erlaubnis aus AC-8. Die Anmeldung fragt zusätzlich `https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.writeonly` ab. Der Scope muss im OAuth-Zustimmungsbildschirm des Google-Cloud-Projekts eingetragen werden; das macht die Person selbst, außerhalb des Repositorys.

> **Trust boundaries** Die Seite schreibt jetzt Gesundheitsdaten in das Google-Konto der Person, mit dem neuen Schreibzugriff. Die Eingabe wird vor dem Senden nach AC-3 geprüft. Eingetragene Werte liegen wie der Cache im `localStorage` dieses Browsers.

> **Dependencies** Keine; Mantine bringt `Drawer`, `Affix` und `ActionIcon` mit.

## Nudges
> Das Schreiben gehört in `src/measurement/google-health.ts`, den einzigen Code, der mit Google spricht. Sein Kommentar „It only ever reads health data“ und `HEALTH_SCOPE` werden zu einem Lese- und einem Schreib-Scope.

> Die Regel, welche Eingabe angenommen wird (AC-3), und die Regel, wann ein eingetragener Wert bleibt oder geht (AC-7), stehen zusammen in `src/measurement/entered-measurement.ts`, rein, mit „jetzt“ als Parameter.

> Die Anmeldung startet in „Eintragen“ vor dem ersten `await`, wie in `fetchData` in `src/app/useMeasurements.ts`.

## Context
03 hat den Knopf und das Blatt gebaut: eine eigene Komponente in `src/app/` mit eigener Testdatei, und in `src/measurement/entered-measurement.ts` die Regel, welche Eingabe angenommen wird. „Eintragen“ prüft dort schon die Eingabe; mit einer angenommenen tut es noch nichts.

Heute liest die Seite nur. `src/measurement/google-health.ts` meldet mit `signIn` für `HEALTH_SCOPE` an, prüft in `grantedToken` den erteilten Scope (`accessNotGranted`), liest mit `fetchMeasurements` und begrenzt jede Antwort mit `answeredInTime` auf 20 Sekunden (`unreachable`). `src/app/useMeasurements.ts` hält das Zugriffstoken im Speicher, ruft in `fetchData` ab (die Anmeldung vor dem ersten `await`), meldet Fehler als `Problem` mit `action` und verwirft über `logOuts` das Ergebnis eines Abrufs, den ein Abmelden überholt hat. `src/app/page.tsx` zeigt den Begrüßungstext (`FirstVisit`) oder die volle Ansicht (`CachedMeasurements`) mit „Letzte Messung“, die Fehlerzeile `ProblemLine` mit den Gründen aus `reason` und rechnet das Urteil aus den Messungen im Cache. Die Tests der Seite öffnen sie über `src/test/open-page.tsx` gegen ein Google im Speicher.

Was dieses Ticket mit 02 teilt: Es ergänzt `src/measurement/entered-measurement.ts` um die Regel, wann ein Abruf einen eingetragenen Wert enthält; 02 ergänzt dort, wann er nach einer Stunde verschwindet, und seine gespeicherte Form. Die eingetragenen Werte hält dieses Ticket in `useMeasurements`; 02 legt sie dort in `localStorage` ab. `src/app/useMeasurements.test.tsx` (heute 295 Zeilen) und `src/app/page.test.tsx` verlässt dieses Ticket unter 420 Zeilen, damit 02 dort ohne Teilung ergänzen kann.

Den Schreib-Scope trägt die Person selbst im OAuth-Zustimmungsbildschirm ein; bis dahin lässt sich das Schreiben nur gegen das Google im Speicher prüfen, nicht gegen das echte.

## Not here
- Eingetragene Werte über das Neuladen hinaus zu behalten, sie nach einer Stunde ohne Abruf, der sie enthält, zu entfernen, und die volle Ansicht nach dem Neuladen mit nur eingetragenen Werten: 02.
- Rückgängig und Löschen in der App; ein Tippfehler wird in der Google-App gelöscht.
- Speichern ohne Verbindung; es schlägt nach AC-6 fehl.

## Left standing
- **A review finding not fixed: `src/app/useMeasurements.test.tsx` has 479 lines, not under 420 (should-fix, both rounds).** The Context asks for under 420 so that 02 can add without splitting.
  - It went past 500 on the way, and I shortened it by turning repeated cases into tables. No case was dropped.
  - Getting to 420 would mean merging cases that read clearly now, or splitting `useMeasurements.ts`. I found no clean split: entering needs the held sign-in and the fetch, and the fetch drops the entered measurements, so they change together.
  - 02 will probably have to split the hook and its tests first. `page.test.tsx` has 418 lines.
- **Fixed after the second review and not reviewed again; two rounds is the limit:**
  - A fetch that a later one has overtaken is now dropped (`fetchesStarted` in `useMeasurements.ts`). It was the second round's blocker: „Eintragen“ can start a fetch while one is running.
  - The tests for a 403 and for an operation holding `error` in `google-health.test.ts` are back; my shortening had deleted them by mistake.
  - The tests of fetching and coming back into view became tables.
  - None of these changes what a screen shows.
- **Not checked against the real Google.** Writing needs the `writeonly` scope on the OAuth consent screen, which the person adds themselves. So the request body, the `utcOffset` format, the answer as an operation, and the 403 for a missing permission are tested only against stubs and the stand-in (`.claude/skills/run/google-stand-in.js`), not against the Google Health API.
- **What no automated test proves, and how it was checked instead:**
  - That the sign-in popup is not blocked (AC-4). `signIn` runs before the first `await` of the tap, as in `fetchData`, but jsdom and the stand-in have no popup blocker. Not checked in a real browser with the real Google.
  - That „Wird gespeichert …“ is legible, and the sheet's look while saving and after a failure (AC-5, AC-6). The reviews drove the page through the stand-in at 360 × 640 and 1440 × 900: a hanging save with the 20 s timeout, 403, 500, a read-only grant, a failed fetch after saving, a lagging fetch, and „Abmelden“. A stylesheet test pins the colours of the disabled button.
  - AC-4 for trend and graph: a test pins „Gemessen“ for a first weight of the day, and „Noch kein Urteil“ for a weight entered before any fetch. Trend, verdict and graph are computed from the same list. That the point shows in the graph was seen only in the reviews' screenshots.
- **Not fixed, seen in review:** while saving, „Eintragen“ becomes the longer „Wird gespeichert …“. The button grows, and the field shrinks, for as long as the save runs.
- **Decisions that later code builds on:**
  - `READ_SCOPE` and `WRITE_SCOPE` replace `HEALTH_SCOPE`.
  - `SignedIn` and the hook's held token carry `writeGranted`.
  - The new error kind `writeNotGranted` stands for both a 403 and a sign-in without the write scope; its text is in `src/app/failure-reason.ts`, where `reason` moved from `page.tsx` as `failureReason`.
  - The sign-in still requires the read scope: a grant that only writes is `accessNotGranted`, since the fetch after saving needs reading.
  - `enterMeasurement(token, measurement)` sends `utcOffset` for where the browser is, not for Berlin.
  - A 2xx operation that holds an `error` reports „Google antwortet unerwartet.“: none of the reasons the page already knows fits it better, and AC-6 allows only those.
  - In `src/measurement/entered-measurement.ts`, `notYetFetched(entered, fetched)` compares against the measurements of the fetch itself, not the whole cache.
  - The hook exposes `enteredMeasurements` and `enter(kg)`, and the page shows `[...cache, ...enteredMeasurements]`.
  - `EntrySheet({ colours, onEnter })` takes an `EnterWeight`. Before the page has read its cache, `onEnter` is `null` and the sheet is not rendered.
- **Sign-in decisions AC-4 and AC-8 do not settle:**
  - „Eintragen“ keeps a sign-in only once the weight is saved. Holding one whose save failed, or one that only reads, would hide „Daten abrufen“ although nothing was fetched. The cost: a retry after a failed save opens the popup again.
  - A sign-in the visit holds is reused only where it may write and has not expired; otherwise „Eintragen“ signs in anew.
- **Beyond the ticket:** the run skill gained `google-stand-in.js`, Google in memory in the browser, so the page can sign in, fetch and enter without a Google account. The reviews drove this ticket with it, and 02 can use it too.
