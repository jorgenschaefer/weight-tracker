---
criteria:  CRITERIA.md
closes:    AC-6, AC-7, AC-8
advances:  
after:     01-stand-eines-frueheren-tags
status:    done
attempts:  1
---

## Build
Ein gewählter früherer Tag endet, wenn die Seite wieder sichtbar wird, ein Eintragen gelingt oder ein Abruf fehlschlägt oder ihm die zählende Messung nimmt; ein Abruf mit neuen Messungen rechnet ihn neu. Während der Wahl trägt + für heute ein, mit dem Blatt von heute.

## Done when
> **AC-6** Wird die Seite wieder sichtbar, zeigt sie heute, ebenso nach dem Neuladen oder erneuten Öffnen.

> **AC-7** Während ein früherer Tag gewählt ist, bleibt + erreichbar und trägt für heute ein; das Blatt sieht aus und schlägt vor wie ohne Wahl, mit den Farben und der Letzten Messung von heute. Sobald ein Eintragen gelingt, zeigt die Seite heute. Wird das Blatt ohne Eintragen geschlossen, bleibt der Tag gewählt.

> **AC-8** Bringt ein Abruf neue Messungen, während ein früherer Tag gewählt ist, bleibt der Tag gewählt und wird neu berechnet. Hat er danach keine zählende Messung mehr, zeigt die Seite heute. Schlägt ein Abruf fehl, während ein früherer Tag gewählt ist, zeigt die Seite heute, und die Statuszeile sagt „Abruf fehlgeschlagen: …“ wie bisher.

## Technical decisions
> **Stored formats** keine. Der gewählte Tag lebt nur im Speicher der Seite.

> **Wire formats** keine.

> **Trust boundaries** keine.

> **Dependencies** keine.

## Nudges
> Die Regel „die Seite eines früheren Tags kennt nur die Messungen bis einschließlich jenes Tags“ steht an einem Ort: in einer reinen Funktion neben `assess` in `src/verdict/assessment.ts`, die nach der Regel heißt. Aus ihrem Ergebnis kommen sowohl die Einschätzung (aus den zählenden Messungen) als auch „Letzte Messung“ (die neueste, zählend oder nicht).

> Der gewählte Tag lebt in `src/app/page.tsx`. `WeightGraph` bekommt ihn und meldet Tipps über einen Callback, zeichnet aber weiter die `sixWeekSeries` von heute.

## Context
01 baut die Wahl eines früheren Tags: den gewählten Tag (`shownDay`) in `src/app/page.tsx`, die Funktion mit der Regel in `src/verdict/assessment.ts`, aus der die Seite jenes Tags kommt, das Band an der Stelle von `GoogleStatus` und die Markierung im Graphen. Wie im Muster ist dort der letzte Tag mit einer Messung kein früherer Tag; ein gewählter Tag, der nach einem Abruf der letzte mit einer Messung ist, zeigt ebenso heute.

`useToday` in `page.tsx` liest den Tag neu, wenn die Seite wieder sichtbar wird. `EntrySheet` (`src/app/EntrySheet.tsx`) nimmt heute dieselben `colours` für + und das Blatt und schlägt `latestKg` vor; + selbst bleibt wie im Muster `specimens/muster.html` in den Farben des gezeigten Tags. Ein fehlgeschlagener Abruf steht in `Measurements.fetchFailure` (`src/app/useMeasurements.ts`), bis der nächste Abruf oder die nächste Anmeldung beginnt; AC-8 meint das Fehlschlagen selbst, ein früherer Fehler hindert keine neue Wahl.

`CRITERIA.md` sagt zum Muster: „Wo Muster und Kriterien auseinandergehen, gelten die Kriterien: Das Muster bleibt beim Zurückkehren in den Tab auf dem gewählten Tag, die Seite zeigt dann heute (AC-6).“

## Not here
- Wie ein Tag gewählt, gezeigt und markiert wird, und die Wege zurück über Band, Graph und Escape: 01.
- Die Differenz zwischen der heutigen Messung und der des gewählten Tags.
- Weitere Messungen eines Tags außer der zählenden und der letzten.

