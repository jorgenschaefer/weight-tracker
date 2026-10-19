---
criteria:  CRITERIA.md
closes:    AC-1, AC-2, AC-10
advances:  AC-3
after:     
status:    ready
attempts:  0
---

## Build
Ein runder Knopf unten rechts öffnet ein Blatt von unten mit dem Feld „Gewicht heute“, „Eintragen“ und einem X. „Eintragen“ prüft die Eingabe und zeigt bei einer ungültigen den Hinweis; gespeichert wird in diesem Ticket noch nichts.

## Done when
> **AC-1** Unten rechts auf der Seite steht ein runder Knopf mit „+“, für Screenreader „Gewicht eintragen“. Er ist in jedem Zustand der Seite da, auch vor dem ersten Abruf, und bleibt beim Scrollen an seinem Platz.

> **AC-2** Der Knopf öffnet ein Blatt von unten mit dem Feld „Gewicht heute“ (kg), dem Knopf „Eintragen“ und einem X. Der Fokus liegt im Feld, das Handy zeigt die Zahlentastatur. X, ein Tipp neben das Blatt und Escape schließen es, ohne etwas zu speichern.

> **AC-10** Auf 360 × 640 px verdeckt der Knopf weder Überschrift, Satz, Ampel, Zahlen, „Daten abrufen“ noch die Zeile mit einem Fehler; ganz nach unten gescrollt verdeckt er auch nicht den neuesten Punkt im Graphen und nicht „Abmelden“. Bei offener Tastatur sind Feld und „Eintragen“ sichtbar. Auf breiten Bildschirmen sitzt der Knopf unten rechts im Fenster, und der Inhalt des Blatts ist höchstens so breit wie der Inhalt der Seite (960 px) und mittig. Nichts scrollt horizontal.

Für AC-3 gilt nach diesem Ticket: Eine Eingabe, die AC-3 nicht annimmt, auch ein leeres Feld, lässt „Eintragen“ nichts tun als unter dem Feld „Bitte ein Gewicht von 30 bis 250 kg eingeben, mit höchstens einer Nachkommastelle.“ zu zeigen. Eine angenommene Eingabe lässt den Hinweis weg; mehr tut „Eintragen“ mit ihr noch nicht.

## Toward
> **AC-3** Angenommen werden 30 bis 250 kg mit höchstens einer Nachkommastelle, mit Komma oder Punkt. Bei allem anderen, auch einem leeren Feld, speichert „Eintragen“ nichts, und unter dem Feld steht „Bitte ein Gewicht von 30 bis 250 kg eingeben, mit höchstens einer Nachkommastelle.“ Eingetragen wird immer mit dem jetzigen Zeitpunkt.

## Technical decisions
> **Stored formats** Neuer `localStorage`-Schlüssel `gewicht:eingetragen:v1`: eine Liste von `{time, kg}` (Zeit als ISO-Text wie im Cache) für Werte, die die Seite eingetragen und Google noch nicht zurückgegeben hat. `gewicht:v1` bleibt unverändert; keine Migration.

> **Wire formats** Neu: `POST https://health.googleapis.com/v4/users/me/dataTypes/weight/dataPoints` mit `{"weight": {"sampleTime": {"physicalTime", "utcOffset"}, "weightGrams"}}`; das Speichern gilt als erfolgreich, wenn Google mit 2xx antwortet und die Operation kein `error` enthält; ob sie schon `done` ist, spielt keine Rolle. 401 ist wie beim Abruf eine abgelaufene Anmeldung, 403 die fehlende Erlaubnis aus AC-8. Die Anmeldung fragt zusätzlich `https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.writeonly` ab. Der Scope muss im OAuth-Zustimmungsbildschirm des Google-Cloud-Projekts eingetragen werden; das macht die Person selbst, außerhalb des Repositorys.

> **Trust boundaries** Die Seite schreibt jetzt Gesundheitsdaten in das Google-Konto der Person, mit dem neuen Schreibzugriff. Die Eingabe wird vor dem Senden nach AC-3 geprüft. Eingetragene Werte liegen wie der Cache im `localStorage` dieses Browsers.

> **Dependencies** Keine; Mantine bringt `Drawer`, `Affix` und `ActionIcon` mit.

## Nudges
> Die Regel, welche Eingabe angenommen wird (AC-3), und die Regel, wann ein eingetragener Wert bleibt oder geht (AC-7), stehen zusammen in `src/measurement/entered-measurement.ts`, rein, mit „jetzt“ als Parameter.

> Das Glossar bekommt „Eintragen“ / `enter` (einen Wert auf der Seite in Google Health schreiben) und „Eingetragene Messung“ / `enteredMeasurement` (ein eingetragener Wert, den Google noch nicht zurückgegeben hat).

> Das Blatt ist Mantines `Drawer` mit `position="bottom"`, der Knopf `Affix` mit `ActionIcon`.

## Context
Heute zeigt `src/app/page.tsx` den Begrüßungstext (`FirstVisit`), die volle Ansicht (`CachedMeasurements`) oder, bevor die Seite den Cache gelesen hat, nur die leere Fläche (`Surface`). Die Tests der Seite öffnen sie über `src/test/open-page.tsx`. jsdom legt nichts aus; `src/app/page.test.tsx` prüft Breiten deshalb an den Stylesheets. Der Skill `run` zeigt die echte Seite.

Das abgestimmte Muster ist `../specimens/Main.dc.html`: geschlossen ein runder Knopf von 60 px, 20 px vom rechten und unteren Rand, in der Schriftfarbe der Fläche mit einem „+“, für Screenreader „Gewicht eintragen“; geöffnet ein helles Blatt mit runden oberen Ecken, X, Feld „Gewicht heute“ mit „kg“ dahinter und „Eintragen“ daneben, darüber ein abgedunkelter Hintergrund. Bauen wie dort, nicht neu gestalten.

Was dieses Ticket mit den anderen teilt: Es legt `src/measurement/entered-measurement.ts` mit der Regel an, welche Eingabe angenommen wird; 01 und 02 ergänzen dort. Es trägt „Eintragen“ / `enter` und „Eingetragene Messung“ / `enteredMeasurement` ins Glossar ein. Das Blatt ist eine eigene Komponente in `src/app/` mit eigener Testdatei, an die 01 das Speichern anschließt; so bleibt `src/app/page.test.tsx` (heute 403 Zeilen) für 01 und 02 unter 500 Zeilen.

## Not here
- Das Speichern, „Wird gespeichert …“, die Anmeldung und der Wert auf der Seite: 01.
- Eintragen für einen anderen Tag oder eine andere Uhrzeit.
- Notizen zur Messung.

## Left standing
