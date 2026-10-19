---
effort: S
utility: M
---

# Warnstufe fällt, wenn „Stagniert“ zu „Nimmt zu“ wird

Wird die Nachricht schlechter, wird die Farbe ruhiger. Nach 17 Tagen „Stagniert“ steht am 29.8. der Testdaten Warnstufe 3 (dunkles Rostrot); am 30.8. heißt es „Nimmt zu“, „Der Trend steigt seit einem Tag.“, und die Fläche hat die hellste Farbe, Warnstufe 1.

Die Warnstufe zählt die Tage, an denen die Frühwarnung dasselbe sagt (`trendVerdict` und `level` in `src/verdict/verdict.ts`, AC-4 und AC-5 von `changes/2026-10-19-fruehwarnung-mit-einer-stimme/`); beim Wechsel von „Stagniert“ zu „Nimmt zu“ fängt N wieder bei 1 an. Vor dieser Änderung trug „Nimmt zu“ die Farbe der Tage ohne Abnehmen.
