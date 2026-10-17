---
effort: L
utility: M
---

# Server statt statischer Seite

Die erste Version holt die Werte im Browser von der Google Health API (`changes/2026-10-17-weight-trend/`). Dadurch muss man nach dem Eintragen warten, bis die Seite aktualisiert hat, und sich ab und zu bei Google anmelden.

Gedacht ist ein eigener Server auf der Infrastruktur von `~/Projects/ausgaben` (Docker hinter Caddy auf jorgenschaefer.de, Postgres vorhanden): Er bekommt neue Werte per Webhook der Health API (`weight` unterstützt Benachrichtigungen laut Release Notes), hält das Refresh-Token, speichert die Werte in Postgres und hat eine eigene Anmeldung wie `ausgaben`. Beim Öffnen sind die Daten dann fast immer schon frisch, Handy und Rechner teilen sich dieselben Daten. Perspektivisch könnte der Server auch Mails verschicken.
