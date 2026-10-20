## For you

- **Entscheidung: der Hinweis des ersten Besuchs, während die Seite angemeldet ist** (Review, 1. Runde, Should-fix). „Tippe oben auf die Zeile, um dich bei Google anzumelden.“ steht nach AC-5 in jedem Zustand der Statuszeile, auch während der erste Abruf läuft und nach einem fehlgeschlagenen ersten Abruf mit gültiger Anmeldung. Dort öffnet der Tipp aber das Blatt mit „Abmelden“, statt anzumelden oder erneut abzurufen; das tut nur ⟳. Die Kriterien legen das so fest, also nicht geändert. Zu entscheiden: ob AC-5 den Hinweis nur ohne Anmeldung zeigen oder anders formulieren soll.
- **Zu bestätigen: `signIn` für zwei Dinge** (01 und 03, Nit; Review, 2. Runde, Nit). `signIn` ist die Funktion in `google-health.ts`, die das Popup öffnet, und das Feld von `Measurements` mit Ablaufzeitpunkt und Schreibrecht; beide treffen sich in `useMeasurements.ts`. Das Glossar nennt jetzt beide unter „Anmeldung“, ändert aber nichts an dem doppelten Namen. Ein anderer Name für das Feld (und ein eigener Typ für `Omit<HeldToken, "token">`, der zweimal steht) wäre eine Namensentscheidung.
- **Zu bestätigen: die übrigen neuen Namen** (01 und 03). „Statuszeile“, „Blatt“ und „Anmeldung“ stehen jetzt im Glossar (Should-fix aus 01). Ohne Eintrag bleiben `StatusMark` (`signedIn`, `signedOut`, `failed`), `GoogleState`, `signingIn`, `savingKg`, `fetchFailure`, `revokeFailure`, `signedInUntil`, `lastFetch`, `signInWithPopup`, `unexpired` und die Testhelfer.
- **Nicht gegen das echte Google, einen echten Screenreader und ein schlafendes Gerät geprüft** (01 und 03). AC-11 (höfliche Ansage), AC-13 und das Ablaufen nach dem Aufwachen nur in Tests und mit der Google-Attrappe. AC-12 und das Aussehen (AC-1, AC-4) nur von den Reviews in Chromium gemessen, nicht in Tests.
- **`GoogleState` wiederholt Felder von `Measurements`** (01, Nit; Review, 1. und 2. Runde, Nit). `signingIn`, `savingKg`, `fetching` und `fetchFailure` stehen in beiden Typen mit kopierten Kommentaren, die schon auseinanderlaufen; `GoogleStatus.tsx` überträgt sie Feld für Feld. Ein `Pick<Measurements, …>` würde das beheben.
- **Die Statuszeile vor dem Lesen des Speichers ist eigenes Markup** (Review, 1. Runde, Nit). Der Zweig `measurements === null` in `GoogleStatus.tsx` wiederholt Knopf, Zeichen, Pfeil und ⟳ mit ihren Klassen.
- **⟳ heißt vor dem Lesen des Speichers „Abrufen“** (01, Nit). Bleibt, der Zustand dauert einen Augenblick.
- **Das Abzeichen von `next dev` liegt bei 360 px über „Abmelden“** (03, Nit). Nur im Entwicklungsmodus, im run-Skill vermerkt.

## Abweichungen der Builds von Nudges

Keine Korrektur dieses Reviews weicht von einem Nudge oder einer technischen Entscheidung ab. Die Builds haben ihre eigenen Abweichungen in den Tickets genannt; beide Reviews haben sie gesehen und nichts daran beanstandet: `statusLine` bekommt den Tag, nach dem die Seite urteilt, statt „jetzt“ (01); die Seite lässt ein abgelaufenes Token zusätzlich fallen, wenn sie wieder sichtbar wird (03); beide Blätter nutzen die neue Komponente `Sheet`, statt die Einstellungen des `Drawer` zu kopieren (03).

## Was die Builds nach ihrem letzten Review behoben haben

Gegen den jeweiligen Befund geprüft, beide in Ordnung:
- 01: `busy` berechnet jetzt `statusLine`, `GoogleStatus.tsx` nutzt es für ⟳ und den Tipp auf die Zeile; `google-status.test.ts` hält es fest.
- 03: je ein Test in `EntrySheet.test.tsx` und `GoogleStatus.test.tsx` prüft die Klassen von `Sheet.module.css` an beiden Blättern.

## Korrekturen dieses Reviews

Nach der 1. Runde, von der 2. Runde gesehen:
- `f7ee9f0`: ein Test hält fest, dass „Abmelden“ mit abgelaufenem Token „Widerruf fehlgeschlagen: …“ sagt, wenn die neue Anmeldung zum Widerrufen scheitert. Der Test dazu war mit dem Link „Abmelden“ weggefallen; gegengeprüft, er schlägt fehl, wenn `revoke` den Fehler der Anmeldung verschluckt. Dazu ein ungenutzter Import weg.
- `cec7b68`: „Anmeldung“, „Statuszeile“ und „Blatt“ im Glossar (Should-fix aus 01).

Nach der 2. Runde, von keinem Reviewer gesehen:
- `500b073`: ein Test hält wieder fest, dass die Seite die Anmeldung eines Abrufs nicht behält, den „Abmelden“ überholt hat (⟳ auf abgelaufenem Token, Popup offen, „Abmelden“ im Blatt, dann antwortet das Popup). Der Test war mit dem Link „Abmelden“ weggefallen; gegengeprüft, er schlägt ohne `if (!isCurrent()) return;` nach der Anmeldung in `fetchData` fehl.
- `138bd4a`: die Tests des ersten Besuchs (Satz und Hinweis in jedem Zustand, kein „Daten abrufen“) und zum Rest der Seite während eines Abrufs (AC-8) sind von `GoogleStatus.test.tsx` nach `page.test.tsx` umgezogen, weil sie prüfen, was `page.tsx` zeigt. `holdSignIn` und der Hinweis stehen jetzt in `src/test/open-page.tsx`.
- `ff5a2ef`: das Glossar sagt, dass „Abmelden“ auch die eingetragenen Messungen und das Token fallen lässt, und was `GoogleStatus` und was `statusLine` ist (Nits der 2. Runde).

## Nicht behobene Befunde des Reviews

- Der Hinweis des ersten Besuchs bei bestehender Anmeldung, die Namen, `GoogleState` und das Markup vor dem Lesen: siehe oben.
- Die Prüfung `logOuts.current === started` in `revoke` hält kein Test fest; das war schon vor dieser Änderung so, und die Änderung lässt sie unberührt.

## Checks

- `npm run check` nach jeder Korrektur grün, zuletzt auf `ff5a2ef` (919 Tests).
- Die 1. Runde hat die Seite mit `google-stand-in.js` in Chromium bei 360 × 640 und 1440 × 900 durch alle Zustände der Statuszeile, ⟳, das Blatt und „Eintragen“ gefahren. Die Korrekturen danach ändern nur Tests und das Glossar, keinen Bildschirm; die 2. Runde hat deshalb keine Seite gefahren.
