---
effort: M
utility: L
---

# Gewicht hier eingeben statt in Google Fit

Eingetragen wird bisher in der Google-App; die Seite liest die Werte nur aus der Google Health API (`changes/2026-10-17-weight-trend/`, AC-19: die Seite schreibt nie etwas in Google Health). Danach dauert es ca. 10 Minuten, bis der Wert in Google Health ankommt. Wer gleich nach dem Wiegen auf die Seite schaut, sieht noch den alten Stand.

Die Seite holt nur auf Klick oder von selbst, wenn sie wieder sichtbar wird, und dann frühestens 5 Minuten nach dem letzten Abruf (`REFETCH_AFTER_MS`, `src/app/useMeasurements.ts`). Bleibt sie offen und sichtbar, holt sie nicht nach. Dass ein Wert noch unterwegs sein kann, sagt sie nicht.

Gewünscht: Die App erlaubt die Gewichtseingabe und überträgt den Wert an die Google Health API, statt nur von dort zu lesen. Damit fällt der Wechsel zwischen zwei Apps weg, und der neue Wert ist sofort auf der Seite.
