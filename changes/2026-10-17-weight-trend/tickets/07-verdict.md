---
criteria:  CRITERIA.md
closes:    
advances:  AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-11, AC-23
after:     04-trend
status:    done
attempts:  1
---

## Build
The verdict as pure functions in `src/verdict/`: „Nimmt ab“ or no decrease with its level, the comparison after a gap, the last measurement that is too old, and the case with no verdict yet - combined into the one result the page shows.

## Done when
Toward the ACs below, this ticket makes true, in the domain code and its tests, with nothing on the page yet:

- AC-2: the verdict and „Gemessen“ are computed from counting measurements only; a later measurement of the same day changes neither.
- AC-3: when the trend falls faster than 0.2 kg per week over the last 14 days, the verdict is „Nimmt ab“.
- AC-4: from 3 days on without a falling trend, the verdict is "no decrease since N days", N counted from the last day with a falling trend to the day of the last counting measurement; before that it stays „Nimmt ab“; without any day with a falling trend, it is "at least N days", N counted from the first day that has a trend.
- AC-5: a no-decrease verdict carries its level: 3–6, 7–13, 14 and more days.
- AC-6: with a trend falling at 0.5 kg per week or faster, a single deviating value leaves the verdict at „Nimmt ab“ - for the 12.10.2026 of the fixture and for an artificial value 3 kg above the trend.
- AC-7: with the fixture, the verdict is no-decrease on 8.8.2026 at the latest, at the highest level on 30.8.2026, and „Nimmt ab“ on 12.10.2026 and 17.10.2026.
- AC-8: with the last measurement more than 3 days before today, the result is "last measurement N days ago" instead of a verdict, also when the measurements do not suffice for a trend.
- AC-9: until the 5th counting measurement after a gap, the result is the comparison - N days of gap, the difference between the median of the counting measurements after the gap and the trend on the last day before it, whether it exceeds 2 · s / √n, and whether it is a clear increase; from the 5th on, the verdict again.
- AC-11: the result carries the trend (kg), „Gemessen“ (the counting measurement of the last day with a measurement, kg) and the 4-week pace; no other pace.
- AC-23: the result is "no verdict yet" when the counting measurements do not suffice for a trend, or after a gap with no trend before it.

## Toward
> **AC-2** Pro Kalendertag (Europe/Berlin) zählt die erste Messung; spätere Messungen desselben Tages ändern weder Trend, Tempo noch Urteil noch den angezeigten Wert „Gemessen“.

> **AC-3** Fällt der Trend über die letzten 14 Tage schneller als 0,2 kg pro Woche, lautet das Urteil „Nimmt ab“.

> **AC-4** Fällt der Trend seit 3 oder mehr Tagen nicht mehr schneller als 0,2 kg pro Woche, lautet das Urteil „Seit N Tagen kein Abnehmen“, wobei N die Tage vom letzten Tag mit fallendem Trend bis zum Tag der letzten zählenden Messung sind. Davor bleibt es bei „Nimmt ab“. „Seit 1 Tag“ oder „Seit 2 Tagen kein Abnehmen“ erscheint nie. Gibt es in den vorhandenen Messungen keinen Tag mit fallendem Trend, lautet das Urteil „Seit mindestens N Tagen kein Abnehmen“, mit N als Tagen vom ersten Tag, für den es einen Trend gibt, bis zum Tag der letzten zählenden Messung.

> **AC-5** Das Urteil „kein Abnehmen“ hat drei sichtbar unterscheidbare, mit N zunehmend auffällige Stufen: 3–6 Tage, 7–13 Tage, ab 14 Tagen.

> **AC-6** Fällt der Trend mit 0,5 kg pro Woche oder schneller, ändert ein einzelner abweichender Messwert das Urteil „Nimmt ab“ nicht, egal wie hoch er ist. Geprüft mit dem 12.10.2026 aus den Testdaten und einem künstlichen Fall mit einem Einzelwert 3 kg über dem Trend.

