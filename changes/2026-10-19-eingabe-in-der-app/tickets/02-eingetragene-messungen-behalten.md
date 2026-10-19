---
criteria:  CRITERIA.md
closes:    AC-7, AC-9, AC-11, AC-13
advances:  
after:     01-eintragen
status:    done
attempts:  1
---

## Build
Eingetragene Werte, die Google noch nicht zurückgegeben hat, bleiben in diesem Browser gespeichert: Sie stehen nach dem Neuladen wieder auf der Seite und verschwinden, wenn ein Abruf mindestens eine Stunde nach dem Eintragen sie nicht enthält. „Abmelden“ löscht sie.

## Done when
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
> Die Regel, welche Eingabe angenommen wird (AC-3), und die Regel, wann ein eingetragener Wert bleibt oder geht (AC-7), stehen zusammen in `src/measurement/entered-measurement.ts`, rein, mit „jetzt“ als Parameter.

## Context
01 hat das Eintragen gebaut: `src/measurement/entered-measurement.ts` mit der Regel, welche Eingabe angenommen wird, und der Regel, wann ein Abruf einen eingetragenen Wert enthält; `useMeasurements` in `src/app/useMeasurements.ts` hält die eingetragenen Werte im Speicher, zeigt sie mit den Messungen aus dem Cache und lässt sie fallen, sobald ein Abruf sie enthält. Was 01 dazu offen lässt, steht unter `## Left standing` in `01-eintragen.md`.

Der Cache `gewicht:v1` ist das Muster für den neuen Schlüssel: `src/measurement/cache.ts` hält Schlüssel, gespeicherte Form und deren Prüfung (`parseCache` gibt für einen ungültigen Eintrag `null`, `parseTime` nimmt nur Zeiten, wie `toISOString` sie schreibt); `useMeasurements` liest, schreibt und löscht ihn. Ohne Cache ruft `periodToFetch` die letzten 90 Tage ab, auch wenn eingetragene Werte gespeichert sind.

## Not here
- Feld, Blatt, Speichern und „Letzte Messung“ mit dem Zusatz: 03 und 01; dieses Ticket ändert dort nichts.
- Der Server aus `changes/backlog/server-mit-webhook.md`.

## Left standing
- **The page was not driven in a browser, in either review.** Round 1 had no Chrome tools, and the permission check refused headless Chromium. Round 2 found no Chrome tools either. So the AC-13 view after a reload (full view, „Noch kein Urteil“, no greeting) and the AC-7 reload are proven only by jsdom tests in `src/app/useEnteredMeasurements.test.tsx`. The layout at 360 × 640 and on a wide window was not looked at. The view itself is the same full view that 01 and 03 checked in the browser. Not tried against the real Google either.
- **Beyond the ticket: a split.** `useMeasurements.test.tsx` had 479 lines and had been shortened once already (01's Left standing). So the entered measurements moved out of `useMeasurements.ts` into their own hook, `src/app/useEnteredMeasurements.ts` (`measurements`, `add`, `dropAfterFetch`, `clear`). Three tests moved with it into `useEnteredMeasurements.test.tsx`. `comeIntoView` and `changeVisibility` moved to `src/test/open-page.tsx`.
- **Decisions later code builds on:**
  - `enteredAfterFetch(entered, fetched, startedAt)` in `src/measurement/entered-measurement.ts` replaces `notYetFetched`. A fetch that starts exactly one hour after the entry drops it. The fetch's start is `period.to`: the moment after sign-in, just before the request goes out.
  - Every change to the entered measurements starts from what `localStorage` holds, not from the page's copy, so one tab does not overwrite what another entered (the round-1 blocker). Another open tab's page shows the new value only after its own next change or a reload.
  - No entered measurements means no key: the list is removed, never stored as `[]`. An entry that is not valid reads as none, like the cache.
  - The stored form of one measurement is `toStoredMeasurement` / `parseStoredMeasurement`, now exported from `src/measurement/cache.ts` and shared by both keys. A round-1 nit asked where it should live; it stays in the cache module, and its comment says it serves both.
- **A review finding not fixed (round 2, dropped by the reviewer as out of scope):** if „Abmelden“ runs in another tab while this tab is still saving, this tab can store the value again afterwards. This tab's cache and token are not cleared by another tab's „Abmelden“ either, so the gap existed before this change.
