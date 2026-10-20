# Criteria: Einschätzung am Morgen mit einem Kalman-Filter

## Problem

Die Einschätzung beruht auf selbst erfundenen Regeln: Theil-Sen-Trend, 7- und 14-Tage-Tempo, Schwellen aus der Streuung, zwei Tage bis zum Wechsel, Vergleich nach einer Lücke. Jede gefundene Schwäche bringt eine neue Regel, und die nächste Schwäche kommt trotzdem. Vom 17. bis 20.10.2026 wurde das Urteil viermal umgebaut, ein fünfter Umbau liegt im Backlog. Stattdessen soll die Einschätzung auf einem etablierten Verfahren der Statistik beruhen, das zu dieser Aufgabe passt: verrauschte tägliche Messungen, ein Gewicht, das sich langsam ändert, die Frage, ob es fällt. Sein Verhalten soll aus wenigen benannten Einstellungen folgen, die an der eigenen Historie geprüft sind. Ein falscher Tag führt dann zu einer anderen Einstellung, nicht zu einer neuen Regel.

Der Fall: Am 20.10.2026, nach dem vierten Umbau, zeigt die Seite „Nimmt zu, seit 3 Tagen“ in Orange, bei 96,9 kg und einem Gewicht, das seit dem 4.10. fällt.

## Acceptance criteria

- **AC-1** Für jeden Tag mit zählender Messung sind das geschätzte Gewicht, das Tempo, beider Unsicherheit, z und die Ampel die Werte, die `kalman` und `traffic_light` in `analysis/kalman/kalman.py` für denselben Tag berechnen, aus allen zählenden Messungen bis zu diesem Tag; die Seite rundet erst beim Anzeigen, wie AC-5 sagt. Mit den Testdaten (`src/test/fixtures/gewicht-2026-07-bis-10.csv`, dazu 98,4 kg am 18.10., 97,0 kg am 19.10. und 96,9 kg am 20.10.2026) stimmt das für jeden Tag vom 1.7. bis 20.10.2026 auf sechs Nachkommastellen.
- **AC-2** Die Ampel ist grün, wenn das Tempo mit mehr als 80 % Wahrscheinlichkeit unter −0,1 kg pro Woche liegt, rot, wenn es mit mehr als 80 % Wahrscheinlichkeit nicht darunter liegt, sonst gelb. Sie hängt nur an ihrem Tag, nicht an den Tagen davor.
- **AC-3** Über dem Satz steht die wahrscheinlichere Seite: „N % sicher, dass du abnimmst“, wenn das Tempo mit mindestens 50 % Wahrscheinlichkeit unter −0,1 kg pro Woche liegt, sonst „N % sicher, dass du nicht abnimmst“. N ist die Wahrscheinlichkeit dieser Seite in ganzen Prozent, höchstens 99.
- **AC-4** Der Satz zum Morgen ist der erste zutreffende dieser Liste. „Gestern“ ist der vorige Tag mit Messung; am ersten Tag mit Messung gilt die Farbe als unverändert. z ist die Abweichung der Messung von der Erwartung des Filters in Standardabweichungen.
  1. Gestern rot, heute gelb: „Die Zunahme ist gestoppt. Ob du abnimmst, ist noch offen.“
  2. Gestern grün, heute gelb: „Achtung, die Abnahme wird langsamer.“
  3. Heute grün, gestern nicht: „Du nimmst wieder ab.“
  4. Heute rot, gestern nicht: „Achtung, du nimmst wieder zu.“
  5. Grün und z > 2: „Ausreißer, der Trend bleibt.“
  6. Rot und z < −2: „Leichter Morgen, aber ein Tag ändert den Trend noch nicht.“
  7. Grün, z > 1 heute und gestern: „Zwei schwerere Morgen: Du nimmst noch ab, aber langsamer.“
  8. Grün: „Du nimmst seit N Tagen ab.“, ab 14 Tagen „Du nimmst seit Wochen ab.“
  9. Gelb, und das Tempo liegt mit mindestens 50 % Wahrscheinlichkeit unter −0,1 kg pro Woche: „Es geht wahrscheinlich abwärts, noch nicht sicher.“
  10. Gelb: „Ob du abnimmst, ist noch offen.“
  11. Rot: „Du nimmst seit N Tagen zu.“, ab 14 Tagen „Du nimmst seit Wochen zu.“

  N in 8 und 11 zählt die Kalendertage seit dem ersten Tag dieser Farbe in Folge, diesen mitgezählt; am ersten Tag greift 3 oder 4, und der erste Tag mit Messung überhaupt ist gelb, also ist N mindestens 2.
