---
criteria:  CRITERIA.md
closes:    AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11
advances:
after:
status:    ready
attempts:  0
---

## Build
A fetch for a cache that does not hold the whole history comes in two parts: first the last 90 days, which the page shows at once, then everything since 1.1.2000 behind it, while the status line says „ruft ältere Messungen ab …“ and ⟳ turns.

## Done when
> **AC-1** Ohne Cache (erster Besuch in einem Browser oder nach „Abmelden“) zeigt die Seite nach der Anmeldung das Urteil, die vier Zahlen und den Graphen aus den Messungen der letzten 90 Tage, ohne auf ältere Messungen zu warten.

> **AC-2** Solange diese 90 Tage abgerufen werden, sagt die Statuszeile „ruft ab …“ wie heute.

> **AC-3** Solange die älteren Messungen abgerufen werden, sagt die zweite Zeile der Statuszeile „ruft ältere Messungen ab …“, und ⟳ dreht sich und nimmt keinen Tipp an.

> **AC-4** Sind die älteren Messungen da, reichen der Graph und ‹ zurück bis zur ersten Messung in Google Health, und die Statuszeile sagt „abgerufen <Uhrzeit> Uhr“.

> **AC-5** Scheitert der Abruf der älteren Messungen, zeigt die Seite weiter die Messungen, die sie hat, und die Statuszeile sagt „Abruf fehlgeschlagen: <Grund>“ mit dem Ausrufezeichen. Der nächste Abruf - auf ⟳ oder beim Öffnen der Seite mit einer gültigen Anmeldung - ruft sie erneut ab.

> **AC-6** Wird die Seite geschlossen, während die älteren Messungen abgerufen werden, zeigt sie beim nächsten Öffnen sofort die Messungen im Cache, und der nächste Abruf ruft die älteren erneut ab und sagt dabei „ruft ältere Messungen ab …“.

> **AC-7** Ein Cache, der gespeichert wurde, bevor die ganze Historie abgerufen war, bekommt seine älteren Messungen genauso: Die Seite zeigt sofort, was sie hat, und der Rest kommt dahinter.

> **AC-8** Hält der Cache die ganze Historie, fragt ein Abruf wie heute die letzten 14 Tage an oder alles seit dem letzten Abruf, und die Statuszeile sagt nie „ruft ältere Messungen ab …“.

> **AC-9** Eintragen, während die älteren Messungen abgerufen werden, trägt das Gewicht ein und zeigt es sofort. Die älteren Messungen kommen danach trotzdem, auch wenn ihr Abruf von vorn beginnt.

> **AC-10** „Abmelden“, während die älteren Messungen abgerufen werden, leert die Seite wie heute, und danach erscheinen keine Messungen mehr.

> **AC-11** Auf einem 360 px breiten Bildschirm bricht „ruft ältere Messungen ab …“ nur zwischen Wörtern um, und nichts ist abgeschnitten.

## Technical decisions
> **Stored formats** Keine. `gewicht:v1` behält `fullHistory`; es wird weiter erst `true`, wenn die Historie bis 1.1.2000 im Cache ist. Ein Cache mit `false`, auch einer von vor dem Feld, bekommt die älteren Messungen im Hintergrund.

> **Wire formats** Keine. Beide Teile stellen dieselbe Anfrage wie heute, nur mit anderem Beginn im `filter`: der erste ab 90 Tagen vor jetzt, der zweite ab 1.1.2000 ohne obere Grenze, wie der volle Abruf heute.

> **Trust boundaries** Keine: derselbe Endpunkt, derselbe Lese-Scope.

> **Dependencies** Keine.

## Nudges
> Die Regel, welche Zeiträume ein Abruf holt - zuerst die letzten 90 Tage, dann alles seit 1.1.2000 bis jetzt -, hat ein Zuhause: `src/measurement/cache.ts`, neben `periodToFetch`. Der zweite Teil ersetzt den Cache wie der volle Abruf heute über `replaceFetchedPeriod`.

> `Measurements` sagt, welcher Teil des Abrufs läuft; `statusLine` in `src/app/google-status.ts` macht daraus „ruft ab …“ oder „ruft ältere Messungen ab …“.

> Der Glossareintrag „Abrufzeitraum“ in `UBIQUITOUS_LANGUAGE.md` beschreibt beide Teile.

> Die Test-Doubles unterscheiden die beiden Teile an ihrem Beginn: `src/test/open-page.tsx` und `.claude/skills/run/google-stand-in.js`, dessen `delayMs` für den zweiten Teil eine eigene Verzögerung braucht, damit sich AC-1 und AC-3 mit einem langsamen zweiten Teil zeigen und begehen lassen.

## Context
Today a cache that is missing or has `fullHistory: false` makes `periodToFetch` ask for everything since `HISTORY_START` in one fetch; `replaceFetchedPeriod` sets `fullHistory` once a period reaches back that far, and a shorter period leaves it as it was. `fetchMeasurements` takes only a beginning, no end. `fetchData` in `src/app/useMeasurements.ts` already drops a fetch that a log-out or a later fetch overtook (`logOuts`, `fetchesStarted`), and „Eintragen“ starts a new fetch from the cache it was given. `statusLine` reads `fetching` through `GoogleState`, and its `busy` is what turns ⟳ and refuses its tap.

The agreed look is the specimen `changes/2026-10-21-erster-abruf-im-hintergrund/specimens/aeltere-messungen.html`: the page with the last 90 days shown, the status line saying „ruft ältere Messungen ab …“ beside a turning ⟳. Build to it; do not redesign.

The test doubles today answer every fetch alike - `src/test/open-page.tsx` filters by `from`, and `holdFetch` holds whichever fetch comes next; `google-stand-in.js` waits `delayMs` for every request. The `run` skill's `SKILL.md` lists the stand-in's settings, so a new one is described there too.

## Not here
- Fortschritt als Anzahl oder Prozent.
- `pageSize`, um weniger Anfragen zu stellen.
- Anzeigen, wie lange der Abruf der älteren Messungen noch dauert. Google nennt keine Gesamtzahl; die Seite zeigt währenddessen die letzten 90 Tage, und „ruft ältere Messungen ab …“ sagt, welcher Teil läuft. Ein Abruf, der hängt, scheitert nach 20 s je Seite (`answeredInTime`) und sagt das.
- Dass Urteil und vier Zahlen aus 90 Tagen genau denen aus der ganzen Historie gleichen. Sie dürfen sich ändern, wenn die älteren Messungen kommen; in den Testdaten am 20.10.2026 erst in der dritten Nachkommastelle.
- Was die Seite sagt, wenn die letzten 90 Tage keine Messung haben, ältere aber noch kommen: Sie sagt „Noch keine Messung in Google Health“, bis die älteren da sind.
- An upper bound in the second part's `filter`, and filling the graph page by page as Google's pages arrive: both were ruled out with the user.

## Left standing
