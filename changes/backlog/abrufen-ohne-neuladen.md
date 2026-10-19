---
effort: S
utility: M
---

# Neu abrufen nur über Neuladen

Um neue Daten abzurufen, muss man die Seite neu laden. Sobald die Seite in diesem Besuch angemeldet ist, verschwindet „Daten abrufen“ (`FetchButton`, `src/app/page.tsx`: `if (measurements.fetching || measurements.signedIn) return null`). Von selbst ruft sie nur ab, wenn sie wieder sichtbar wird, und frühestens 5 Minuten nach dem letzten Abruf (`REFETCH_AFTER_MS`, `src/app/useMeasurements.ts`). Bleibt sie offen und sichtbar, gibt es keinen Weg zum Abruf, und nach dem Neuladen muss man sich wieder anmelden (`anmeldung-nach-neuladen.md`).