> **AC-7** Mit den Testdaten gilt: spätestens am 8.8.2026 lautet das Urteil „kein Abnehmen“; am 30.8.2026 steht es auf der höchsten Stufe; am 12.10.2026 (Ausreißer 99,7 kg) und am 17.10.2026 lautet es „Nimmt ab“.

> **AC-8** Liegt die letzte Messung mehr als 3 Tage zurück, zeigt die Seite „Letzte Messung vor N Tagen“ statt eines Urteils. Das gilt auch für das Urteil aus dem Cache (AC-14) und wenn die Messungen nicht für einen Trend reichen (AC-23).

> **AC-9** Nach einer Lücke zeigt die Seite, bis wieder 5 zählende Messungen nach der Lücke vorliegen, statt des Urteils den Vergleich „Nach N Tagen ohne Messung: ±x kg gegenüber vorher“. Verglichen wird der Median der zählenden Messungen nach der Lücke mit dem Trend am letzten Tag vor der Lücke. „Deutlich mehr als die normale Schwankung“ steht dabei, wenn der Betrag des Unterschieds größer ist als 2 · s / √n, mit s als Streuung der zählenden Messungen um den Trend in den 4 Wochen vor der Lücke und n als Zahl der zählenden Messungen nach der Lücke; sonst „im Rahmen der normalen Schwankung“. Eine deutliche Zunahme ist orange hervorgehoben, alles andere neutral. Ab der 5. Messung gilt wieder das Urteil aus AC-3 bis AC-5.

> **AC-11** Die Seite zeigt die Zahlen Trend (kg), Gemessen (die zählende Messung des letzten Tages mit Messung, kg) und Tempo (4 Wochen, kg pro Woche, derselbe Wert wie in AC-10). Eine weitere Tempo-Zahl, etwa über 14 Tage, zeigt sie nicht.

> **AC-23** Reichen die zählenden Messungen nicht für einen Trend, oder gibt es nach einer Lücke keinen Trend vor der Lücke, zeigt die Seite in den neutralen Farben statt eines Urteils „Noch kein Urteil“ mit dem Satz „Ein Urteil gibt es ab der 5. Messung.“, dazu „Letzte Messung“ und die Zahl Gemessen; die Zahlen Trend und Tempo fehlen, der Graph zeigt nur die Punkte.

## Technical decisions
> **Stored formats** Cache im `localStorage` des Browsers unter dem versionierten Schlüssel `gewicht:v1`: `{ "fetchedAt": "<ISO-Zeit>", "measurements": [{ "time": "<ISO-Zeit>", "kg": <Zahl> }] }` mit allen rohen Messungen der abgerufenen Zeiträume; die Regel „erste Messung pro Tag“ wendet erst der Code an. Bei fehlendem, unlesbarem oder anders versioniertem Eintrag wird er verworfen und neu geladen. Das Zugriffstoken wird nicht gespeichert. Nichts wird auf dem Server gespeichert; es gibt keine bestehenden Daten zu überführen.

> **Wire formats** Die Seite bietet nach außen keine Schnittstelle. Sie liest den Gewichts-Endpunkt der Google Health API. Die OAuth-Client-ID kommt zur Build-Zeit als `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. Der Container ist als `gewicht` im `service_network` auf Port 3000 erreichbar. Zu dieser Änderung gehört im Repo `~/Projects/infrastructure`: ein Site-Block `gewicht.jorgenschaefer.de` in `hosts/jorgenschaefer/Caddyfile` mit `import security` und `reverse_proxy gewicht:3000`, der Eintrag in `bin/check-redirects`, und vor dem Deployment ein DNS-Eintrag für `gewicht.jorgenschaefer.de` auf den Host (README dort, Abschnitt zu neuen Sites).

> **Trust boundaries** Anmeldung über den Token-Client von Google Identity Services im Browser, ausgelöst durch den Klick auf „Daten abrufen“, mit nur dem Lese-Scope für Health Metrics & Measurements der Google Health API (`https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly`, am 17.10.2026 am echten Konto bestätigt). Das Zugriffstoken liegt nur im Arbeitsspeicher. Gesundheitsdaten werden nur im `localStorage` der eigenen Geräte zwischengespeichert. Ausgehende Aufrufe nur an Google (Identity Services, Health API); Schriften werden mit der App ausgeliefert (`next/font`), nicht zur Laufzeit von Google Fonts geladen. Die App sendet selbst `Cross-Origin-Opener-Policy: same-origin-allow-popups`, weil die Vorgabe `same-origin` aus `caddy/snippets.caddy` das Anmelde-Popup bricht; sendet sie eine eigene Content-Security-Policy, muss diese Google Identity Services zulassen. Das OAuth-Projekt liegt im eigenen Google-Konto; erlaubte JavaScript-Herkünfte sind `https://gewicht.jorgenschaefer.de` und `http://localhost:3000`. Keine Secrets: die Client-ID ist öffentlich.

