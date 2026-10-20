---
effort: L
utility: M
---

# Eintragen ohne Anmeldung

Ein Gewicht soll sich eintragen lassen, ohne dass die Seite bei Google angemeldet ist, oder ganz ohne Google-Konto.

Heute meldet „Eintragen“ bei Google an, wo die Seite keine gültige Anmeldung mit Schreibrecht hält (`maySave` in `enter`, `src/app/useMeasurements.ts`), und schreibt nur nach Google Health. Die Anmeldung gilt etwa eine Stunde, deshalb öffnet das Eintragen am Morgen fast immer das Anmelde-Popup. Eingetragene Werte liegen bis zum Abruf unter `gewicht:eingetragen:v1` in diesem Browser und verschwinden, wenn ein Abruf sie eine Stunde nach dem Eintragen nicht enthält (`src/measurement/entered-measurement.ts`).

Falls das kommt, ist „Synchronisieren“ das Wort für den Abgleich mit Google; bis dahin heißt es „Abrufen“ (`changes/2026-10-20-anmeldung-und-abruf/`).
