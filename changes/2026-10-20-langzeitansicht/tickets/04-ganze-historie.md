---
criteria:  CRITERIA.md
closes:    AC-9, AC-10
advances:  
after:     02-fenster-verschieben
status:    done
attempts:  1
---

## Build
Der erste Abruf, auch in einem Browser mit einem Cache von vor dieser Änderung, holt jedes Gewicht aus Google Health; danach ruft die Seite ohne Grenze bei 90 Tagen ab, und ohne jede Messung fehlt „in den letzten 90 Tagen“.

## Done when
> **AC-9** Der erste Abruf ohne Cache und der nächste Abruf in einem Browser, der einen Cache von vor dieser Änderung hat, holen jedes Gewicht, das Google Health hat (hier: ab Ende 2015). Bis dieser Abruf gelungen ist, zeigt die Seite, was der Cache schon hat, und jeder weitere Abruf versucht wieder, alles zu holen; ein fehlgeschlagener Abruf lässt den Cache, wie er war. Während des Abrufs zeigt die Statuszeile, was sie bei jedem Abruf zeigt. Danach holt jeder Abruf die letzten 14 Tage oder alles seit dem letzten Abruf, ohne Grenze bei 90 Tagen. „3 Monate“ und „1 Jahr“ zeigen danach auch Messungen, die älter als 90 Tage sind.

> **AC-10** Ohne jede Messung sagt die Seite „Noch keine Messung in Google Health“, ohne „in den letzten 90 Tagen“, und zeigt weder Umschalter noch Pfeile.

## Technical decisions
> **Stored formats** Der Cache unter `gewicht:v1` bekommt das Feld `fullHistory`: `true`, sobald ein Abruf alles geholt hat. Fehlt es, wie in jedem Cache von vor dieser Änderung, gilt `false`, und der nächste Abruf holt alles. Sonst bleibt die Form, wie sie ist. Gewählter Zeitraum und Fenster werden nicht gespeichert.

> **Wire formats** Keine neuen. Derselbe Endpunkt von Google Health und derselbe Scope; der erste Abruf reicht bis zum 1.1.2000 zurück.

> **Trust boundaries** Keine neue Eingabe und keine neuen Aufrufe. Die gespeicherten persönlichen Daten wachsen: Jeder angemeldete Browser hält die ganze Gewichtshistorie ab 2015 in `localStorage` statt 90 Tagen. „Abmelden“ löscht sie wie bisher.

> **Dependencies** Keine.

## Nudges
> `sixWeekSeries` (`src/trend/six-week-series.ts`) wird zur Reihe eines Fensters und heißt danach. Die Regel für das Fenster (die drei Zeiträume, ihre Kalendermonate und -jahre, das Verschieben, die Grenzen bei heute und bei der ersten Messung, das Fenster beim Umschalten) liegt an einer Stelle unter `src/trend/`. `UBIQUITOUS_LANGUAGE.md` bekommt die Einträge „Zeitraum“ (`span`: 6 Wochen, 3 Monate, 1 Jahr) und das Fenster (`GraphWindow`, nur im Code: erster und letzter Tag, die der Graph zeigt), und der Eintrag „Abrufzeitraum“ sagt, was AC-9 sagt.

## Context
Was ein Abruf holt, entscheidet `periodToFetch` in `src/measurement/cache.ts`, mit der Grenze `MAX_FETCHED_DAYS` von 90 Tagen; `replaceFetchedPeriod` ersetzt den abgerufenen Zeitraum im Cache, `serializeCache` und `parseCache` schreiben und lesen ihn unter `gewicht:v1`. `fetchMeasurements` in `src/measurement/google-health.ts` holt schon alle Seiten ab `from`. `fetchData` in `src/app/useMeasurements.ts` ruft ab und speichert erst, wenn der Abruf gelungen ist. Den Satz ohne Messung schreibt `LatestMeasurement` in `src/app/page.tsx`; dass ohne Messung weder Umschalter noch Pfeile stehen, haben 01 und 02 gebaut. Im Glossar schreibt dieses Ticket „Abrufzeitraum“ neu; „Zeitraum“ und das Fenster hat 01 eingetragen.

## Not here
Zeiträume und Fenster bauen 01 und 02.

Aus `Out of scope`: In Google Health später nachgetragene oder korrigierte Werte, die älter als 14 Tage sind, erreichen die Seite nicht. „Abmelden“ und neu anmelden holt alles neu.

Aus `Out of scope`: Werte vor Ende 2015, die nur in der CSV stehen.

## Left standing

**Review findings not fixed:** none. One review round, which came back with no blockers, should-fix items or nits.

**Fixed after the last review:** none.

**Checks not run:** the reviewer could not drive the page in a browser. It had no browser automation, and neither did a subagent. Nobody looked at AC-10's sentence or at „3 Monate“ / „1 Jahr“ after a fetch in the real page, at 360 px or at full width. jsdom page tests pin both. The time a first full fetch takes against the real Google Health was not measured either. The same goes for how fast the page renders on a phone with the whole history from 2015. The reviewer noted, as unmeasured and not as a finding, two possible slow spots:
- `berlinDay` (`Intl.formatToParts`) runs for every measurement in several passes per render.
- `fetchPage` sets no `pageSize`, so the first fetch may be many requests one after another.

Worth measuring on the phone with the real history.

**Criteria parts no automated test proves:** none.
- AC-9:
  - The full fetch, without a cache and with a cache from before this change, is pinned in `src/app/useMeasurements.test.tsx`. So are the cache shown with „ruft ab …“ during the fetch, a failed fetch leaving the cache byte for byte as it was, the next try fetching everything again, and no limit at 90 days afterwards.
  - The rule itself is pinned in `src/measurement/cache.test.ts`.
  - That „3 Monate“ (one window back) and „1 Jahr“ show older measurements after the first fetch is pinned in `src/app/page.test.tsx`.
  - What Google Health really holds from end of 2015 depends on the real account. Only the stand-in was used.
- AC-10's sentence and the missing toggle and arrows are pinned in `src/app/page.test.tsx`.

**Decisions costly to reverse:**
- The stored cache now carries `fullHistory: boolean`, under the same key `gewicht:v1`.
- `parseCache` reads a missing field as `false`. It reads a field that is present but not a boolean as no valid cache, which also leads to a full fetch.
- `replaceFetchedPeriod` sets the field once a fetched period starts at or before 1.1.2000, and keeps it after that. This holds because every later period reaches back to the fetch before it.
- 1.1.2000 is midnight UTC (`HISTORY_START` in `src/measurement/cache.ts`), not local time, so the domain code stays free of the time zone.

**Departures from technical decisions or nudges:**
- The nudge's parts about `sixWeekSeries`, the window rule and the glossary entries „Zeitraum“ and `GraphWindow` were already built by 01 and 02. This ticket only rewrote the entry „Abrufzeitraum“.
- Beyond the ticket's files, `.claude/skills/run/walk-on.js` now writes `fullHistory: true` into the cache it seeds. That way it models a cache this version writes, not one from before. It removes the token, so the page never fetches there and nothing it shows changes.

**Names not from the glossary, to confirm:** `fullHistory` (named by the technical decision; the glossary entry „Abrufzeitraum“ now mentions it) and `HISTORY_START`.
