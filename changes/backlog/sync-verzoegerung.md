---
effort: S
utility: M
---

# Neue Messung kommt erst nach ca. 10 Minuten an

Nach dem Wiegen dauert es ca. 10 Minuten, bis der Wert in Google Health ankommt. Wer gleich danach auf die Seite schaut, sieht noch den alten Stand. Damit muss die Seite besser umgehen können.

Bisher holt die Seite nur auf Klick oder von selbst, wenn sie wieder sichtbar wird, und dann frühestens 5 Minuten nach dem letzten Abruf (`REFETCH_AFTER_MS`, `src/app/useMeasurements.ts`). Bleibt sie offen und sichtbar, holt sie nicht nach. Dass ein Wert noch unterwegs sein kann, sagt sie nicht. Der Abruf selbst ist nicht das Problem, er bricht nach 20 Sekunden ab (`ANSWER_WITHIN_MS`, `src/measurement/google-health.ts`).

Verwandt: `server-mit-webhook.md` nennt dasselbe Warten und löst es mit einem eigenen Server.
