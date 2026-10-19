---
effort: S
utility: S
---

# Beim Schreiben auf das Ende der Operation warten

Die Seite trägt das Gewicht mit `dataPoints.create` in Google Health ein (`changes/2026-10-19-eingabe-in-der-app/`). Google antwortet darauf mit einer Operation, nicht mit dem gespeicherten Wert. Laut Wire formats in `changes/2026-10-19-eingabe-in-der-app/CRITERIA.md` gilt das Speichern schon als erfolgreich, wenn Google mit 2xx antwortet und die Operation kein `error` enthält; ob sie schon `done` ist, spielt keine Rolle.

Scheitert die Operation danach noch, steht der Wert trotzdem als gespeichert auf der Seite. Er verschwindet erst nach der Stunde aus AC-7, ohne dass die Seite einen Fehler meldet.

Gewünscht: beim Schreiben auf das Ende der Operation warten.
