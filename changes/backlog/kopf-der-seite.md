---
effort: S
utility: S
---

# Der Kopf der Seite: Statuszeile, ⟳ und Abstände

Bei der Abnahme von „Die Seite eines früheren Tags zeigen“ am 20.10.2026 aufgefallen:

- **Die Statuszeile kann auch auf dem Desktop die volle Breite haben.** Ab 65em ist sie 420 px breit und rechts ausgerichtet, so breit wie die Spalte der vier Zahlen (`src/app/GoogleStatus.module.css`, letzter Block). Das Band „Stand <Tag>“ übernimmt diese Breite (`src/app/ShownDayBand.module.css`, letzter Block) und muss mit.
- **⟳ braucht die gleiche Höhe wie die Statuszeile.** ⟳ ist fest 48 × 48 px (`.refresh` in `GoogleStatus.module.css`); die Statuszeile ist mit ihren zwei Zeilen Text etwa 53 px hoch. Das Band ist genau so hoch wie die Statuszeile gebaut (`calc` in `ShownDayBand.module.css`), gemessen 52,85 px.
- **Auf dem Desktop können Abstand und waagrechte Linie über den vier Zahlen entfallen.** `.figures` in `src/app/Verdict.module.css` hat `border-top` und `padding-top: 12px`, auch ab 65em.
- **Zwischen „Letzte Messung“ und „X % sicher, dass du abnimmst“ muss kein Abstand sein.** Auf dem Handy kommt er von `.line { margin: 28px 0 0 }` in `Verdict.module.css` (12 px bis 640 px Höhe). Auf dem Desktop setzt `.summary` in `src/app/page.module.css` `margin-top: 32px`, und weil die Spalten unten bündig stehen (`align-items: end`) und die der vier Zahlen höher ist, wird er dort etwa 70 px groß.

Tests in `src/app/page.test.tsx` lesen die Stylesheets der Statuszeile und des Bands und prüfen, dass beide gleich hoch sind.