## Left standing

**Review-Befunde, nicht behoben**
- Nit (1. und 2. Runde): Die Regel „der letzte Tag mit einer Messung ist kein früherer Tag“ steht zweimal: in `useDayChoice` (`src/app/WeightGraph.tsx`, `day === lastDay ? null : day`, über die `sixWeekSeries`) und neu in `isEarlierDay` (`src/verdict/assessment.ts`, über die zählenden Messungen), das `page.tsx` bei jedem Rendern anwendet. Heute stimmen beide überein, weil jeder Punkt im Graphen eine zählende Messung ist. Den Graphen auf `isEarlierDay` umzustellen ändert Code, den 01 gebaut hat und dieses Ticket nicht braucht.
- Nit (2. Runde): Die Wahl endet an drei Stellen in `src/app/page.tsx`: in `useChosenDay` (Seite wieder sichtbar, neuer Fehler eines Abrufs), im Rendern von `Page` (Tag ist nach einem Abruf kein früherer Tag mehr) und in `enter` (Eintragen gelungen). `Page` hat damit etwa 45 Zeilen Logik. Die Prüfung mit `isEarlierDay` braucht die zählenden Messungen, die es erst nach den frühen Returns gibt; sie in den Hook zu ziehen hätte ihn umständlicher gemacht.

**Nach der letzten Review behoben, von keinem Reviewer gesehen**
- Keine. Der Test zum Should-fix der 1. Runde (ein späterer Abruf bringt einen beendeten Tag nicht zurück) und das Umbenennen aus dem Nit der 1. Runde (`useShownDay`/`setShownDay` → `useChosenDay`/`setChosenDay`, weil der Zustand der gewählte und nicht der gezeigte Tag ist) hat die 2. Runde gesehen.

**Nicht ausgeführte Prüfungen**
- Nach der 2. Runde hat niemand die Seite im Browser bedient; die Fixes danach ändern nichts, was die Seite zeigt. Kein echtes Handy.

**Kriterien, die kein automatischer Test ganz beweist**
- AC-6 (Seite wird wieder sichtbar): Getestet ist ein `visibilitychange` mit `visibilityState` „visible“ in jsdom. Der Reviewer der 1. Runde hat dasselbe Ereignis in headless Chromium ausgelöst; ein echter Wechsel von Tab oder App ist nicht geprüft, weil headless Chromium immer sichtbar bleibt.
- AC-7 (Farben des Blatts): Getestet sind die CSS-Variablen von +, Feld und „Eintragen“. Gesehen hat sie der Reviewer der 1. Runde auf 360 px und 1280 px: + gelb wie der 18.10., das Blatt grün wie heute, Vorschlag 96,9.

**Abweichungen von den Nudges**
- Nudge „Der gewählte Tag lebt in `src/app/page.tsx`“: so gebaut, aber als zwei Werte. `chosenDay` (Zustand aus `useChosenDay`) ist, was im Graphen gewählt wurde; `shownDay` ist der Tag, dessen Seite gezeigt wird, nämlich `chosenDay`, solange er nach `isEarlierDay` ein früherer Tag ist. Ist er es nach einem Abruf nicht mehr, wird `chosenDay` beim Rendern auf `null` gesetzt, damit ein späterer Abruf ihn nicht zurückbringt. `WeightGraph` bekommt weiter `shownDay`.
- `EntrySheet` bekommt neben `colours` (für +, die Farben des gezeigten Tags) neu `todayColours` (für das Blatt), und `Surface` bekommt `todayColours` und `onEnter`, damit `Page` das Eintragen umschließen und danach heute zeigen kann.

**Namen, die nicht aus dem Glossar kommen**
- `isEarlierDay` (ob die Seite eines Tags die eines früheren Tags ist: ein Tag mit einer zählenden Messung, aber nicht der letzte), `useChosenDay`/`chosenDay`/`setChosenDay` (der im Graphen gewählte Tag, vor der Prüfung) und `todayColours` (die Farben der Seite von heute, für das Blatt).
