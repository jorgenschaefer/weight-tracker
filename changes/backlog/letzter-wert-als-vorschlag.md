---
effort: XS
utility: S
---

# Beim Eintragen den letzten Wert vorschlagen

Gewünscht: Beim Eintragen soll der letzte Wert der Vorschlag im Feld sein.

Bisher ist das Feld „Gewicht heute“ beim Öffnen leer (`useState("")` in `EntryForm`, `src/app/EntrySheet.tsx`); als Platzhalter steht fest „98,6“. Die letzte Messung zeigt die Seite unter „Gemessen“ (`src/app/page.tsx`), gibt sie aber nicht an `EntrySheet` weiter.
