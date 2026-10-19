---
effort: S
utility: M
---

# Der run-Skill löscht den echten Cache

Wer die Seite mit dem run-Skill im eigenen Chrome-Profil auf localhost:3000 durchgeht, verliert seinen Cache: `walk-on.js` schreibt die Testdaten nach `gewicht:v1` und überschreibt dabei die abgerufenen Messungen, und `SKILL.md` lässt beim Aufräumen `gewicht:v1` und `gewicht:eingetragen:v1` aus dem `localStorage` entfernen. Ob dort ein echter Cache lag, prüft keiner von beiden. Danach zeigt die Seite den ersten Besuch, und man muss sich anmelden und neu abrufen; bei Google geht nichts verloren.

Aufgefallen am 19.10.2026: Der Review der Frühwarnung, die nicht mehr springt, hat so einen Cache mit Daten vom 19.10., 10:52 UTC gelöscht.

Der echte Cache soll das Durchgehen überstehen.
