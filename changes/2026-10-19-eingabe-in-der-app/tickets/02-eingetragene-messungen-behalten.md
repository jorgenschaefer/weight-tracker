---
criteria:  CRITERIA.md
closes:    AC-7, AC-9, AC-11, AC-13
advances:  
after:     01-eintragen
status:    ready
attempts:  0
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