- **AC-5** Unter dem Satz stehen vier Zahlen: „Gewicht, geschätzt“ X,X ± Y,Y kg, beide auf eine Stelle gerundet; „Gemessen“ X,X kg; „Tempo“ ±X,XX ± Y,YY kg/Wo, auf zwei Stellen gerundet; „Defizit“ bei einem Tempo unter 0, sonst „Überschuss“, K ± S kcal/Tag, K der Betrag des Tempos in kg pro Woche mal 1100, S seine Unsicherheit mal 1100, beide auf Zehner gerundet.
- **AC-6** Die Fläche, und mit ihr die Farbe des Browsers um die Seite, ist bei Grün #D3EAD0 mit Schrift #163D1B, bei Gelb #F3E2A2 mit #3B3004, bei Rot #F2C6B8 mit #5A1A0B, sonst neutral wie bisher.
- **AC-7** Mit den Testdaten aus AC-1:

  | Tag | Ampel | Zeile über dem Satz | Satz |
  |---|---|---|---|
  | 13.7. | Rot | 92 % sicher, dass du nicht abnimmst | Achtung, du nimmst wieder zu. |
  | 14.7. | Rot | 90 % sicher, dass du nicht abnimmst | Du nimmst seit 2 Tagen zu. |
  | 1.10. | Rot | 95 % sicher, dass du nicht abnimmst | Du nimmst seit Wochen zu. |
  | 3.10. | Rot | 86 % sicher, dass du nicht abnimmst | Leichter Morgen, aber ein Tag ändert den Trend noch nicht. |
  | 4.10. | Gelb | 73 % sicher, dass du nicht abnimmst | Die Zunahme ist gestoppt. Ob du abnimmst, ist noch offen. |
  | 5.10. | Gelb | 54 % sicher, dass du nicht abnimmst | Ob du abnimmst, ist noch offen. |
  | 6.10. | Gelb | 64 % sicher, dass du abnimmst | Es geht wahrscheinlich abwärts, noch nicht sicher. |
  | 8.10. | Grün | 88 % sicher, dass du abnimmst | Du nimmst wieder ab. |
  | 9.10. | Grün | 91 % sicher, dass du abnimmst | Du nimmst seit 2 Tagen ab. |
  | 12.10. | Grün | 91 % sicher, dass du abnimmst | Ausreißer, der Trend bleibt. |
  | 13.10. | Grün | 89 % sicher, dass du abnimmst | Du nimmst seit 6 Tagen ab. |
  | 17.10. | Grün | 81 % sicher, dass du abnimmst | Zwei schwerere Morgen: Du nimmst noch ab, aber langsamer. |
  | 18.10. | Gelb | 74 % sicher, dass du abnimmst | Achtung, die Abnahme wird langsamer. |
  | 19.10. | Grün | 84 % sicher, dass du abnimmst | Du nimmst wieder ab. |
  | 20.10. | Grün | 90 % sicher, dass du abnimmst | Du nimmst seit 2 Tagen ab. |

  Am 19.10. stehen dazu „Gewicht, geschätzt“ 97,7 ± 0,3 kg, „Gemessen“ 97,0 kg, „Tempo“ −0,39 ± 0,29 kg/Wo und „Defizit“ 430 ± 320 kcal/Tag; am 20.10., dem Tag des Problems, 97,4 ± 0,3 kg, 96,9 kg, −0,47 ± 0,29 kg/Wo und „Defizit“ 510 ± 320 kcal/Tag.
