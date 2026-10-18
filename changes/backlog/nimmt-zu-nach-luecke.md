---
effort: S
utility: S
---

# „Nimmt zu“ nach einer Lücke trotz fallender Messungen

Nach einer Lücke mit einem Sprung im Gewicht kann gleich nach dem Ende des Vergleichs nach einer Lücke „Nimmt zu“ stehen, obwohl jede Messung seit der Lücke fällt.

Beispiel: 100 kg gleichbleibend bis 20.9.2026, ab 24.9. 102,0 kg und jeden Tag 0,3 kg weniger. Am 28.9. und 29.9. steht „Nimmt zu“ (4-Tage-Tempo +1,53 und +1,03 kg pro Woche), am 30.9. „Seit mindestens 6 Tagen kein Abnehmen“, ab 1.10. „Nimmt ab“. Vor der Trendumkehr-Änderung stand dort „Seit mindestens N Tagen kein Abnehmen“.

Ursache: Die 14 Tage des Trends (`trends`, `src/trend/trend.ts`) reichen in den ersten Tagen nach der Lücke noch über sie zurück; der Trend steigt deshalb zum neuen Niveau hin. Das 4-Tage-Tempo (`fourDayPace`, `src/trend/four-day-pace.ts`) vergleicht zwar nur mit Tagen nach der Lücke, sieht aber genau diesen Anstieg, und `trendVerdict` (`src/verdict/verdict.ts`) sagt über +1,0 kg pro Woche „Nimmt zu“.

Das folgt aus AC-1 und AC-2 in `changes/2026-10-18-trendumkehr/CRITERIA.md`, wie sie formuliert sind. Es wurde so belassen, um es später zusammen mit den übrigen Signalen zu klären. In den Testdaten kommt es nicht vor.
