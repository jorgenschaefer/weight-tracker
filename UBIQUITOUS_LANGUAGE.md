# Ubiquitous Language

Code in English, page in German.

| Page | Code | Meaning |
|---|---|---|
| Messung | `measurement` | One weight value from Google Health. Per calendar day (Europe/Berlin) only the first one counts. |
| Trend | `trend` | The smoothed weight, robust against single outlier days. |
| Urteil | `verdict` | On the page „Frühwarnung · letzte Tage“: what the 7-day pace of the last day with a measurement says against its threshold, 1.25 × 0.80 × the Streuung of its day kg per week: „Nimmt ab“ `losing` (under minus it), „Stagniert“ `holding` (from minus it to it), „Nimmt zu“ `gaining` (over it). With it „Der Trend fällt/stagniert/steigt seit N Tagen.“: N the days since the last day with a measurement on which it said something else, „seit mindestens“ where it said nothing then. |
| – | `assessment` | What the page says on a day: the verdict, the comparison after a gap, "Letzte Messung vor N Tagen", or "Noch kein Urteil". Code only; the page has no word for it. |
| Vergleich nach einer Lücke | `gapComparison` | In place of the Frühwarnung until the day has a 7-day pace after the last gap: the median of the counting measurements after a gap against the trend on the last day before it, clear beyond 2 · s / √n: s the Streuung of the first day after the gap, n the counting measurements after it. Its `variation` is `clearIncrease` ("deutlich mehr", an increase), `clearDecrease` ("deutlich mehr", a decrease) or `withinNormalVariation` ("im Rahmen der normalen Schwankung"). |
| Lücke | `gap` | Two consecutive days with a measurement more than 3 days apart (1st → 5th is a gap). Its length in days is that difference: 22.9. → 1.10. is a gap of 9 days. |
| 7-Tage-Tempo | `weekPace` | The trend of a day against the trend of the last day 7 to 10 days before it, in kg per week; compared only with days from the first after the last gap on. Not on the page as a number; the Frühwarnung says what it is. |
| Tempo | `pace` | Change of the trend in kg per week over 4 weeks, also across gaps, rounded to hundredths: the 28-day pace, in the block „Langfristig · 4 Wochen“ (`LongTerm`) with its band and the calories a day it stands for, `kcalPerDay`: its amount × 7700 / 7, rounded down to tens, „Defizit“ under 0, „Überschuss“ over 0, none at 0,00. |
| Letzte Messung | `latestMeasurement` | The newest measurement, counting or not. |
| Gemessen | `measuredKg` | The counting measurement of the last day with a measurement. |
| Zählende Messung | `countingMeasurement` | The first measurement of a calendar day (Europe/Berlin); the only one trend, paces and verdict use. |
| Warnstufe | `level` | How alarming „Stagniert“ and „Nimmt zu“ are by the days the Frühwarnung has said so: 1–6, 7–13, or 14 and more days. It colours the surface from the first day on; „Nimmt ab“ stays blue. |
| Tempo-Stufe | `paceBand` | One of the three bands of the pace by the threshold of the 28-day pace, 1.25 × 0.20 × the Streuung of its day kg per week: „Nimmt ab“ `loss` (under minus it), „Stagniert“ `stagnation` (from minus it to it), „Nimmt zu“ `gain` (over it). |
| Streuung | `scatter` | How far the counting measurements lie from their day's trend: on a day, the root mean square of "counting measurement minus the trend of its day" over the days with a trend in the 28 days before it, 0.7 kg with fewer than 10 of them. Each threshold is 1.25 times what noise alone makes of its value at this Streuung; a value exactly on it is no deviation. |
| Ausreißer | `outlier` | A counting measurement more than 1.25 × the Streuung of its day away from the trend of its day, above or below. |
| Abweichung am Morgen | `morningDeviation` | The counting measurement of the last day with a measurement where it is an Ausreißer: the card „Heute · X kg über/unter dem Trend“ under the sentence of the Frühwarnung. |
| Abruf | `fetch` | Fetching the measurements from Google Health into the cache in this browser. |
| Abrufzeitraum | `FetchPeriod` | The period a fetch asks for and replaces in the cache: 90 days on the first fetch, later the last 14 days or everything since the last fetch, at most 90 days. |
| Eintragen | `enter` | Writing a weight typed on the page into Google Health, at the time it is entered. |
| Eingetragene Messung | `enteredMeasurement` | A measurement entered on the page that Google Health has not yet returned in a fetch. |
