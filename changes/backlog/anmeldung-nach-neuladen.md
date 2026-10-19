---
effort: M
utility: M
---

# Nach dem Neuladen wieder anmelden

Nach jedem Neuladen der Seite muss man sich wieder bei Google anmelden. Das Zugriffstoken liegt nur im Speicher (`useMeasurements`, `src/app/useMeasurements.ts`; `src/measurement/google-health.ts`: „The token it hands out is the caller's to keep, in memory only“). Nach dem Neuladen ist es weg, und „Daten abrufen“ öffnet wieder das Popup.

`server-mit-webhook.md` nennt das „ab und zu bei Google anmelden“ als einen Grund für den Server.
