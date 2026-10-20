---
effort: M
utility: M
---

# Anzeige besser verstehen

Die Seite zeigt die Ampel, darüber „N % sicher, dass du (nicht) abnimmst“, den Satz zum Morgen (`src/app/Verdict.tsx`), die vier Zahlen mit ihrer Unsicherheit und den Graphen mit dem geschätzten Gewicht und seiner Fläche (`src/app/WeightGraph.tsx`), aber nicht, wie sie zustande kommen.

Die Zahlen und die Ampel kommen aus einem Kalman-Filter mit fünf benannten Einstellungen (ADR 0001, `src/trend/trend.ts`, `src/verdict/traffic-light.ts`); der Satz zum Morgen ist eine Schicht fester Regeln darüber (`src/verdict/morning-sentence.ts`). Das steht nur im Code und in `docs/adr/`.

Gewünscht: im Detail verstehen können, wie Werte entstehen und wie ein Urteil entstand - damit keine Blackbox-Zahlen zu sehen sind, und um bei komischem Verhalten eine bessere Berechnung planen zu können.
