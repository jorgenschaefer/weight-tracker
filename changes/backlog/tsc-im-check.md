---
effort: XS
utility: S
---

# tsc im Check meldet fälschlich grün

`npm run check` beginnt mit `tsc --noEmit`, und `tsconfig.json` hat `"incremental": true`. Bei der Abnahme der Gewichtstrend-Änderung (17.10.2026) lief `npx tsc --noEmit` mit dem veralteten `tsconfig.tsbuildinfo` ohne Fehler durch, nachdem sich der Rückgabetyp von `signIn` in `src/measurement/google-health.ts` geändert hatte. `npx tsc --noEmit --incremental false` meldete dagegen vier Fehler, in `src/app/useMeasurements.ts` und `src/test/open-page.tsx`.

Durchgerutscht ist bisher nichts, weil `next build` am Ende des Checks noch einmal Typen prüft. Der erste Schritt des Checks meldet aber fälschlich grün und ist damit nicht mehr der schnelle Abbruch, der er sein soll.

Bei der Abnahme besprochen: `--incremental false` im Skript `check`, oder `incremental` aus `tsconfig.json` streichen.
