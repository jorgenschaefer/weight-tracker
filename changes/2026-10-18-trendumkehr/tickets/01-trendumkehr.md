---
criteria:  CRITERIA.md
closes:    AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8
advances:
after:
status:    ready
attempts:  0
---

## Build
Das Urteil erkennt eine Umkehr früher: Ein Tag zählt nur noch als fallend, wenn auch sein 4-Tage-Tempo fällt, und bei einem 4-Tage-Tempo über +1,0 kg pro Woche lautet die Überschrift „Nimmt zu“. Die fünf Tempo-Stufen werden zur Ampel „4 Wochen: nimmt ab / stagniert / nimmt zu“.

## Done when
> **AC-1** Ein Tag hat einen fallenden Trend, wenn beides gilt: Die 14-Tage-Steigung ist steiler als −0,2 kg pro Woche, und das 4-Tage-Tempo liegt unter −0,2 kg pro Woche. Das 4-Tage-Tempo eines Tages ist sein Trend gegen den Trend des letzten Tages, der 4 bis 7 Tage vor ihm liegt, umgerechnet in kg pro Woche; verglichen wird nur mit Tagen ab dem ersten Tag nach der letzten Lücke. Gibt es keinen solchen Tag, entscheidet die Steigung allein. Alles andere an „Nimmt ab“ und „Seit (mindestens) N Tagen kein Abnehmen“ bleibt: 3 Tage Bestätigung, die Stufen 3–6, 7–13 und ab 14 Tagen, die Zählung nach einer Lücke.

> **AC-2** Liegt das 4-Tage-Tempo des letzten Tages mit Messung über +1,0 kg pro Woche, lautet die Überschrift „Nimmt zu“, an Stelle von „Nimmt ab“ oder „Seit N Tagen kein Abnehmen“, auch wenn die 3 Tage Bestätigung noch nicht um sind. Darunter steht bei N ab 3 „Seit N Tagen kein Abnehmen, zuletzt abgenommen bis T.M.“, ohne Tag mit fallendem Trend „Seit mindestens N Tagen kein Abnehmen“, und bei N unter 3 „Zuletzt abgenommen bis T.M.“. Die Fläche hat die Farben der Stufe von N, bei N unter 3 die der ersten Stufe. Die Überschrift ist gesetzt wie „Nimmt ab“.

> **AC-3** Unter der Überschrift steht die Ampel über 4 Wochen mit genau einer von drei Stufen: „4 Wochen: nimmt ab“ (Tempo unter −0,2), „4 Wochen: stagniert“ (von −0,2 bis +0,2 einschließlich), „4 Wochen: nimmt zu“ (über +0,2). Die bisherigen fünf Tempo-Stufen erscheinen nicht mehr. Die Zahl „Tempo 4 Wochen“ bleibt, wie sie ist, ohne Ziel.

> **AC-4** Mit den Testdaten und zusätzlich 98,4 kg am 18.10.2026 lautet die Seite: am 12.10. „Nimmt ab“; am 13.10. „Seit 3 Tagen kein Abnehmen“ mit „Zuletzt abgenommen bis 10.10.“; am 17.10. „Nimmt zu“ mit „Seit 7 Tagen kein Abnehmen, zuletzt abgenommen bis 10.10.“; am 18.10. „Nimmt zu“ und „4 Wochen: nimmt ab“; am 13.7. „Nimmt zu“ mit „Zuletzt abgenommen bis 11.7.“; am 4.8. „Nimmt zu“ mit „Zuletzt abgenommen bis 2.8.“; am 30.8. steht die Fläche auf der höchsten Stufe.

> **AC-5** Ein einzelner Messwert 3 kg über einem Trend, der mit 0,5 kg pro Woche fällt, lässt „Nimmt ab“ am Tag des Ausreißers und an den 13 Tagen danach stehen und löst an keinem davon „Nimmt zu“ aus.

> **AC-6** Der Vergleich nach einer Lücke, „Letzte Messung vor N Tagen“ und „Noch kein Urteil“ treten an die Stelle von „Nimmt zu“ genauso, wie sie bisher an die Stelle jedes Urteils treten.

> **AC-7** Auf einem Bildschirm von 360 × 640 px sind Überschrift, Satz, Ampel und Zahlen in jedem Zustand ohne Scrollen sichtbar, auch bei „Nimmt zu“ mit dem langen Satz, und nichts scrollt horizontal. Auf breiten Bildschirmen ist die Aufteilung wie bisher.

