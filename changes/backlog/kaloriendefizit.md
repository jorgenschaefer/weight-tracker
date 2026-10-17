---
effort: S
utility: M
---

# Durchschnittliches tägliches Kaloriendefizit anzeigen

Die Hauptseite zeigt das Tempo in kg pro Woche (`src/trend/pace.ts`), aber nicht, wie viel Kalorien das pro Tag entspricht.

Gewünscht: auf der Hauptseite das durchschnittliche tägliche Kaloriendefizit bzw. den Überschuss sehen.

Offen ist, woher die Zahl kommt. Bisher liest die Seite nur Gewichte aus Google Health (`src/measurement/google-health.ts`); Kaloriendaten gibt es in der App noch nicht.
