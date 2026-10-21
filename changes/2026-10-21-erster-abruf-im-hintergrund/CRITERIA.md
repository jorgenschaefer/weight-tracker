# Criteria: Der erste volle Abruf zeigt, was er tut

## Problem
Hat dieser Browser keinen Cache - beim ersten Besuch oder nach „Abmelden“ -, fragt der erste Abruf alle Messungen seit 1.1.2000 an und dauert lange. Die ganze Zeit hat die Seite nichts zu zeigen, und die Statuszeile sagt „ruft ab …“ wie bei einem Abruf der letzten 14 Tage, der nach einer Sekunde fertig ist. Man sieht nicht, ob die Seite arbeitet oder hängt und wie lange es noch dauert. Stattdessen soll man sehen, dass dieser lange Abruf vorankommt.

Beobachtet am 21.10.2026 im dev server nach „Abmelden“ und „Anmelden und abrufen“, mit 740 Messungen ab 20.3.2023 (`changes/backlog/erster-abruf-ohne-anzeige.md`). Wie lange der Abruf dauerte, ist nicht festgehalten.

## Acceptance criteria
- **AC-1** Ohne Cache (erster Besuch in einem Browser oder nach „Abmelden“) zeigt die Seite nach der Anmeldung das Urteil, die vier Zahlen und den Graphen aus den Messungen der letzten 90 Tage, ohne auf ältere Messungen zu warten.
- **AC-2** Solange diese 90 Tage abgerufen werden, sagt die Statuszeile „ruft ab …“ wie heute.
- **AC-3** Solange die älteren Messungen abgerufen werden, sagt die zweite Zeile der Statuszeile „ruft ältere Messungen ab …“, und ⟳ dreht sich und nimmt keinen Tipp an.
- **AC-4** Sind die älteren Messungen da, reichen der Graph und ‹ zurück bis zur ersten Messung in Google Health, und die Statuszeile sagt „abgerufen <Uhrzeit> Uhr“.
- **AC-5** Scheitert der Abruf der älteren Messungen, zeigt die Seite weiter die Messungen, die sie hat, und die Statuszeile sagt „Abruf fehlgeschlagen: <Grund>“ mit dem Ausrufezeichen. Der nächste Abruf - auf ⟳ oder beim Öffnen der Seite mit einer gültigen Anmeldung - ruft sie erneut ab.
- **AC-6** Wird die Seite geschlossen, während die älteren Messungen abgerufen werden, zeigt sie beim nächsten Öffnen sofort die Messungen im Cache, und der nächste Abruf ruft die älteren erneut ab und sagt dabei „ruft ältere Messungen ab …“.
- **AC-7** Ein Cache, der gespeichert wurde, bevor die ganze Historie abgerufen war, bekommt seine älteren Messungen genauso: Die Seite zeigt sofort, was sie hat, und der Rest kommt dahinter.
- **AC-8** Hält der Cache die ganze Historie, fragt ein Abruf wie heute die letzten 14 Tage an oder alles seit dem letzten Abruf, und die Statuszeile sagt nie „ruft ältere Messungen ab …“.
- **AC-9** Eintragen, während die älteren Messungen abgerufen werden, trägt das Gewicht ein und zeigt es sofort. Die älteren Messungen kommen danach trotzdem, auch wenn ihr Abruf von vorn beginnt.
- **AC-10** „Abmelden“, während die älteren Messungen abgerufen werden, leert die Seite wie heute, und danach erscheinen keine Messungen mehr.
- **AC-11** Auf einem 360 px breiten Bildschirm bricht „ruft ältere Messungen ab …“ nur zwischen Wörtern um, und nichts ist abgeschnitten.

## Agreed design
Der erste Abruf holt die letzten 90 Tage, die Seite zeigt sie sofort. Die Messungen davor holt ein zweiter Teil des Abrufs dahinter, der alles seit 1.1.2000 anfragt wie der volle Abruf heute; solange er läuft, sagt die Statuszeile „ruft ältere Messungen ab …“ und ⟳ dreht sich.

