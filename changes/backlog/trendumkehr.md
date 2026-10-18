---
effort: M
utility: L
---

# Trendumkehr wird nicht erkannt

Am 18.10.2026 zeigt die Seite „Nimmt ab“ und darunter „Langsames Abnehmen“, obwohl die Gewichtsentwicklung relativ eindeutig eine Trendumkehr ist:

| Tag   | kg    |
|-------|-------|
| 01.10. | 100,9 |
| 02.10. | 100,4 |
| 03.10. | 98,9  |
| 04.10. | 98,1  |
| 05.10. | 98,6  |
| 06.10. | 97,7  |
| 07.10. | 96,8  |
| 08.10. | 97,6  |
| 09.10. | 97,8  |
| 10.10. | 97,5  |
| 11.10. | 97,3  |
| 12.10. | 99,7  |
| 13.10. | 98,1  |
| 14.10. | 97,4  |
| 15.10. | 97,1  |
| 16.10. | 98,3  |
| 17.10. | 98,6  |
| 18.10. | 98,4  |

Nachgerechnet mit dem Code auf `src/test/fixtures/gewicht-2026-07-bis-10.csv` plus 98,4 am 18.10.:

- Der Trend steigt seit dem 11.10. von 96,80 auf 98,36 kg. Seine 14-Tage-Steigung (`slopePerWeek`, `src/trend/trend.ts`) fällt aber bis zum 16.10. noch steiler als −0,2 kg/Woche (−0,42), weil der steile Abfall vom 3. bis 7.10. noch im Fenster liegt; erst am 17.10. ist sie 0,00, am 18.10. +0,41.
- Damit sind erst 2 Tage ohne fallenden Trend vergangen; unter 3 (`CONFIRMATION_DAYS`, `src/verdict/verdict.ts`) bleibt das Urteil „Nimmt ab“.
- Das 4-Wochen-Tempo (`src/trend/pace.ts`) ist −0,28 kg/Woche, also „Langsames Abnehmen“; es vergleicht mit dem Trend vor der Lücke vom 22.09. bis 01.10.