- **AC-8** An einem Tag ohne Messung, bis 3 Tage nach der letzten, zeigt die Seite Zeile, Satz, Farbe und die vier Zahlen des letzten Tags mit Messung unverändert; N in AC-4 zählt bis zu jenem Tag. Liegt die letzte Messung mehr als 3 Tage zurück, steht wie bisher „Letzte Messung vor N Tagen“, ohne die Zeile über dem Satz und ohne Satz, auf neutraler Fläche, mit den vier Zahlen des letzten Tags mit Messung. Ohne jede zählende Messung steht „Noch kein Urteil“ ohne Satz. Ab der ersten zählenden Messung gibt es Ampel, Zeile und Satz.
- **AC-9** Der Graph zeigt die sechs Wochen bis heute: die zählenden Messungen als Punkte, das geschätzte Gewicht jedes Tags als Linie mit einer Fläche von ± seiner Unsicherheit. Linie und Fläche brechen an einer Lücke ab. Die Marken bleiben wie bisher: ein Ausreißer, jetzt eine Messung mit z über 2 oder unter −2, ist ein größerer Ring, die letzte Messung die größte Marke, als Ring, wo sie ein Ausreißer ist.
- **AC-10** Es gibt nicht mehr: „Frühwarnung · letzte Tage“, die Überschriften „Nimmt ab“, „Stagniert“ und „Nimmt zu“, „Der Trend fällt/stagniert/steigt seit N Tagen.“, den Vergleich nach einer Lücke, die Karte des Morgens, „Langfristig · 4 Wochen“ und die Farben der Warnstufen.
- **AC-11** Auf 360 × 640 px passt in jedem Zustand alles bis zu den vier Zahlen ohne Scrollen, auch mit „Daten abrufen“, einer zweizeiligen Fehlerzeile und dem längsten Satz aus AC-4. Ab 65em Breite stehen Zeile und Satz links, die vier Zahlen rechts in der Spalte, in der bisher „Langfristig“ und die Zahlen stehen, der Graph darunter.
- **AC-12** Unverändert bleiben: die Zeile „Letzte Messung …“, „Daten abrufen“ und die Fehlerzeile, „Vorläufig, wird aktualisiert …“ mit abgeblendetem Satz, der Knopf „+“ zum Eintragen (eingetragene Messungen zählen sofort) und „Abmelden“.

## Agreed design

Ein Kalman-Filter mit Niveau und Tempo schätzt jeden Morgen Gewicht und Tempo samt Unsicherheit, mit den Einstellungen aus `analysis/kalman/kalman.py`: Messrauschen Varianz 0,3 kg², das Gewicht wandert 0,02 kg²/Tag, das Tempo ändert sich 1e-4 (kg/Tag)²/Tag; eine Messung mehr als 2 Standardabweichungen von der Erwartung entfernt zählt schwächer. Die Ampel kommt aus der Wahrscheinlichkeit, dass das Tempo unter −0,1 kg pro Woche liegt, mit 80 % als Grenze. Die Fläche hat die Farbe der Ampel, darüber steht, wie sicher sie ist, groß der Satz zum Morgen, darunter die vier Zahlen, unten der Graph mit dem geschätzten Gewicht und seiner Unsicherheit.

Seit 2023 an der eigenen Historie (`kalman.py grid`): an 8 % der Tage mit Abnahme rot, an 4 % der Tage ohne Abnahme grün, rot im Median 11 Tage nach Beginn einer Zunahme, grün 14 Tage nach Beginn einer Abnahme, 2,2 Farbwechsel in 30 Tagen. Der Satz wechselt etwa 6-mal in 30 Tagen.

Muster: https://claude.ai/artifact/QZzYYcccR2NX7v2ri43XsF, Kopie in `specimens/muster.html` (echte Messungen bis 20.10.2026; auf 360 × 640 px).

**Agreed; build to this, do not redesign.**

## Technical decisions

- **Stored formats** Keine. Der Cache `gewicht:v1` bleibt unverändert; alles wird aus den Messungen berechnet.
- **Wire formats** Keine.
- **Trust boundaries** Keine.
- **Dependencies** Keine. Der Filter ist von Hand geschrieben, wie in `kalman.py`.

## Nudges

