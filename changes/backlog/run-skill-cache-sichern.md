---
effort: S
utility: M
---

# Der run-Skill löscht den echten Cache und die Anmeldung

Wer die Seite mit dem run-Skill im eigenen Chrome-Profil auf localhost:3000 durchgeht, verliert seinen Cache und seine Anmeldung: `walkOn` in `walk-on.js` entfernt `gewicht:token:v1` und schreibt die Testdaten nach `gewicht:v1`, wobei es die abgerufenen Messungen überschreibt, und `SKILL.md` lässt beim Aufräumen `gewicht:v1`, `gewicht:eingetragen:v1` und `gewicht:token:v1` aus dem `localStorage` entfernen. Ob dort echte Werte lagen, prüft keiner von beiden. Danach zeigt die Seite den ersten Besuch, und man muss sich anmelden und neu abrufen; bei Google geht nichts verloren, nur noch nicht abgerufene Einträge unter `gewicht:eingetragen:v1` fehlen bis zum nächsten Abruf.

Aufgefallen am 19.10.2026: Der Review der Frühwarnung, die nicht mehr springt, hat so einen Cache mit Daten vom 19.10., 10:52 UTC gelöscht.

Der echte Cache und die Anmeldung sollen das Durchgehen überstehen.
