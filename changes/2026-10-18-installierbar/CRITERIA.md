# Criteria: Auf Android installierbar, mit Favicon

## Problem

Auf dem Handy kommst du nur über den Browser auf die Seite: Browser öffnen, Lesezeichen oder Adresse. Mit einem Tipp vom Startbildschirm wie bei einer App geht es nicht. In Browser-Tabs und Lesezeichen erkennt man sie nicht, weil sie kein eigenes Symbol hat. Stattdessen soll sie sich vom Android-Startbildschirm aus wie eine App öffnen lassen und überall, wo der Browser Seiten mit Symbol zeigt, auf einen Blick erkennbar sein.

Einen einzelnen Vorfall gibt es nicht; es ist bei jedem Öffnen so. Den Stand beschreibt `changes/backlog/installierbar.md`: kein Web-App-Manifest, keine Icons, kein Service Worker, `metadata` in `src/app/layout.tsx` setzt nur `title`, `description` und `robots`.

## Acceptance criteria

- **AC-1** In Chrome auf Android bietet der Browser für https://gewicht.jorgenschaefer.de „App installieren“ an, nicht nur eine Verknüpfung auf dem Startbildschirm. Nach der Installation steht „Gewicht“ mit dem Waage-Symbol auf dem Startbildschirm und in der App-Liste.
- **AC-2** Ein Tipp auf das Symbol öffnet die Seite in einem eigenen Fenster, ohne Adressleiste und ohne Bedienelemente des Browsers.
- **AC-3** Auf dem Startbildschirm füllt das Symbol die Form, die der Launcher vorgibt (Kreis, Squircle oder abgerundetes Quadrat), ganz aus, ohne weißen Rand, und die Waage ist nicht angeschnitten.
- **AC-4** Bis die Seite geladen ist, zeigt Android einen Startbildschirm in Grau `#DDE1E5` mit dem Symbol und „Gewicht“.
- **AC-5** Im Browser-Tab, in Lesezeichen und im Verlauf zeigt die Seite das Waage-Favicon, in Chrome auf Android und in Chrome und Firefox am Rechner. Es ist auf hellen wie dunklen Leisten des Browsers gut zu erkennen.
- **AC-6** Die Statusleiste der App und die Adressleiste von Chrome auf Android haben in jedem Zustand die Farbe der Fläche: beim ersten Besuch, ohne Urteil, bei „Nimmt ab“, in jeder Stufe und beim Vergleich nach einer Lücke. Ändert sich die Fläche, etwa nach einem Abruf, wechselt die Farbe ohne Neuladen mit.
- **AC-7** Anmeldung und Abruf funktionieren im App-Fenster wie im Browser. Nach der Anmeldung bei Google ist man wieder im App-Fenster, und die Messungen erscheinen.
- **AC-8** Messungen, die vorher in Chrome abgerufen wurden, zeigt die App schon beim ersten Öffnen, ohne neuen Abruf.
- **AC-9** Nach einem Deploy zeigt die installierte App den neuen Inhalt, sobald sie neu startet, ohne Neuinstallation. Aus dem Hintergrund zurückgeholt darf sie noch den alten zeigen; ein geändertes Symbol oder Manifest übernimmt Chrome später von selbst.
- **AC-10** Die Seite zeigt nichts zum Installieren an. Inhalt und Aufteilung bleiben gleich, auf 360 × 640 px wie auf breiten Bildschirmen. Die Seite bleibt für Suchmaschinen gesperrt.

## Agreed design

Ein Web-App-Manifest mit Symbolen, ohne Service Worker; Chrome bietet die Installation selbst an. Das Symbol ist eine Personenwaage mit Zeiger in den neutralen Farben der Seite (`#20262C` auf `#DDE1E5`), fürs Favicon vereinfacht ohne Zeiger, auf einer grauen Kachel `#DDE1E5`, damit es auch auf dunklen Leisten zu sehen ist. Die Statusleiste nimmt die Farbe der Fläche an.

- Artifact: https://claude.ai/artifact/BLNmEC9XWpnZ7fRgrL2LHX
- Kopie: [`specimens/Main.dc.html`](specimens/Main.dc.html)

**Agreed; build to this, do not redesign.**

## Technical decisions

- **Stored formats** Keine. Der Cache in `localStorage` bleibt, wie er ist.
- **Wire formats** Neue öffentliche Pfade: `/manifest.webmanifest`, das Favicon und die Symbole des Manifests. Android erkennt die installierte App an `id` und `start_url` im Manifest, beide `/`; sie ändern sich danach nicht mehr, sonst wird aus der installierten App eine fremde. Ältere Aufrufer gibt es nicht.
- **Trust boundaries** Keine. Keine neue Eingabe, kein neuer Aufruf nach außen; das Manifest enthält nichts Geheimes.
- **Dependencies** Keine. Die Symbole werden als SVG gezeichnet und einmal lokal mit ImageMagick oder Inkscape in PNG und ICO umgewandelt; die Ergebnisse liegen im Repository, kein Werkzeug kommt in `package.json`.

