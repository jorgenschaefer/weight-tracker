---
effort: L
value: S
---

# Gewichtsziel

Als Benutzer möchte ich ein Ziel für mein Gewicht eintragen, damit sich die Anwendung an Abnahme, Zunahme oder Halten anpasst und ich sehe, wann ich das Ziel ungefähr erreiche.

Heute nimmt die Anwendung an, dass man abnehmen will. Die Ampel ist grün, wenn das Tempo mit über 80 % Wahrscheinlichkeit unter −0,1 kg pro Woche liegt (`LOSS_THRESHOLD_KG_PER_WEEK` in `src/verdict/traffic-light.ts`). Die Sicherheit (`lossCertainty`) und das Urteil („N % sicher, dass du abnimmst“) hängen an derselben Schwelle. Alle Sätze zum Morgen in `src/verdict/morning-sentence.ts` sind aus Sicht des Abnehmens geschrieben, etwa „Achtung, du nimmst wieder zu.“ oder „Ob du abnimmst, ist noch offen.“

Google Health hat kein Feld für ein Gewichtsziel: weder einen Datentyp noch ein Feld in `users.getProfile` oder `users.getSettings`. Die Anwendung müsste das Ziel selbst speichern.
