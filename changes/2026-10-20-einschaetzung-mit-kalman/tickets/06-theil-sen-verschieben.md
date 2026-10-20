---
criteria:  CRITERIA.md
closes:
advances:
after:
status:    ready
attempts:  0
---

## Build
Theil-Sen moves unchanged from `src/trend/trend.ts` to `src/trend/theil-sen.ts`, so that 01 can put the Kalman filter in `trend.ts` under the names `Trend` and `trends`.

## Done when
`src/trend/theil-sen.ts` holds what `src/trend/trend.ts` holds now: `Trend`, `trends` and `median`. Its test moves with it to `theil-sen.test.ts`, every importer imports from there, and `trend.ts` with its test is gone. The page does not change, and `npm run check` is green.

## Technical decisions
> **Stored formats** Keine. Der Cache `gewicht:v1` bleibt unverändert; alles wird aus den Messungen berechnet.

> **Wire formats** Keine.

> **Trust boundaries** Keine.

> **Dependencies** Keine. Der Filter ist von Hand geschrieben, wie in `kalman.py`.

## Nudges

## Context
What exists: `trends(counting)` in `src/trend/trend.ts` is Theil-Sen over a fortnight and gives each day a `Trend` of `day` and `kg`, and `median` is exported for `src/verdict/gap-comparison.ts`. The importers are `scatter.ts`, `pace.ts`, `outlier.ts`, `week-pace.ts`, `six-week-series.ts`, `src/verdict/verdict.ts`, `gap-comparison.ts` and `assessment.ts`, some of their tests, and `src/app/WeightGraph.tsx`.

The move is temporary. 01 writes the filter in a new `trend.ts`. Tickets 02 to 05 replace the importers piece by piece, each along with the part of the page it builds, and 05 deletes `theil-sen.ts`.

## Not here
- The Kalman filter: 01.
- Changing anything Theil-Sen computes, or any importer beyond its import line.

## Left standing
