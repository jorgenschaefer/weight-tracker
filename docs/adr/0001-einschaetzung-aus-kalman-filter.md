# 0001. Die Einschätzung beruht auf einem Kalman-Filter; ein falscher Tag ändert seine Einstellungen, nicht die Regeln

- **Status:** Accepted
- **Date:** 2026-10-20

## Context

Die Einschätzung am Morgen beruhte auf selbst erfundenen Regeln: Theil-Sen-Trend über 14 Tage, 7-, 14- und 28-Tage-Tempo, Schwellen aus der Streuung, zwei Tage bis zum Wechsel der Überschrift, Warnstufen, ein eigener Vergleich nach einer Lücke, eine eigene Erkennung von Ausreißern. Jeder Tag, an dem sie falsch lag, brachte eine weitere Regel; vom 17. bis 20.10.2026 wurde das Urteil viermal umgebaut, ein fünfter Umbau lag im Backlog, und am 20.10. sagte die Seite trotzdem „Nimmt zu, seit 3 Tagen“, während das Gewicht seit dem 4.10. fiel.

Der Reflex bei einem falschen Tag ist, eine Regel, eine Schwelle oder einen Sonderfall hinzuzufügen. Jede einzelne sieht wie eine Verbesserung aus; zusammen ergaben sie ein Verhalten, das niemand mehr vorhersagen konnte.

## Decision

Gewicht, Tempo, ihre Unsicherheit, Ausreißer und Ampel kommen aus einem Kalman-Filter mit Niveau und Tempo (`src/trend/trend.ts`), mit wenigen benannten Einstellungen: Messrauschen, Wandern des Gewichts, Änderung des Tempos, die Grenze, ab der eine Messung schwächer zählt, und für die Ampel −0,1 kg pro Woche bei 80 %. Liegt ein Tag falsch, wird eine dieser Einstellungen geändert und mit `analysis/kalman/kalman.py` an der eigenen Historie geprüft - Code und Skript tragen dieselben Werte und ändern sich zusammen. Eine neue Regel neben dem Filter, die seine Zahlen oder die Ampel übersteuert, wird nicht eingeführt.

## Alternatives

- **Weiter selbst erfundene Regeln** - das, was es vorher gab; jede gefundene Schwäche brachte eine neue Regel und die nächste Schwäche trotzdem.
- **Gleitende lineare Regression mit Konfidenzintervall** - Lehrbuchstoff und am leichtesten zu erklären; seit 2023 an 14 bis 19 % der Tage ohne Abnahme grün statt 4 %, weil aufeinanderfolgende Messungen nicht unabhängig sind und das Intervall zu schmal wird.
- **Bayessche Changepoint-Erkennung** - passte zu „seit wann“; deutlich aufwendiger, mit einer weiteren Einstellung (Rate der Wechsel), und nicht an der Historie geprüft.
- **Die Farbe festhalten (Hysterese) oder erst nach zwei Messungen wechseln** - eine Regel über dem Verfahren; die Hysterese verzögerte die Warnung von 11 auf 26 Tage.

## Consequences

Das Verhalten folgt aus fünf Zahlen, die sich an der Historie messen lassen: seit 2023 an 8 % der Tage mit Abnahme rot, an 4 % ohne Abnahme grün, rot im Median 11 Tage nach Beginn einer Zunahme. Lücken und Ausreißer brauchen keine eigenen Regeln mehr. Dafür ist der Filter eine Rekursion über alle Tage, schwerer zu lesen als eine Formel, und eine Einstellung zu ändern heißt, die Auswertung neu laufen zu lassen.

Der Satz zum Morgen ist bewusst eine Schicht fester Regeln über dem Filter (Grenzen bei z = 1 und 2, 14 Tage); seine Grenzen sind nicht an der Historie geprüft. Diese Regeln deuten die Zahlen des Filters, sie ändern weder die Zahlen noch die Ampel.
