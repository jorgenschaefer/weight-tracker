---
effort: M
utility: M
---

# Was die Hauptseite zeigt, neu abwägen

Die Hauptseite zeigt, was die Berechnung hergibt (`changes/2026-10-19-fruehwarnung-mit-einer-stimme/`): die Frühwarnung als Überschrift mit dem Satz „Der Trend … seit N Tagen.“ und, an Morgen über der Schwelle, der Karte (`src/app/Verdict.tsx`, `src/app/MorningDeviation.tsx`), den Block „Langfristig · 4 Wochen“ mit dem 28-Tage-Tempo und den kcal pro Tag (`src/app/LongTerm.tsx`), die Zahlen Trend und Gemessen, die Letzte Messung (`src/app/page.tsx`) und den Graphen der letzten sechs Wochen (`src/app/WeightGraph.tsx`).

Gewünscht: für jede dieser Angaben neu abwägen, ob sie ihren Platz auf der Seite verdient. Manches soll vielleicht weg oder größer bzw. kleiner werden, manches fehlt vielleicht.

Bei der Abnahme der Frühwarnung fiel auf, wie sich die Angaben den Bildschirm teilen:

- Die Karte des Morgens und der Knopf „Daten abrufen“ sehen gleich aus: zwei Blöcke über die ganze Breite in den umgekehrten Farben, einer unter dem anderen (`src/app/MorningDeviation.tsx`, `FetchButton` in `src/app/page.tsx`). Das Muster zeigte keinen Knopf; der Knopf steht aber nach jedem Neuladen da (`anmeldung-nach-neuladen.md`).
- Auf 360 × 640 enden die Zahlen am 23.8. der Testdaten mit abgebrochener Anmeldung, Karte und „Daten abrufen“ genau am unteren Rand, bei 640 px.
- Der runde Knopf „+“ zum Eintragen liegt über dem „kg“ hinter dem Wert unter „Gemessen“, wo die Zahlen zwischen 560 und 620 px enden, etwa am 1.10. mit abgebrochener Anmeldung.
