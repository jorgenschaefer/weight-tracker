---
effort: M
utility: M
---

# Was die Hauptseite zeigt, neu abwägen

Die Hauptseite zeigt, was der Kalman-Filter hergibt (ADR 0001): die Letzte Messung (`src/app/page.tsx`), die Fläche in der Farbe der Ampel, darüber „N % sicher, dass du (nicht) abnimmst“, groß den Satz zum Morgen (`src/app/Verdict.tsx`), darunter vier Zahlen - „Gewicht, geschätzt“, „Gemessen“, „Tempo“ und „Defizit“ oder „Überschuss“, jede mit ihrer Unsicherheit - und den Graphen der letzten sechs Wochen mit dem geschätzten Gewicht und seiner Fläche (`src/app/WeightGraph.tsx`).

Gewünscht: für jede dieser Angaben neu abwägen, ob sie ihren Platz auf der Seite verdient. Manches soll vielleicht weg oder größer bzw. kleiner werden, manches fehlt vielleicht.

Bei der Abnahme der Einschätzung mit dem Kalman-Filter fiel auf:

- Die Sicherheit über dem Satz und das Tempo mit seiner Unsicherheit sagen zum Teil dasselbe: aus beiden folgt, wie sicher eine Abnahme ist. Prüfen, ob beide gebraucht werden.
- Am Anfang einer Historie steht bei einem Tempo nahe 0 „±0,00 … kg/Wo“ neben „Defizit 0 ± 560 kcal/Tag“ (3.7. der Testdaten), weil das Vorzeichen am ungerundeten Tempo hängt.
- Auf 1440 × 900 scrollt die Seite um etwa 40 px, wenn der Satz vier Zeilen braucht (17.10. der Testdaten); die Größen für breite Bildschirme sind ohne Entwurf gewählt.
- Auf 360 × 640 enden die vier Zahlen im ungünstigsten Fall (17.10., ein fehlgeschlagener Abruf, dessen Grund die Statuszeile auf vier Zeilen umbricht) bei 474 px; der Graph beginnt erst darunter und ist nur zur Hälfte zu sehen.
