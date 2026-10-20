---
effort: L
utility: XL
---

# Einschätzung am Morgen mit einem Kalman-Filter

Gewünscht: Die Einschätzung am Morgen soll auf einem Kalman-Filter beruhen,
der Gewicht und Tempo samt Unsicherheit schätzt. Nach einem Vergleich von
sieben Glättungen und drei Verfahren für die Ampel an der eigenen Historie
(`~/Projects/patientenakte-jorgen/unterlagen/gewicht.csv`, 2023 bis 20.10.2026)
war er der beste: am nächsten am rückblickenden Verlauf (0,35 kg Abweichung,
etwa 2 Tage Verzögerung), Ausreißer wie am 12.10.2026 (99,7 kg) verschieben ihn
kaum. Die Auswertung liegt im Dashboard
https://claude.ai/artifact/R4EPajjDdUse7H6A8qLDvK.

Heute glättet die Seite anders: Der Trend ist der Theil-Sen-Median über 14
Tage (`trends` in `src/trend/trend.ts`), das Urteil vergleicht 7- und
14-Tage-Tempo mit Schwellen aus der Streuung (`src/trend/week-pace.ts`,
`src/trend/scatter.ts`, `src/verdict/verdict.ts`).

Die Einstellung, die in der Auswertung am besten abschnitt:

- Modell: Niveau und Tempo. Messrauschen ±0,55 kg (Varianz 0,3), das
  Gewicht wandert ±0,14 kg pro Tag (0,02), das Tempo ändert sich um etwa
  0,18 kg/Woche pro Woche (1e-4 (kg/Tag)²/Tag). Messungen, die mehr als 2
  Standardabweichungen von der Erwartung abweichen, zählen schwächer.
  Messrauschen und Wandern sind an den Daten geschätzt. Wie schnell sich das
  Tempo ändern darf, geben die Daten nicht her; das ist eine Abwägung
  zwischen schneller Warnung und ruhiger Anzeige.
- Ampel: Grün, wenn zu 80 % sicher ist, dass das Tempo unter −0,1 kg/Woche
  liegt; Rot, wenn zu 80 % sicher ist, dass nicht; sonst Gelb. Die Frage
  „nimmt ab, ja oder nein“ (P(Tempo < 0)) taugt nicht: Auf einem Plateau
  bliebe sie bei 50 % und würde nie rot.
- Seit 2023: an 8 % der Tage mit Abnahme rot, an 4 % der Tage ohne Abnahme
  grün; rot im Median 11 Tage nach Beginn einer Zunahme, grün 14 Tage nach
  Beginn einer Abnahme. Im Oktober 2026: Rot bis 3.10., Gelb ab 4.10., Grün
  ab 8.10., ein Tag Gelb am 18.10.
- Eine Hysterese, die die Farbe festhält, hat die Warnung deutlich verzögert
  (rot im Median nach 26 statt 11 Tagen). Offen: die Farbe erst nach zwei
  Messungen in Folge wechseln.

## Gewünschte Anzeige

Am Beispiel des 20.10.2026:

0. Messung: 96,9 kg
1. Geschätztes Gewicht mit Unsicherheit: 97,4 ± 0,3 kg
2. Tempo mit Unsicherheit und kcal-Defizit bzw. -Überschuss:
   −0,47 ± 0,29 kg/Woche, Defizit 510 ± 320 kcal/Tag
3. Ampel: Grün

Die Spanne der kcal ist groß: Aus drei Wochen Wiegen lässt sich das Defizit
nur auf etwa ±300 kcal genau sagen. Heute zeigt „Langfristig“ die kcal aus
dem 28-Tage-Tempo ohne Spanne (`kcalPerDay` in `src/trend/pace.ts`).

## Ein Satz zum Morgen, nach festen Regeln

Besonders gut: ein Satz, was der Morgen bedeutet, wie diese für Oktober 2026
(ohne LLM, aus dem, was der Filter jeden Morgen hat):

| Tag | Ampel | Satz |
|---|---|---|
| 1.10. | Rot | Du nimmst seit Wochen zu, etwa 0,4 kg pro Woche. |
| 3.10. | Rot | Leichter Morgen, aber ein Tag ändert den Trend noch nicht. |
| 4.10. | Gelb | Die Zunahme ist gestoppt. Ob du abnimmst, ist noch offen. |
| 6.10. | Gelb | Es geht wahrscheinlich abwärts, noch nicht sicher. |
| 8.10. | Grün | Du nimmst wieder ab, etwa 0,45 kg pro Woche. |
| 9.10. | Grün | Du nimmst ab, im Plan. |
| 12.10. | Grün | Ausreißer, der Trend bleibt. |
| 17.10. | Grün | Zwei schwerere Morgen: Du nimmst noch ab, aber langsamer. |
| 18.10. | Gelb | Achtung, die Abnahme wird langsamer. |
| 19.10. | Grün | Wieder auf Kurs. |

Jeder Satz hängt an wenigen Größen: die Ampel heute und seit wann, die Ampel
gestern, wie weit die Messung von der Erwartung abweicht (in
Standardabweichungen), wie sich das Tempo über die letzten Tage ändert, die
Wahrscheinlichkeit nennenswerter Abnahme und die, im Plan zu sein (Tempo
unter −0,5 kg/Woche). Die Grenzen („deutlich“, „über zwei Tage“, „nach
wenigen Tagen“) sind noch festzulegen und an der Historie zu prüfen.

Noch nicht entschieden: eine Prognose, nur als Spanne (4 Wochen: etwa
±1,2 kg).
