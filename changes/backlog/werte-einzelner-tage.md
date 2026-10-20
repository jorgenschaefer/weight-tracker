---
effort: M
utility: M
---

# Werte einzelner Tage auslesen

Gewünscht: die Werte einzelner Tage auslesen können, zum Beispiel über den Graphen.

Bisher zeigt die Seite als Zahlen nur die vier Zahlen des letzten Tags: „Gewicht, geschätzt“, „Gemessen“, „Tempo“ und „Defizit“ oder „Überschuss“ (`Figures` in `src/app/Verdict.tsx`). Der Graph der letzten sechs Wochen (`src/app/WeightGraph.tsx`) zeichnet Messungen, Ausreißer als Ringe und das geschätzte Gewicht mit seiner Fläche als reines SVG ohne Interaktion. Beschriftet sind nur ganze Kilo (bei mehr als 5 kg Spanne auf dem Handy jedes zweite) und jeder 10. bzw. 7. Tag. Welcher Wert an einem bestimmten Tag gemessen wurde oder wie viel das geschätzte Gewicht an ihm war, lässt sich nicht ablesen.