## Nudges

- Das Manifest steht in `src/app/manifest.ts`: `name` und `short_name` „Gewicht“, `description` wie in `metadata` in `src/app/layout.tsx`, `lang` `de`, `display` `standalone`, `background_color` und `theme_color` aus `NEUTRAL.surface` in `src/app/Verdict.tsx`, nicht als zweite Kopie des Farbwerts. Lässt sich `Verdict.tsx` in der Metadaten-Route nicht importieren, zieht `NEUTRAL` in ein eigenes Modul in `src/app/` um.
- Die Quelle der Waage ist ein SVG im Repository; als `src/app/icon.svg` dient es auch als Favicon, dazu ein `src/app/favicon.ico`. Die Symbole des Manifests sind PNGs in 192 und 512 px, eins davon `maskable` mit grauem Hintergrund bis an den Rand und der Waage innerhalb der Sicherheitszone.
- Die Befehle, die aus dem SVG die PNGs und das ICO machen, stehen in einem Skript unter `bin/`, damit ein geändertes Symbol ohne Raten neu erzeugt wird; `npm run check` ruft es nicht auf.
- Was nur ein echtes Android-Gerät zeigt (AC-1 bis AC-4, AC-6 Statusleiste, AC-7 bis AC-9), wird nach `bin/deploy-prod` an https://gewicht.jorgenschaefer.de abgenommen; Inhalt des Manifests, Favicon-Links und das `theme-color` je Zustand prüfen Tests.
- Die PNGs des Manifests brauchen feste Adressen und liegen deshalb in `public/`; das `Dockerfile` kopiert bisher nur `.next` ins Image und muss `public/` mitnehmen.
- Das `<meta name="theme-color">` rendert `Surface` in `src/app/page.tsx` aus `colours.surface`, nicht der statische `viewport`-Export von Next.
- Kein Service Worker und kein Code für `beforeinstallprompt`.

## Out of scope

- Öffnen ohne Netz.
- iPhone und `apple-icon`.
- Push-Benachrichtigungen.
- Ein Knopf oder Hinweis zum Installieren auf der Seite.

## Ruled out

- **Leerer Service Worker** - Chrome braucht ihn zum Installieren nicht mehr; er brächte nur etwas für alte Browser und kostet Registrierung und Aktualisierung bei jedem Deploy.
- **Service Worker für offline** - löst ein anderes Problem als das vereinbarte und riskiert einen veralteten Stand nach einem Deploy.
- **Nur Icons ohne Manifest** - ergibt nur eine Verknüpfung, die im Browser-Tab mit Adressleiste aufgeht.
- **Die Motive Trendlinie, Buchstabe G und kg** - die Waage ist gewählt.
- **Knopf „Installieren“ oder Hinweissatz auf der Seite** - man installiert einmal, und Chrome bietet es selbst an.
- **Neu laden beim Zurückholen nach einem Deploy** - braucht eine Build-Kennung, die die Seite abfragt, und lädt mitten in der Nutzung neu; wer deployt, weiß selbst, wann ein neuer Stand da ist.
- **Favicon ohne Kachel, mit heller Waage bei dunklem Design** - die Media Query in `icon.svg` beachtet Chrome bei Favicons nicht zuverlässig, `favicon.ico` gar nicht.
- **Feste graue Statusleiste** - das Farbfeld soll bis an den oberen Rand reichen.

## Left standing

- **Checked only on a real Android device after `bin/deploy-prod`, not yet done:** AC-1 to AC-4, the status bar in AC-6, AC-7 to AC-9. No automated test proves them. The review saw the manifest, its three icons and the favicon links served correctly, and the PNGs match the specimen, the maskable one with the scale inside the safe zone.
- **AC-5 favicon in the tab, bookmarks and history** was not seen in a browser's tab strip; the links in `<head>` and the files are checked by tests and in the built page.
- **AC-10** was checked by the review in Chrome at 360 × 640 and 1440 × 900: nothing about installing, layout unchanged, still `noindex`.
- **Three PNGs, not two:** besides the maskable 512 px icon there are a 192 and a 512 px icon with the scale on a grey circle and transparent corners, for where Android does not mask (install dialog, app switcher); all three come from the one source `src/app/app-icon.svg`.
- **`description` is a second literal** in `src/app/manifest.ts`; `manifest.test.ts` fails if it drifts from `metadata.description`. Importing `layout.tsx` would pull the font and Mantine's CSS into the manifest route.
- **Costly to reverse:** `id` and `start_url` `/` in the manifest, as agreed.
