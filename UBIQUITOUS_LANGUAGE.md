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
| Lücke | `gap` | Two consecutive days with a measurement more than 3 days apart (1st → 5th is a gap). The graph breaks the trend's line and band there. |
| Tempo | `pace` | The trend's change of the weight in kg per week, with its standard deviation: „Tempo“ ±X,XX ± Y,YY kg/Wo on the page. Beside it the calories a day it stands for, `kcalPerDay`: its amount × 7700 / 7 and its standard deviation × 7700 / 7, each rounded to the nearest ten, „Bilanz“ 0 at a pace shown as ±0,00, otherwise „Defizit“ at a pace under 0 and „Überschuss“ above it. |
| Letzte Messung | `latestMeasurement` | The newest measurement, counting or not. |
| Gemessen | `measuredKg` | The counting measurement of the last day with a measurement. |
| Zählende Messung | `countingMeasurement` | The first measurement of a calendar day (Europe/Berlin); the only one trend, pace and verdict use. |
| Ausreißer | `outlier` | A counting measurement whose z lies over 2 or under −2: more than 2 standard deviations from the weight the filter expected for its day, above or below. On the graph a larger ring. |
| Zeitraum | `span` | How much the graph shows at once, chosen above it: „6 Wochen“ `sixWeeks`, 42 days; „3 Monate“ `threeMonths`, three calendar months, whole; „1 Jahr“ `oneYear`, a calendar year (`Span` in `src/trend/graph-window/graph-window.ts`). The page opens on „6 Wochen“ and keeps no Zeitraum when closed. |
| – | `GraphWindow` | The first and the last day the graph shows, both included: a window of its Zeitraum. Up to today, the 42 days ending with today, the month of today and the two before, or the year of today; days after today stay empty, and a dashed line marks today. Code only; the page has no word for it. |
| Abruf | `fetch` | Fetching the measurements from Google Health into the cache in this browser. |
| Abrufzeitraum | `FetchPeriod` | The period a fetch asks for and replaces in the cache: 90 days on the first fetch, later the last 14 days or everything since the last fetch, at most 90 days. |
| Eintragen | `enter` | Writing a weight typed on the page into Google Health, at the time it is entered. |
| Eingetragene Messung | `enteredMeasurement` | A measurement entered on the page that Google Health has not yet returned in a fetch. |
| Anmeldung | `signIn` | The page's access to Google Health: the token it holds (`HeldToken`), when Google stops accepting it and whether it may enter. `signIn` in `google-health.ts` opens Google's popup for one; `Measurements.signIn` is its expiry and write grant, `null` while the page is not signed in. „Abmelden“ (`logOut`) revokes it and drops it, the cache and the Eingetragene Messungen from this browser. |
| Statuszeile | `statusLine` | „Google Health“ above „Letzte Messung“, below it what the page does with Google, before it the mark (`StatusMark`) of the Anmeldung or of a failed Abruf, beside it ⟳ (`refresh`). `GoogleStatus` renders it, ⟳ and its Blatt; `statusLine` computes its mark, its second line and whether something runs. |
| Stand | `shownDay` | The earlier day whose page is shown under the band „Stand <day>“, chosen in the graph: everything above the graph as it was on that day, from the measurements up to and including it (`measurementsKnownOn`). The last day with a measurement is no earlier day; without one the page shows today. |
| Blatt | `Sheet` | A panel from the bottom: the one for Eintragen, and the one of the Statuszeile with the Anmeldung, the last Abruf and „Abmelden“. |
