---
effort: S
utility: M
---

# Auf Android installierbar, mit Favicon

Die Seite lässt sich auf Android nicht als App installieren, und sie hat kein Favicon.

Bisher fehlt beides ganz: Es gibt kein Web-App-Manifest (kein `src/app/manifest.ts`, kein `public/`), keine Icons (kein `favicon.ico`, `icon.*` oder `apple-icon.*` in `src/app/`) und keinen Service Worker. `metadata` in `src/app/layout.tsx` setzt nur `title`, `description` und `robots`.
