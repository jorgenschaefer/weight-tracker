---
effort: M
utility: M
---

# Werte einzelner Tage auslesen

Gewünscht: die Werte einzelner Tage auslesen können, zum Beispiel über den Graphen.

Bisher zeigt die Seite als Zahlen nur Trend und Gemessen des letzten Tags (`src/app/page.tsx`). Der Graph der letzten sechs Wochen (`src/app/WeightGraph.tsx`) zeichnet Messungen, Ausreißer und Trendlinie als reines SVG ohne Interaktion. Beschriftet sind nur ganze Kilo und jeder 7. bzw. 10. Tag. Welcher Wert an einem bestimmten Tag gemessen wurde oder welchen Trend er hatte, lässt sich nicht ablesen.
