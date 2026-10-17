# Ubiquitous Language

Code in English, page in German.

| Page | Code | Meaning |
|---|---|---|
| Messung | `measurement` | One weight value from Google Health. Per calendar day (Europe/Berlin) only the first one counts. |
| Trend | `trend` | The smoothed weight, robust against single outlier days. |
| Urteil | `verdict` | What the page says about the trend: "Nimmt ab", "Seit N Tagen kein Abnehmen", or the comparison after a gap. |
| Lücke | `gap` | Two consecutive days with a measurement more than 3 days apart (1st → 5th is a gap). Its length in days is that difference: 22.9. → 1.10. is a gap of 9 days. |
| Tempo | `pace` | Change of the trend in kg per week over 4 weeks, sorted into five bands from "Zunahme" to "Schnelles Abnehmen". |
| Zählende Messung | `countingMeasurement` | The first measurement of a calendar day (Europe/Berlin); the only one trend, pace and verdict use. |
| Stufe | `level` | How alarming a "kein Abnehmen" verdict is: 3–6, 7–13, or 14 and more days. |
| Tempo-Stufe | `paceBand` | One of the five bands of the pace, from "Zunahme" to "Schnelles Abnehmen". |
| Ausreißer | `outlier` | A counting measurement more than 0.9 kg away from the trend of its day. |
