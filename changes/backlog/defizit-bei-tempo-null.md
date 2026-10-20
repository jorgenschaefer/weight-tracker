---
effort: XS
utility: XS
---

# „Defizit“ neben einem Tempo von „±0,00“

Am Anfang einer Historie steht bei einem Tempo nahe 0 „±0,00 … kg/Wo“ neben „Defizit 0 ± 560 kcal/Tag“ (3.7. der Testdaten).

`Figures` in `src/app/Verdict.tsx` wählt zwischen „Defizit“ und „Überschuss“ mit `trend.pace < 0`, also am ungerundeten Tempo. „Tempo“ zeigt es auf zwei Stellen gerundet (`formatPace` in `src/app/format.ts`), und `kcalPerDay` (`src/trend/pace.ts`) rundet auf zehn kcal.

Aufgefallen bei der Abnahme der Einschätzung mit dem Kalman-Filter.
