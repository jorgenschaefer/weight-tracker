---
effort: M
utility: L
---

# Frühwarnung springt bei langsamem Abnehmen

Die Frühwarnung wechselt oft ihre Überschrift, und ein langsames, gleichmäßiges Abnehmen liest sie als Rauschen. Eine Warnung, die an vielen Tagen falsch liegt, lernt man zu übersehen.

Die Schwelle des 7-Tage-Tempos ist 1,25 × 0,80 × die Streuung (`threshold("weekPace", …)` in `src/trend/scatter.ts`), bei einer Streuung von 0,7 kg etwa 0,7 kg pro Woche. Ein Abnehmen langsamer als das steht als „Stagniert“ da, oft auch als „Nimmt zu“.

- In den Testdaten (`src/test/fixtures/gewicht-2026-07-bis-10.csv`, dazu 98,4 kg am 18.10. und 97,0 kg am 19.10.) wechselt die Überschrift an 81 Tagen 17-mal, zwischen 8.9. und 21.9. sechsmal - die Farbe dabei zwischen Blau und Warnstufe.
- In einem erfundenen gleichmäßigen Abnehmen von 0,5 kg pro Woche mit einer Streuung von 0,7 kg (eine Reihe, ein Startwert) sagte sie an 49 Tagen 20-mal „Nimmt ab“, 23-mal „Stagniert“ und 6-mal „Nimmt zu“; „Langfristig“ sagte durchgehend „Nimmt ab“.

Das folgt aus AC-2 und AC-3 von `changes/2026-10-19-fruehwarnung-mit-einer-stimme/`, wie sie vereinbart waren; bei der Abnahme fiel es auf.
