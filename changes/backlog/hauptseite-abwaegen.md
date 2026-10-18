---
effort: M
utility: M
---

# Was die Hauptseite zeigt, neu abwägen

Die Hauptseite zeigt, was die Berechnung hergibt (`changes/2026-10-17-weight-trend/`): die Einschätzung als Überschrift mit einem Satz darunter, die Tempo-Stufe „4 Wochen: nimmt ab / stagniert / nimmt zu“, die Zahlen Trend, Gemessen und Tempo 4 Wochen (`src/app/Verdict.tsx`), die Letzte Messung (`src/app/page.tsx`) und den Graphen der letzten sechs Wochen (`src/app/WeightGraph.tsx`).

Gewünscht: für jede dieser Angaben neu abwägen, ob sie ihren Platz auf der Seite verdient. Manches soll vielleicht weg oder größer bzw. kleiner werden, manches fehlt vielleicht.

Ein Beispiel für Fehlendes: das durchschnittliche tägliche Kaloriendefizit bzw. der Überschuss. Es lässt sich aus dem Tempo 4 Wochen (`src/trend/pace.ts`) ausrechnen.