- Der Filter ersetzt Theil-Sen in `src/trend/trend.ts` und liefert je Tag mit Messung Gewicht, Tempo, beider Varianzen und z. Seine Einstellungen - die drei Varianzen, die Grenze von 2 Standardabweichungen und der Anfang (Gewicht der ersten Messung mit Varianz 1 kg², Tempo 0 mit Standardabweichung 0,5 kg pro Woche) - sind benannte Konstanten, mit einem Kommentar, dass `analysis/kalman/kalman.py` dieselben Werte nutzt und beide zusammen geändert werden.
- Die Ampel und die Wahrscheinlichkeit nennenswerter Abnahme stehen in `src/verdict/traffic-light.ts`, −0,1 kg pro Woche und 80 % als benannte Konstanten. Der Satz zum Morgen steht in `src/verdict/morning-sentence.ts`, mit 2, 1 und 14 Tagen als benannten Konstanten.
- Weg fallen samt Tests und CSS: `src/trend/week-pace.ts`, `src/trend/scatter.ts`, `src/trend/outlier.ts`, `src/verdict/gap-comparison.ts`, die Regeln in `src/verdict/verdict.ts`, `src/app/LongTerm.tsx` und `src/app/MorningDeviation.tsx`. Der Faktor 7700 / 7 bleibt eine benannte Konstante.
- Ein Test hält AC-1 gegen die ungerundeten Werte fest, die `kalman` und `traffic_light` aus `kalman.py` für die Testdaten berechnen. `src/test/weight-history-fixture.ts` bekommt die 96,9 kg vom 20.10. zu denen vom 18. und 19.10.
- In `UBIQUITOUS_LANGUAGE.md` kommen dazu: Ampel `trafficLight` (`green`, `yellow`, `red`), Sicherheit `lossCertainty`, Satz zum Morgen `morningSentence`. Trend `trend` (auf der Seite „Gewicht, geschätzt“, in den Sätzen „Trend“) bleibt der Name, jetzt für das, was der Filter für einen Tag schätzt; `Trend` und `trends` in `src/trend/trend.ts` behalten ihre Namen. Tempo und Ausreißer (z > 2) werden neu gefasst, Urteil `verdict` als Ampel, Sicherheit und Satz zum Morgen eines Tags, „Noch kein Urteil“ ohne zählende Messung; `src/verdict/` behält seinen Namen. 7- und 14-Tage-Tempo, Warnstufe, Tempo-Stufe, Streuung, Vergleich nach einer Lücke und Abweichung am Morgen fallen weg. Lücke bleibt, für den Graphen.
- Bei der Abnahme `changes/backlog/warnstufe-nach-stagniert.md` löschen und `changes/backlog/hauptseite-abwaegen.md` gegen die neue Seite neu fassen.

## Out of scope

- Eine Prognose, auch als Spanne.
- Die Phase „Gewicht halten“ (`changes/backlog/erhaltungsphase.md`).

## Ruled out

- **Gleitende lineare Regression mit Konfidenzintervall** - an 14 bis 19 % der Tage ohne Abnahme grün statt 4 %; aufeinanderfolgende Messungen sind nicht unabhängig, das Intervall ist zu schmal.
- **Bayessche Changepoint-Erkennung** - Aufwand XL, nicht an der Historie geprüft.
- **Ein Wort als Überschrift über dem Satz** - wiederholt meist den Satz.
- **Das Tempo als Glocke auf einer Skala** - eine zweite Zeichnung auf kleinem Bildschirm.
- **Das Tempo im Satz** - stünde doppelt da, und der Satz wechselte 9- statt 6-mal in 30 Tagen.
- **Die Farbe festhalten (Hysterese)** - rot im Median nach 26 statt 11 Tagen.
- **Die Farbe erst nach zwei Messungen in Folge wechseln** - eine Regel über dem Verfahren, wie sie das Problem loswerden will.
- **Rot als „80 % sicher, dass du zunimmst“** - ein Stillstand würde im Median erst nach 28 statt 11 Tagen rot.
- **„sicher, dass du dein Gewicht hältst“ bei Gelb** - der Filter kennt das Tempo nie genauer als etwa ±0,29 kg pro Woche; die Zahl bliebe unter 30 %.
- **„Wieder auf Kurs“, „Doch wieder mehr“ und „im Plan“** - zusätzliche Regeln ohne eigene Aussage.
