---
criteria:  CRITERIA.md
closes:    AC-1, AC-2, AC-10
advances:  AC-3
after:     
status:    done
attempts:  1
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
- **Check not run as one command.** `npm run check` stops in its `biome check` step with "Found a nested root configuration". The cause is another session's locked git worktree in `.claude/worktrees/fruehwarnung`, which is not part of this change and which I left alone. I ran the steps one by one on this tree: `tsc --noEmit` passed, `biome check src UBIQUITOUS_LANGUAGE.md *.ts *.mts *.json .claude/skills` was clean, `vitest run` passed 27 files and 504 tests, and `next build` succeeded.
- **What no test proves, and how it was checked instead.** jsdom lays nothing out. So these were checked by the two reviews in the real page (`next dev`, headless Chromium driven by Playwright) at 360 × 640 and 1440 × 900, on the first visit, on cached data at every colour level, and after a failed fetch:
  - the button stays in place while the page scrolls (AC-1);
  - scrolled to the bottom it covers nothing, and it never covers the headline, sentence, Ampel, figures, „Daten abrufen“ or the error line (AC-10);
  - nothing scrolls horizontally, and the sheet's content is 960 px wide and centred on the wide window (AC-10);
  - a real tap beside the sheet closes it (AC-2).
  - On level 2 at the top of the page, not yet scrolled, the button covers the newest point in the graph. AC-10 asks for that point only when scrolled to the bottom.
- **The open keyboard was not tried on a real phone (AC-10).** The reviewer stood in for it with a 360 × 340 window, and field and „Eintragen“ stayed visible. On the phone it relies on `interactive-widget=resizes-content` in the viewport (`src/app/layout.tsx`). Chrome on Android honours that. Safari on iOS ignores it, and nobody tried it there. The number keyboard is pinned only as `inputmode="decimal"`; nobody saw it on a phone.
- **Not driven in the browser.** After the second review I made the placeholder „98,6“ keep its grey when an empty field is refused (it turned red under Mantine's error colour, finding rated should-fix). A test pins it, but nobody looked at it in the page.
- **Departure from a nudge: no `Affix`.** The button is an `ActionIcon` with its own `position: fixed` class in `EntrySheet.module.css`. `Affix` places it through Mantine's stylesheet and a rem-scaled variable, which jsdom cannot test. A class can be checked from the stylesheet, the way `page.test.tsx` already checks the layout. It also keeps the button below the sheet's overlay (z-index 100 against Mantine's 200).
- **Colours the design does not settle.** The specimen shows only level 1, where „Eintragen“ and the field's border take the page's text colour. On level 3 that colour is light (#FFF3E8) and would not show on the light sheet. So they take whichever of the page's two colours is darker (`sheetColours` in `EntrySheet.tsx`): the surface #8A380A on level 3, the text colour everywhere else. Mantine's red for the hint is replaced by the sheet's text colour in bold, like the page's problem line, and so is its red border on a refused field.
- **Beyond the sheet component.** `page.module.css` now leaves `padding-bottom: 100px` under the page on every width, so the button covers nothing when scrolled to the bottom. On wide screens that bottom padding used to be 16 px. `layout.tsx` gains the `viewport` export.
- **Names and behaviour later code builds on.** `parseEnteredKg(input): number | null` in `src/measurement/entered-measurement.ts` is the AC-3 rule. Tickets 01 and 02 add to that file. The sheet is `EntrySheet({ colours })` in `src/app/EntrySheet.tsx`, with the form in `EntryForm` beside it; 01 attaches saving there. Two decisions AC-3 does not settle:
  - spaces before and after the number are ignored;
  - a separator with no decimal after it („98,“) is refused, and so is one with no digit before it („,5“).
