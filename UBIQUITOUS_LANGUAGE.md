# Ubiquitous Language

Code in English, page in German.

| Page | Code | Meaning |
|---|---|---|
| Messung | `measurement` | One weight value from Google Health. Per calendar day (Europe/Berlin) only the first one counts. |
| Trend | `trend` | The smoothed weight, robust against single outlier days. |
| Urteil | `verdict` | What the trend says: "Nimmt ab", or "Seit (mindestens) N Tagen kein Abnehmen". |
| – | `assessment` | What the page says on a day: the verdict, the comparison after a gap, "Letzte Messung vor N Tagen", or "Noch kein Urteil". Code only; the page has no word for it. |
| Vergleich nach einer Lücke | `gapComparison` | The median of the counting measurements after a gap against the trend on the last day before it. Its `variation` is `clearIncrease` ("deutlich mehr", an increase), `clearDecrease` ("deutlich mehr", a decrease) or `withinNormalVariation` ("im Rahmen der normalen Schwankung"). |
| Lücke | `gap` | Two consecutive days with a measurement more than 3 days apart (1st → 5th is a gap). Its length in days is that difference: 22.9. → 1.10. is a gap of 9 days. |
| Steigung | `slopePerWeek` | How fast the trend changes over its 14 days, in kg per week. The trend falls where it is below -0.2. |
| Tempo | `pace` | Change of the trend in kg per week over 4 weeks, sorted into five bands from "Zunahme" to "Schnelles Abnehmen". |
| Letzte Messung | `latestMeasurement` | The newest measurement, counting or not. |
| Gemessen | `measuredKg` | The counting measurement of the last day with a measurement. |
| Zählende Messung | `countingMeasurement` | The first measurement of a calendar day (Europe/Berlin); the only one trend, pace and verdict use. |
| Stufe | `level` | How alarming a "kein Abnehmen" verdict is: 3–6, 7–13, or 14 and more days. |
| Tempo-Stufe | `paceBand` | One of the five bands of the pace: "Zunahme" `gain`, "Gewicht gehalten" `maintained`, "Langsames Abnehmen" `slowLoss`, "Moderates Abnehmen" `moderateLoss`, "Schnelles Abnehmen" `fastLoss`. |
| Ausreißer | `outlier` | A counting measurement more than 0.9 kg away from the trend of its day. |
| Abruf | `fetch` | Fetching the measurements from Google Health into the cache in this browser. |
| Abrufzeitraum | `FetchPeriod` | The period a fetch asks for and replaces in the cache: 90 days on the first fetch, later the last 14 days or everything since the last fetch, at most 90 days. |
