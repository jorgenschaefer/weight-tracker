# Criteria: Trendumkehr früh erkennen

## Problem

Wenn das Gewicht vom Fallen ins Steigen dreht, sagt die Seite noch gut eine Woche lang, dass du abnimmst: im Urteil „Nimmt ab“ und in der Tempo-Stufe „Langsames Abnehmen“ darunter. Stattdessen solltest du eine Umkehr innerhalb weniger Tage sehen, wie es schon das ursprüngliche Problem verlangt. Ein einzelner Ausreißertag soll dabei weiterhin keinen Alarm auslösen.

Der Fall: Der Trend steigt seit dem 11.10.2026 von 96,80 auf 98,36 kg. Am 18.10. steht trotzdem „Nimmt ab“ und darunter „Langsames Abnehmen“. Mit dem bisherigen Code käme „kein Abnehmen“ erst am 19.10., 8 Tage nach der Umkehr; in dieser Zeit hätte mit dem Essen gegengesteuert werden können. Die Werte stehen in `changes/backlog/trendumkehr.md` und `src/test/fixtures/gewicht-2026-07-bis-10.csv`, der 18.10. mit 98,4 kg nur im Backlog-Eintrag.

## Acceptance criteria

- **AC-1** Ein Tag hat einen fallenden Trend, wenn beides gilt: Die 14-Tage-Steigung ist steiler als −0,2 kg pro Woche, und das 4-Tage-Tempo liegt unter −0,2 kg pro Woche. Das 4-Tage-Tempo eines Tages ist sein Trend gegen den Trend des letzten Tages, der 4 bis 7 Tage vor ihm liegt, umgerechnet in kg pro Woche; verglichen wird nur mit Tagen ab dem ersten Tag nach der letzten Lücke. Gibt es keinen solchen Tag, entscheidet die Steigung allein. Alles andere an „Nimmt ab“ und „Seit (mindestens) N Tagen kein Abnehmen“ bleibt: 3 Tage Bestätigung, die Stufen 3–6, 7–13 und ab 14 Tagen, die Zählung nach einer Lücke.
- **AC-2** Liegt das 4-Tage-Tempo des letzten Tages mit Messung über +1,0 kg pro Woche, lautet die Überschrift „Nimmt zu“, an Stelle von „Nimmt ab“ oder „Seit N Tagen kein Abnehmen“, auch wenn die 3 Tage Bestätigung noch nicht um sind. Darunter steht bei N ab 3 „Seit N Tagen kein Abnehmen, zuletzt abgenommen bis T.M.“, ohne Tag mit fallendem Trend „Seit mindestens N Tagen kein Abnehmen“, und bei N unter 3 „Zuletzt abgenommen bis T.M.“. Die Fläche hat die Farben der Stufe von N, bei N unter 3 die der ersten Stufe. Die Überschrift ist gesetzt wie „Nimmt ab“.
- **AC-3** Unter der Überschrift steht die Ampel über 4 Wochen mit genau einer von drei Stufen: „4 Wochen: nimmt ab“ (Tempo unter −0,2), „4 Wochen: stagniert“ (von −0,2 bis +0,2 einschließlich), „4 Wochen: nimmt zu“ (über +0,2). Die bisherigen fünf Tempo-Stufen erscheinen nicht mehr. Die Zahl „Tempo 4 Wochen“ bleibt, wie sie ist, ohne Ziel.
- **AC-4** Mit den Testdaten und zusätzlich 98,4 kg am 18.10.2026 lautet die Seite: am 12.10. „Nimmt ab“; am 13.10. „Seit 3 Tagen kein Abnehmen“ mit „Zuletzt abgenommen bis 10.10.“; am 17.10. „Nimmt zu“ mit „Seit 7 Tagen kein Abnehmen, zuletzt abgenommen bis 10.10.“; am 18.10. „Nimmt zu“ und „4 Wochen: nimmt ab“; am 13.7. „Nimmt zu“ mit „Zuletzt abgenommen bis 11.7.“; am 4.8. „Nimmt zu“ mit „Zuletzt abgenommen bis 2.8.“; am 30.8. steht die Fläche auf der höchsten Stufe.
- **AC-5** Ein einzelner Messwert 3 kg über einem Trend, der mit 0,5 kg pro Woche fällt, lässt „Nimmt ab“ am Tag des Ausreißers und an den 13 Tagen danach stehen und löst an keinem davon „Nimmt zu“ aus.
- **AC-6** Der Vergleich nach einer Lücke, „Letzte Messung vor N Tagen“ und „Noch kein Urteil“ treten an die Stelle von „Nimmt zu“ genauso, wie sie bisher an die Stelle jedes Urteils treten.
- **AC-7** Auf einem Bildschirm von 360 × 640 px sind Überschrift, Satz, Ampel und Zahlen in jedem Zustand ohne Scrollen sichtbar, auch bei „Nimmt zu“ mit dem langen Satz, und nichts scrollt horizontal. Auf breiten Bildschirmen ist die Aufteilung wie bisher.
- **AC-8** Die Zahlen Trend, Gemessen und Tempo 4 Wochen, der Graph, „Letzte Messung“, Abruf und Abmelden bleiben unverändert.