> **AC-8** Die Zahlen Trend, Gemessen und Tempo 4 Wochen, der Graph, „Letzte Messung“, Abruf und Abmelden bleiben unverändert.

## Technical decisions
> **Stored formats** Keine. Der Cache `gewicht:v1` bleibt unverändert; 4-Tage-Tempo, „Nimmt zu“ und Ampel werden aus den Messungen berechnet.

> **Wire formats** Keine.

> **Trust boundaries** Keine.

> **Dependencies** Keine.

## Nudges
> Das 4-Tage-Tempo hat genau einen Ort, `src/trend/four-day-pace.ts`; im Glossar „4-Tage-Tempo“ / `fourDayPace`.

> Die Regel, wann ein Trend fällt, bleibt in `isFalling` in `src/verdict/verdict.ts`.

> „Nimmt zu“ ist eine eigene Art des Urteils in `src/verdict/verdict.ts`; die Grenze +1,0 kg pro Woche ist dort eine benannte Konstante.

> `PaceBand` in `src/trend/pace.ts` wird zu `loss` / `stagnation` / `gain`.

> In `UBIQUITOUS_LANGUAGE.md` werden Steigung, Urteil, Tempo (drei statt fünf Stufen), Tempo-Stufe und Stufe (färbt auch „Nimmt zu“) angepasst, und „4-Tage-Tempo“ kommt dazu.

> Der 18.10. mit 98,4 kg kommt im Test als künstliche Messung zur Fixture dazu; die Fixture bleibt der Auszug bis 17.10.

> AC-3 und AC-4 ersetzen in den Tests: die Zusage, dass der 17.10. „Nimmt ab“ zeigt; die Tests der fünf Tempo-Stufen; in `src/verdict/assessment.test.ts` „no decrease on 8.8.2026 at the latest“ und „30.8.2026 highest level“, die `noDecrease` erwarten, wo jetzt „Nimmt zu“ steht. Die alte Zusage „spätestens am 8.8. kein Abnehmen“ geht in AC-4 auf, das schon ab dem 4.8. warnt.

## Context
Heute entscheidet `isFalling` in `src/verdict/verdict.ts` allein nach `Trend.slopePerWeek` (`src/trend/trend.ts`); `trendVerdict` zählt von dort die Tage ohne fallenden Trend, mit 3 Tagen Bestätigung, den Stufen und dem ersten gezählten Tag nach der letzten Lücke. `src/verdict/assessment.ts` reicht das Urteil als Status durch; der Vergleich nach einer Lücke, „Letzte Messung vor N Tagen“ und „Noch kein Urteil“ ersetzen es dort schon. `src/trend/pace.ts` hat das 4-Wochen-Tempo mit fünf Stufen, `src/app/Verdict.tsx` zeigt Überschrift, Satz, Tempo-Stufe (`BAND_NAMES`) und Zahlen, setzt die Überschrift über `data-emphasis` in `Verdict.module.css` und wählt die Farben in `surfaceColours`.

Das abgestimmte Muster ist `../specimens/Main.dc.html`: „Nimmt zu“ im bestehenden Farbfeld als Überschrift, die Dauer im Satz darunter, darunter die Ampel an der Stelle der Tempo-Stufe. Sonst bleibt die Seite, wie sie ist; nicht neu gestalten. Das Bild „Stagniert“ darin ist ein erfundenes Beispiel, nur für die Ampel. Unter „Nimmt zu“ darf die Ampel noch „4 Wochen: nimmt ab“ zeigen.

Die Regel aus AC-1 und AC-2 auf der Fixture mit dem 18.10. nachgerechnet ergibt genau die Tage aus AC-4.

jsdom legt nichts aus; `src/app/page.test.tsx` prüft die Breite deshalb an den Stylesheets. Der Skill `run` zeigt die echte Seite an jedem Tag der Testdaten.

## Not here
- Die Überarbeitung der Werte in der oberen Hälfte der Seite; sie folgt, wenn alle Signale feststehen.
- Ein Ziel von −0,5 kg pro Woche auf der Seite.
- Dass das 4-Wochen-Tempo über eine Lücke hinweg vergleicht; das bleibt so.

## Left standing
