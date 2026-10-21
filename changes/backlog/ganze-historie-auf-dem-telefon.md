---
effort: S
utility: M
---

# Ganze Historie auf dem Telefon prüfen

Nach dem Deploy der Langzeitansicht auf dem Telefon mit der echten Historie ab Ende 2015 nachsehen, ob der erste volle Abruf gelingt und die Seite schnell genug bleibt. Bisher ist beides nur mit dem Stand-in und auf dem Desktop geprüft.

- **Erster voller Abruf:** Er reicht bis 1.1.2000 zurück (`HISTORY_START` in `src/measurement/cache.ts`) und holt die Seiten ohne `pageSize` nacheinander (`src/measurement/google-health.ts`), mit 20 s je Seite (`ANSWER_WITHIN_MS`). Scheitert eine Seite, ist der ganze Abruf verloren, und jeder nächste fragt wieder ab 2000 an, bis einer gelingt (`src/measurement/cache.ts`).
- **Geschwindigkeit:** Im Produktions-Build auf dem Desktop dauert ein Klick auf Umschalter oder Pfeile 14–36 ms bei 3.504 Messungen; unter `next dev` etwa 1 s. Auf dem Telefon nicht gemessen. Eine mögliche langsame Stelle ist `berlinDay` (`Intl.formatToParts`, `src/measurement/calendar-day.ts`), das für jede Messung in mehreren Durchgängen je Render läuft.