## Agreed design

„Nimmt zu“ wird im bestehenden Farbfeld zur Überschrift, im Satz des Urteils darunter steht die Dauer; die Tempo-Stufe heißt „4 Wochen: …“. Sonst bleibt die Seite, wie sie ist. Das Bild „Stagniert“ im Muster ist ein erfundenes Beispiel, nur für die Ampel. Nach einer Umkehr darf die Ampel noch „4 Wochen: nimmt ab“ zeigen, auch unter „Nimmt zu“: Die Tempo-Stufe aus dem Problem wird dadurch gelöst, dass sie ihren Zeitraum von 4 Wochen nennt, nicht dadurch, dass sie schneller umschlägt.

- Artifact: https://claude.ai/artifact/KJuBk82LLH7g6CzNRxRLcz
- Kopie: [`specimens/Main.dc.html`](specimens/Main.dc.html)

**Agreed; build to this, do not redesign.**

## Technical decisions

- **Stored formats** Keine. Der Cache `gewicht:v1` bleibt unverändert; 4-Tage-Tempo, „Nimmt zu“ und Ampel werden aus den Messungen berechnet.
- **Wire formats** Keine.
- **Trust boundaries** Keine.
- **Dependencies** Keine.

## Nudges

- Das 4-Tage-Tempo hat genau einen Ort, `src/trend/four-day-pace.ts`; im Glossar „4-Tage-Tempo“ / `fourDayPace`.
- Die Regel, wann ein Trend fällt, bleibt in `isFalling` in `src/verdict/verdict.ts`.
- „Nimmt zu“ ist eine eigene Art des Urteils in `src/verdict/verdict.ts`; die Grenze +1,0 kg pro Woche ist dort eine benannte Konstante.
- `PaceBand` in `src/trend/pace.ts` wird zu `loss` / `stagnation` / `gain`.
- In `UBIQUITOUS_LANGUAGE.md` werden Steigung, Urteil, Tempo (drei statt fünf Stufen), Tempo-Stufe und Stufe (färbt auch „Nimmt zu“) angepasst, und „4-Tage-Tempo“ kommt dazu.
- Der 18.10. mit 98,4 kg kommt im Test als künstliche Messung zur Fixture dazu; die Fixture bleibt der Auszug bis 17.10.
- AC-3 und AC-4 ersetzen in den Tests: die Zusage, dass der 17.10. „Nimmt ab“ zeigt; die Tests der fünf Tempo-Stufen; in `src/verdict/assessment.test.ts` „no decrease on 8.8.2026 at the latest“ und „30.8.2026 highest level“, die `noDecrease` erwarten, wo jetzt „Nimmt zu“ steht. Die alte Zusage „spätestens am 8.8. kein Abnehmen“ geht in AC-4 auf, das schon ab dem 4.8. warnt.

## Out of scope

- Die Überarbeitung der Werte in der oberen Hälfte der Seite; sie folgt, wenn alle Signale feststehen.
- Ein Ziel von −0,5 kg pro Woche auf der Seite.
- Dass das 4-Wochen-Tempo über eine Lücke hinweg vergleicht; das bleibt so.

