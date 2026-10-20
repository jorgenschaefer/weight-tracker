# Ubiquitous Language

Code in English, page in German.

| Page | Code | Meaning |
|---|---|---|
| Messung | `measurement` | One weight value from Google Health. Per calendar day (Europe/Berlin) only the first one counts. |
| Trend | `trend` | What the Kalman filter estimates on a day with a counting measurement from the counting measurements up to it: the weight („Gewicht, geschätzt“ on the page, „Trend“ in the sentences) and the pace, each with its variance, and z, how many standard deviations the day's measurement lies from what the filter expected. A measurement more than 2 of them off counts less. |
| Ampel | `trafficLight` | Of a day with a counting measurement, from its trend alone: grün `green` where the pace lies under −0,1 kg per week with more than 80 % probability, rot `red` where it lies not under it with more than 80 %, otherwise gelb `yellow`. |
| Sicherheit | `lossCertainty` | The probability that the pace of a day lies under −0,1 kg per week. |
| Satz zum Morgen | `morningSentence` | The sentence for a day with a counting measurement, from the trends of all days with a measurement up to it: its Ampel, z and Sicherheit, the Ampel and z of the day with a measurement before it, and for „Du nimmst seit N Tagen ab/zu.“ the calendar days from the first day of its colour in a row to it, both counted, „seit Wochen“ from 14 on. The first of eleven that applies, from „Die Zunahme ist gestoppt.“ to „Du nimmst seit N Tagen zu.“ (`MorningSentence` in `src/verdict/morning-sentence.ts`). |
| Urteil | `verdict` | The Ampel, the Sicherheit and the Satz zum Morgen of the last day with a measurement, from the first counting measurement on; the surface takes the Ampel's colour. Above the Satz the likelier side: „N % sicher, dass du abnimmst“ where the Sicherheit is at least 50 %, otherwise „N % sicher, dass du nicht abnimmst“, N the probability of that side in whole percent, at most 99. Without any counting measurement „Noch kein Urteil“. |
| – | `assessment` | What the page says on a day: the verdict, up to 3 days after the last measurement; "Letzte Messung vor N Tagen" after that; "Noch kein Urteil" without any counting measurement. Code only; the page has no word for it. |
| Lücke | `gap` | Two consecutive days with a measurement more than 3 days apart (1st → 5th is a gap). |
| Tempo | `pace` | Change of the trend in kg per week over 4 weeks, also across gaps, rounded to hundredths: the 28-day pace, in the block „Langfristig · 4 Wochen“ (`LongTerm`) with its band and the calories a day it stands for, `kcalPerDay`: its amount × 7700 / 7, rounded down to tens, „Defizit“ under 0, „Überschuss“ over 0, none at 0,00. |
| Letzte Messung | `latestMeasurement` | The newest measurement, counting or not. |
| Gemessen | `measuredKg` | The counting measurement of the last day with a measurement. |
| Zählende Messung | `countingMeasurement` | The first measurement of a calendar day (Europe/Berlin); the only one trend, paces and verdict use. |
| Tempo-Stufe | `paceBand` | One of the three bands of the pace by the threshold of the 28-day pace, 1.25 × 0.20 × the Streuung of its day kg per week: „Nimmt ab“ `loss` (under minus it), „Stagniert“ `stagnation` (from minus it to it), „Nimmt zu“ `gain` (over it). |
| Streuung | `scatter` | How far the counting measurements lie from their day's trend: on a day, the root mean square of "counting measurement minus the trend of its day" over the days with a trend in the 28 days before it, 0.7 kg with fewer than 10 of them. Each threshold is 1.25 times what noise alone makes of its value at this Streuung; a value exactly on it is no deviation. |
| Ausreißer | `outlier` | A counting measurement more than 1.25 × the Streuung of its day away from the trend of its day, above or below. |
| Abruf | `fetch` | Fetching the measurements from Google Health into the cache in this browser. |
| Abrufzeitraum | `FetchPeriod` | The period a fetch asks for and replaces in the cache: 90 days on the first fetch, later the last 14 days or everything since the last fetch, at most 90 days. |
| Eintragen | `enter` | Writing a weight typed on the page into Google Health, at the time it is entered. |
| Eingetragene Messung | `enteredMeasurement` | A measurement entered on the page that Google Health has not yet returned in a fetch. |
