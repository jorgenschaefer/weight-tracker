---
effort: S
utility: S
---

# Beim Schreiben auf das Ende der Operation warten

Die Seite trägt das Gewicht mit `dataPoints.create` in Google Health ein (`changes/2026-10-19-eingabe-in-der-app/`). Google antwortet darauf mit einer Operation, nicht mit dem gespeicherten Wert. Laut Wire formats in `changes/2026-10-19-eingabe-in-der-app/CRITERIA.md` gilt das Speichern schon als erfolgreich, wenn Google mit 2xx antwortet und die Operation kein `error` enthält; ob sie schon `done` ist, spielt keine Rolle.

Scheitert die Operation danach noch, steht der Wert trotzdem als gespeichert auf der Seite. Er verschwindet erst nach der Stunde aus AC-7, ohne dass die Seite einen Fehler meldet.

Gewünscht: beim Schreiben auf das Ende der Operation warten.

## Erst ein Spike

Die Health API dokumentiert keinen Weg, eine Operation abzufragen: Weder das Discovery-Dokument (`https://health.googleapis.com/$discovery/rest?version=v4`, Revision 20261019) noch die REST-Referenz (https://developers.google.com/health/reference/rest) kennen `operations.get`; `Operation` steht dort nur als Typ. Das allgemeine Muster beschreibt https://docs.cloud.google.com/service-infrastructure/docs/polling-operations, für andere APIs.

Ein Spike bei einem echten Eintrag auf der veröffentlichten Seite (nur sie darf schreiben) klärt zweierlei:

1. Was antwortet `dataPoints.create` tatsächlich, `done: true` oder `done: false`? Ist es schon `true`, ist nichts abzuwarten.
2. Antwortet `GET https://health.googleapis.com/v4/<name der Operation>` mit demselben Token, und wird daraus `done: true`?

Bis dahin gilt ein Eintrag als abgeschlossen, sobald Google ihn annimmt, und „Letzte Messung“ sagt „, noch nicht aus Google Health abgerufen“, bis ein Abruf ihn enthält (`changes/2026-10-20-anmeldung-und-abruf/`).
