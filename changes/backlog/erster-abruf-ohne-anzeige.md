---
effort: M
utility: S
---

# Der erste volle Abruf zeigt nicht, was er tut

Der erste volle Abruf dauert recht lange, und ohne Anzeige, was er tut, ist das störend. Vielleicht kann er auch im Hintergrund laufen.

Beobachtet am 21.10.2026 im dev server nach „Abmelden“ und „Anmelden und abrufen“, mit 740 Messungen ab 20.3.2023 auf einer Seite. Während des Abrufs sagt die Statuszeile nur „ruft ab …“ (`src/app/google-status.ts:67`), wie bei jedem Abruf. Ohne Cache - nach „Abmelden“ und im ersten Abruf eines Browsers - hat die Seite bis dahin nichts zu zeigen. Der volle Abruf fragt ab 1.1.2000 an (`HISTORY_START`, `src/measurement/cache.ts`).