> **Dependencies** next 16.4.2, react und react-dom 19.3.1, @mantine/core und @mantine/hooks 9.7.2, postcss 8.5.30, postcss-preset-mantine 1.18.0, postcss-simple-vars 7.0.1, typescript 7.0.2, @biomejs/biome 2.5.15, vitest 5.0.5, @vitejs/plugin-react 6.1.2, jsdom 30.1.3, @testing-library/react 16.3.3, @testing-library/dom 10.4.2, @testing-library/jest-dom 7.0.1, @testing-library/user-event 14.6.8, die passenden `@types/*`-Pakete, Node LTS im Docker-Image; das Google-Identity-Services-Skript von Google; keine Chart-Bibliothek, kein Tailwind. Dienst: Google Health API.

## Nudges
> Feature-Module nach `UBIQUITOUS_LANGUAGE.md`: `src/measurement/` (Abruf von Google Health, Cache, erste Messung pro Berliner Kalendertag), `src/trend/` (robuster Trend und Steigung, Tempo mit fünf Stufen), `src/verdict/` (Urteil: Schwelle 0,2 kg/Woche, 3 Tage Bestätigung, Stufen 3/7/14; Lücke: mehr als 3 Tage, Vergleich bis zur 5. Messung), `src/app/` für die Seite. Jede dieser Regeln hat genau einen Ort, benannt nach ihr (etwa `src/verdict/verdict.ts`, `src/verdict/gap.ts`, `src/trend/pace.ts`).

> Die Logik in `src/measurement/` (außer dem Google-Zugriff), `src/trend/` und `src/verdict/` besteht aus reinen Funktionen ohne Browser- oder React-Bezug; „heute“ wird als Parameter übergeben, die Uhr liest nur die UI. So läuft sie später unverändert auf einem Server.

> Tests wie in `einsatz`: neben dem Code (`*.test.ts`), eine Testdatei je Quelldatei. Fixture `src/test/fixtures/gewicht-2026-07-bis-10.csv` ist der Auszug 1.7.–17.10.2026 aus `~/Projects/patientenakte-jorgen/unterlagen/gewicht.csv` im Format `datum,kg` (ein Wert pro Tag, ohne Uhrzeit). Fälle mit mehreren Messungen pro Tag (AC-2), Uhrzeiten und dem künstlichen Ausreißer (AC-6) sind künstliche Testdaten.

> Code und Bezeichner auf Englisch nach `UBIQUITOUS_LANGUAGE.md`, Texte auf der Seite auf Deutsch.

> Bei technisch verschiedenen Optionen mit ähnlichem Aufwand die wählen, die den späteren Server (`changes/backlog/server-mit-webhook.md`) besser vorbereitet.

