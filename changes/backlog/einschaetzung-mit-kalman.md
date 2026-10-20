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

Was der Filter darüber hinaus sagen könnte, noch nicht entschieden:

- das Tempo mit seiner Unsicherheit (z. B. −0,47 ± 0,29 kg/Woche);
- die Wahrscheinlichkeit, im Plan zu sein (Tempo unter −0,5 kg/Woche);
- eine Prognose, nur als Spanne (4 Wochen: etwa ±1,2 kg);
- am Morgen eines Ausreißers den Hinweis, dass er nur schwach zählt.