## Ruled out

- **Wochenvergleich allein** (Trend gegen den von vor 7 Tagen statt der 14-Tage-Steigung) - erkennt die Umkehr erst am 16.10., gibt mehr Fehlalarme und erkennt Stillstand schlechter.
- **Anstieg über das 14-Tage-Tief** - erkennt die Umkehr erst am 16.10.; die Stagnation ab dem 8.10. erkennt es nicht.
- **10-Tage-Fenster für die Steigung** - erkennt die Umkehr erst am 18.10. und schwankt mehr.
- **Nur ein Hinweis neben dem unveränderten Urteil** - die Seite widerspräche sich selbst.
- **7-Tage-Steigung** - bei ±0,57 kg Tagesschwankung etwa ±1,3 kg/Woche unsicher; setzt im August-Anstieg die Zählung mehrmals zurück und warnt am 14.10. wegen des Ausreißers.
- **Tage seit dem tiefsten Trend zählen** - ein altes Tief bleibt wochenlang stehen, wie schon bei „Abstand zum Tief“.
- **Die 3 Tage Bestätigung weglassen oder kürzen** - sie kosten nur 2 der 8 Tage, und ohne sie verdoppeln sich Fehlalarme und Wechsel.
- **Warnung schon bei einem einzelnen Ausreißer (12.10.)** - warnt etwa jeden fünften Tag und wird zur Gewohnheit; widerspricht dem Problem.
- **Ampel mit fünf Stufen** - nicht nötig; drei Stufen mit „stagniert“ reichen.
- **Ampel über 14 Tage** - zeigt „stagniert“ nur an der Hälfte der Tage richtig, sagt fast dasselbe wie das Urteil und kommt genauso spät.
- **−0,5 kg/Woche als Schwelle für das Urteil** - die Abnahme wird nach etwa drei Monaten erwartbar langsamer (S3-Leitlinie Adipositas 2024, Empfehlung 5.11); das gäbe Fehlalarm.
- **Ziel als oberste Ampelstufe („auf Kurs“ / „zu langsam“)** - verliert „stagniert“ als eigene Stufe oder nennt Abnehmen „stagniert“.
- **„Nimmt zu“ als Zusatzzeile oder eine Stufe auffälliger** - die Überschrift ist plakativer.
- **„Nimmt zu“ erst nach den 3 Tagen Bestätigung** - warnt einen Tag später, obwohl „Nimmt zu“ bei echtem Abnehmen kaum fälschlich vorkommt.
- **„Nimmt zu“ mit Haltezeit, bevor es wieder verschwindet** - als Frühwarnung soll es kommen und gehen, wie das 4-Tage-Tempo es sagt; die Farbe folgt ohnehin der Dauer.

## Left standing

- **Review: „Nimmt zu“ direkt nach einer Lücke.** Nach einer Lücke mit einem Sprung steht „Nimmt zu“ ein bis zwei Tage nach dem Ende des Vergleichs, obwohl jede Messung seit der Lücke fällt, weil die 14 Tage des Trends noch über die Lücke zurückreichen. So belassen, wie AC-1 und AC-2 es sagen; festgehalten in `changes/backlog/nimmt-zu-nach-luecke.md`.
- **AC-7** prüft kein automatischer Test vollständig; jsdom legt nichts aus, und `src/app/page.test.tsx` prüft nur die Längen in den Stylesheets. Die Prüfung im Review hat die echte Seite bei 360 × 640 px und 1280 px mit dem Skill `run` an den Tagen aus AC-4 und am 3.10. gezeigt: kein horizontales Scrollen, Überschrift, Satz, Ampel und Zahlen über 640 px (bei „Nimmt zu“ mit dem langen Satz enden die Zahlen bei 446 px), auf breitem Bildschirm dieselbe Aufteilung wie vorher.
- **AC-6** für den Vergleich nach einer Lücke und „Noch kein Urteil“ hat keinen eigenen Test gegen „Nimmt zu“: `assess` entscheidet beide vor dem Urteil, wie bisher. „Letzte Messung vor N Tagen“ statt „Nimmt zu“ ist getestet.