## Context
**Input.** Counting measurements, Berlin calendar days and gap detection from `src/measurement/` (ticket 02); trend and slope of each day, pace and band and the 6-week series from `src/trend/` (ticket 04). Use them; compute no trend here. The spread s of AC-9 (counting measurements around ticket 04's daily trend in the 4 weeks before the gap) is this ticket's, part of the gap comparison. The fixture and its helper `src/test/weight-history-fixture.ts` are ticket 04's. "Today" is a Berlin calendar day passed in; nothing here reads the clock.

**Home.** `src/verdict/`: the verdict with its levels and the threshold of 0.2 kg per week for a falling trend, the gap comparison (the comparison only - finding the gap is ticket 02's), the too-old case and no verdict yet - each rule in one file named after it (for example `verdict.ts`, `gap.ts`). Names from the glossary: `verdict`, `level`, `gap`, `trend`, `pace`, `paceBand`. Add the directory to the structural check ticket 02 introduced: no React, Next.js, browser API or clock, and the import order 02 fixed.

**What ticket 05 builds on.** Ticket 05 hands in the counting measurements and today, and gets back everything the page shows: one result that is exactly one of „Nimmt ab“, no decrease (N, whether "at least", level), the gap comparison (N days, difference in kg, clear or within the normal variation, clear increase or not), last measurement too old (N days), no verdict yet; and beside it the trend, „Gemessen“, the pace with its band, and ticket 04's 6-week series for ticket 06's graph. Ticket 05 renders this and decides no rule itself. The shape is this ticket's.

**Gap**, as the glossary defines it: two consecutive days with a counting measurement more than 3 days apart (1st → 5th is a gap), and its length N is that difference. The fixture has one: 22.9. → 1.10.2026, a gap of 9 days; the agreed specimen shows „Nach 9 Tagen ohne Messung“, with 3.10. as the 3rd measurement after it with a clear increase, and 4.10. within the normal variation. AC-8 matches it: the last measurement is too old when today minus its day is more than 3. AC-8 wins over AC-23 where both apply.

**Ruled out** in `CRITERIA.md`, and not to be reintroduced here:
- **Ausreißer aus dem Urteil ausschließen** - ein anhaltender echter Sprung sähe anfangs aus wie ein Ausreißer und würde zu spät erkannt.
- **Schwelle 0,5 kg/Woche für „Nimmt ab“** - nach etwa drei Monaten verlangsamt sich die Abnahme erwartbar (S3-Leitlinie Adipositas 2024, Empfehlung 5.11); das gäbe falschen Alarm.

## Not here
- Trend, pace, outliers and the 6-week series: ticket 04.
- Anything rendered: texts, colours and German formatting are ticket 05's, the graph ticket 06's.
- From `CRITERIA.md`'s out of scope:
- Die Phase „Gewicht halten“ und das Erkennen langsamer Drift über Monate (`changes/backlog/erhaltungsphase.md`).
- Erklärung, wie Werte und Urteil entstehen (`changes/backlog/anzeige-nachvollziehen.md`).
- Mehrere Nutzer; Import der alten CSV-Historie.

## Left standing

**Checks.** `npm run check` passes: 20 test files, 322 tests. Nothing is rendered yet, so the app was not driven. Every criterion this ticket advances is proven by tests in `src/verdict/*.test.ts`, except one absence. AC-11's "no other pace" is proven by reading the code instead: `Assessment` carries one pace, `pace` from `src/trend/pace.ts`. The trend's 14-day `slopePerWeek` is used only for the "falling" rule.

**Review findings not fixed.** Both are should-fix findings from the second round. Each is behaviour the user sees that the criteria do not settle, so the user has to decide it.
- **„Nimmt ab“ for a trend that never fell, in its first 2 days.** Suppose no trend has fallen yet and the first day with a trend lies less than 3 days back, e.g. 90.0, 90.2, 90.4, 90.6, 90.8 kg on 1.–5.10. The verdict is then „Nimmt ab“, though the weight rises. This applies one rule to both cases of AC-4: under 3 days without a falling trend it stays „Nimmt ab“. That is also what the specimens' script does (`lastFall == null` gives level 0, „Nimmt ab“). AC-4 forbids „Seit 1/2 Tagen“ but does not say what stands instead in the "mindestens" case. „Noch kein Urteil“ would be the alternative, but it contradicts „Ein Urteil gibt es ab der 5. Messung.“ The rule is in `trendVerdict`, `src/verdict/verdict.ts`, and the test „stays „Nimmt ab“ for the first 2 days with a trend“ pins it.
- **"No decrease" counts across a gap.** From the 5th measurement after a gap, N counts from the last falling day, even if that day lies before the gap. The gap's days count too. Example from the reviewer: a fast loss up to 1.9., a 30-day gap, then 5 flat measurements. On 4.10. the page shows the comparison "clear decrease". On 5.10. it shows "no decrease since 34 days" on the highest level. This is AC-4 read literally. Counting only from the first day after the gap would be the other reading.

**Decisions that would be costly to reverse.** Ticket 05 writes against these:
- **The result.** `assess(counting, today): Assessment` in `src/verdict/assessment.ts`. The type is a union by `status`, and each status carries only the figures it can have:
  - `status` is one of these:
    - `{ kind: "losing" }`
    - `{ kind: "noDecrease", days, atLeast, level: 1 | 2 | 3 }`
    - `{ kind: "gapComparison", gapDays, differenceKg, variation: "clearIncrease" | "clearDecrease" | "withinNormalVariation" }`
    - `{ kind: "lastMeasurementTooOld", days }`
    - `{ kind: "noVerdictYet" }`
  - Beside it come `measuredKg` („Gemessen“), `trendKg` and `pace` (ticket 04's `Pace` with band), all for the last day with a measurement, and `sixWeekSeries`, ticket 04's series up to `today`.
  - `differenceKg` is not rounded, and the comparison with 2 · s / √n uses the unrounded value. Rounding is for the page.
- **Too old keeps the figures.** Under `lastMeasurementTooOld`, trend, pace and series stay as they were on the last day. If the measurements do not suffice for a trend, they stay without a trend.
- **„Noch kein Urteil“ also clears the graph.** Under `noVerdictYet` the series has no trend line, and no point is marked an outlier. AC-23 says „der Graph zeigt nur die Punkte“. After a gap with no trend before it, a trend after the gap can exist, and this removes it as well.
- **No measurement at all** gives `noVerdictYet` with `measuredKg: null`.
- **The spread s.** It is the root mean square of (counting measurement − trend of its day) over the days from 27 days before the last day before the gap up to that day. Days without a trend are left out. It is measured around the trend, not around the mean of the deviations, and the divisor is n, not n − 1. The specimen fixes only the outcome (3.10. clear at about +1.0 kg, 4.10. within at about +0.3 kg), and both readings give it.
- **The gap under comparison** is only the last gap, and only while fewer than 5 counting measurements follow it.
- **"Falling"** means a slope of less than −0.2 kg per week. It allows 1e-9 for floating-point error, as `src/trend/outlier.ts` does, so exactly 0.2 kg in 7 days does not count as falling.
- **Other changes outside `src/verdict/`:**
  - `median` is now exported from `src/trend/trend.ts`, so the gap comparison does not compute the median a second way.
  - `DOMAIN_IMPORTS` holds `verdict: ["trend", "measurement"]`.
- **New names not in `UBIQUITOUS_LANGUAGE.md`.** Nobody could be asked during the run, so the glossary is unchanged. The user should confirm or rename these before ticket 05 spreads them: `Assessment`/`assess`, `AssessmentStatus`, `TrendVerdict`/`trendVerdict`, `GapComparison`/`compareAfterGap`/`gapUnderComparison`, and the values `losing` („Nimmt ab“), `noDecrease`, `atLeast`, `lastMeasurementTooOld` („Letzte Messung vor N Tagen“), `noVerdictYet` („Noch kein Urteil“), `measuredKg` („Gemessen“), and `variation` with its three values. `Level` is the glossary's `level`, written as the numbers 1–3 rather than as names.

**Departure from a nudge.** The nudge names `src/verdict/gap.ts`. The comparison lives in `src/verdict/gap-comparison.ts`, because `src/measurement/gap.ts` already holds the gap itself (ticket 02), and a second `gap.ts` would come up in every search for it.