- Artifact: https://claude.ai/artifact/FByRSBt5397PmppcF3VoEq
- Kopie: [`specimens/aeltere-messungen.html`](specimens/aeltere-messungen.html)

**Agreed; build to this, do not redesign.**

## Technical decisions
- **Stored formats** Keine. `gewicht:v1` behält `fullHistory`; es wird weiter erst `true`, wenn die Historie bis 1.1.2000 im Cache ist. Ein Cache mit `false`, auch einer von vor dem Feld, bekommt die älteren Messungen im Hintergrund.
- **Wire formats** Keine. Beide Teile stellen dieselbe Anfrage wie heute, nur mit anderem Beginn im `filter`: der erste ab 90 Tagen vor jetzt, der zweite ab 1.1.2000 ohne obere Grenze, wie der volle Abruf heute.
- **Trust boundaries** Keine: derselbe Endpunkt, derselbe Lese-Scope.
- **Dependencies** Keine.

## Nudges
- Die Regel, welche Zeiträume ein Abruf holt - zuerst die letzten 90 Tage, dann alles seit 1.1.2000 bis jetzt -, hat ein Zuhause: `src/measurement/cache.ts`, neben `periodToFetch`. Der zweite Teil ersetzt den Cache wie der volle Abruf heute über `replaceFetchedPeriod`.
- `Measurements` sagt, welcher Teil des Abrufs läuft; `statusLine` in `src/app/google-status.ts` macht daraus „ruft ab …“ oder „ruft ältere Messungen ab …“.
- Der Glossareintrag „Abrufzeitraum“ in `UBIQUITOUS_LANGUAGE.md` beschreibt beide Teile.
- Die Test-Doubles unterscheiden die beiden Teile an ihrem Beginn: `src/test/open-page.tsx` und `.claude/skills/run/google-stand-in.js`, dessen `delayMs` für den zweiten Teil eine eigene Verzögerung braucht, damit sich AC-1 und AC-3 mit einem langsamen zweiten Teil zeigen und begehen lassen.

## Out of scope
- Fortschritt als Anzahl oder Prozent.
- `pageSize`, um weniger Anfragen zu stellen.
- Anzeigen, wie lange der Abruf der älteren Messungen noch dauert. Google nennt keine Gesamtzahl; die Seite zeigt währenddessen die letzten 90 Tage, und „ruft ältere Messungen ab …“ sagt, welcher Teil läuft. Ein Abruf, der hängt, scheitert nach 20 s je Seite (`answeredInTime`) und sagt das.
- Dass Urteil und vier Zahlen aus 90 Tagen genau denen aus der ganzen Historie gleichen. Sie dürfen sich ändern, wenn die älteren Messungen kommen; in den Testdaten am 20.10.2026 erst in der dritten Nachkommastelle.
- Was die Seite sagt, wenn die letzten 90 Tage keine Messung haben, ältere aber noch kommen: Sie sagt „Noch keine Messung in Google Health“, bis die älteren da sind.

## Ruled out
- **Nur eine Anzahl oder ein Datum in der Statuszeile** - die Seite bleibt während der ganzen Wartezeit leer.
- **Der Graph füllt sich Seite für Seite** - hängt davon ab, in welcher Reihenfolge Google die Seiten schickt, und der Cache hielte halbe Zeiträume.
- **Nur `pageSize`** - nicht geprüft, und ohne Rückmeldung, falls es trotzdem langsam bleibt.
- **Ein schneller Teil von 14 oder 42 Tagen** - das Urteil ist falsch und ändert sich, sobald die Historie kommt (aus 14 Tagen gelb mit 45 %, aus 90 Tagen und aus allen grün mit 90 %, in den Testdaten am 20.10.2026).
- **Ein Hinweis im Graphen, allein oder zusätzlich** - auf „6 Wochen“ nicht zu sehen, und ⟳ wäre frei für einen zweiten Abruf daneben.
- **Gar nichts sagen** - löst das Problem nicht.
- **Eine obere Zeitgrenze für den zweiten Teil** - ob Google `AND` im `filter` annimmt, ist ungeprüft, und kein Test-Double sieht den `filter`; ohne Grenze kostet der zweite Teil nur die Anfragen von heute.
