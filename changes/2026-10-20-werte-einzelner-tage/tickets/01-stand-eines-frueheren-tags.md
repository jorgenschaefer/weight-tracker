---
criteria:  CRITERIA.md
closes:    AC-1, AC-2, AC-3, AC-4, AC-5, AC-9, AC-10, AC-11
advances:  
after:     
status:    done
attempts:  1
---

## Build
Ein Tipp, ein Ziehen oder ← und → im Graphen wählen einen früheren Tag mit einer Messung. Über dem Graphen zeigt die Seite dann, wie sie an jenem Tag war, und an der Stelle von Statuszeile und ⟳ steht ein Band „Stand <Tag>“ mit „Zurück zu heute“. Der Graph markiert den gewählten Tag.

## Done when
> **AC-1** Ein Tipp in den Graphen wählt den Tag mit einer zählenden Messung, dessen Punkt waagrecht am nächsten liegt, auch in einer Lücke. Zieht man den Finger oder die gedrückte Maus darüber, wählt die Seite fortlaufend den jeweils nächsten. Senkrechtes Wischen über den Graphen scrollt die Seite weiter.

> **AC-2** Ist ein früherer Tag gewählt, zeigt alles über dem Graphen die Seite, wie sie an jenem Tag war, aus den Messungen bis einschließlich jenes Tags. Das gilt für die Farbe der Fläche und der Browserleiste, die Zeile zur Sicherheit, den Satz zum Morgen, die vier Zahlen und „Letzte Messung“. „Gemessen“ ist die zählende Messung jenes Tags, am 18.10. der Testdaten also 98,4 kg; „Letzte Messung“ nennt die neueste Messung bis einschließlich jenes Tags, zählend oder nicht.

> **AC-3** Statt Statuszeile und ⟳ steht dann ein Band in der Textfarbe der Fläche mit „Stand <Tag>“ (etwa „Stand 18.10.“). Darin ist ein Knopf „Zurück zu heute“, mindestens 48 px hoch.

> **AC-4** Der Graph zeigt weiter die sechs Wochen bis heute mit allen Messungen. Den gewählten Tag markiert er mit einer senkrechten Linie und einem größeren Punkt; bei einem Ausreißer bleibt dieser Punkt hohl.

> **AC-5** Zurück zu heute kommt man mit „Zurück zu heute“, einem zweiten Tipp auf den gewählten Punkt oder einem Tipp auf den Punkt des letzten Tags mit einer Messung. Danach ist die Seite genau wie ohne Wahl, mit Statuszeile, ⟳ und ohne Markierung.

> **AC-9** Mit der Tastatur ist der Graph per Tab erreichbar. ← und → wählen den vorigen bzw. nächsten Tag mit einer Messung, Escape führt zurück zu heute. Nach „Zurück zu heute“ liegt der Fokus auf dem Graphen. Ein Screenreader sagt das Band höflich an, etwa „Stand 18.10.“.

> **AC-10** Auf 360 × 640 px steht das Band in einer Zeile. Ab 65em sitzt es, wo die Statuszeile sitzt, so breit wie die Spalte der vier Zahlen. Nichts scrollt horizontal.

> **AC-11** Ohne Wahl sieht die Seite aus wie bisher; neu ist nur, dass der Graph Tipps annimmt und per Tab erreichbar ist.

## Technical decisions
> **Stored formats** keine. Der gewählte Tag lebt nur im Speicher der Seite.

> **Wire formats** keine.

> **Trust boundaries** keine.

> **Dependencies** keine.

## Nudges
> Die Regel „die Seite eines früheren Tags kennt nur die Messungen bis einschließlich jenes Tags“ steht an einem Ort: in einer reinen Funktion neben `assess` in `src/verdict/assessment.ts`, die nach der Regel heißt. Aus ihrem Ergebnis kommen sowohl die Einschätzung (aus den zählenden Messungen) als auch „Letzte Messung“ (die neueste, zählend oder nicht).

> Der gewählte Tag lebt in `src/app/page.tsx`. `WeightGraph` bekommt ihn und meldet Tipps über einen Callback, zeichnet aber weiter die `sixWeekSeries` von heute.

> Das Band ist eine eigene Komponente an der Stelle von `GoogleStatus`; `GoogleStatus` bleibt unverändert.

> „Stand“ kommt ins Glossar `UBIQUITOUS_LANGUAGE.md`: auf der Seite „Stand“, im Code `shownDay`, „der frühere Tag, dessen Seite unter dem Band gezeigt wird“.

> `changes/backlog/werte-einzelner-tage.md` geht in dieser Änderung auf.

## Context
Heute rechnet `Page` in `src/app/page.tsx` aus Cache und Eingetragenen Messungen `latestMeasurement` und `assess(countingMeasurements(…), today)` und gibt sie an `Surface` (Farben, `theme-color`, `GoogleStatus`, `EntrySheet`) und `CachedMeasurements` („Letzte Messung“, `Verdict`, `Figures`, `WeightGraph`). `WeightGraph` (`src/app/WeightGraph.tsx`) zeichnet die `sixWeekSeries` als reines SVG ohne Interaktion, in zwei Layouts (unter und ab 600 px Breite). Die Seite in Tests öffnet `src/test/open-page.tsx`; die Testdaten bis 20.10. liefert `src/test/weight-history-fixture.ts`.

Das Muster ist `specimens/muster.html` neben `CRITERIA.md`: gebaut wird danach, nicht neu entworfen. Es zeigt das Band und die Markierung (senkrechte Linie, Punkt mit Rand in der Farbe der Fläche). Wo es von den Kriterien abweicht, gelten die Kriterien: dort ist „Zurück zu heute“ niedriger als 48 px (AC-3).

Wie im Muster ist der letzte Tag mit einer Messung kein früherer Tag: ihn zu wählen, per Tipp, Ziehen oder →, zeigt heute.

Dieses Ticket legt den gewählten Tag (`shownDay`) in `page.tsx` und die Funktion mit der Regel in `assessment.ts` an; 02 baut darauf, wann die Wahl endet.

## Not here
- Was die Wahl beendet oder hält: Sichtbarwerden der Seite (AC-6), + und sein Blatt während einer Wahl (AC-7) und ein Abruf während einer Wahl (AC-8). Das ist 02.
- Die Differenz zwischen der heutigen Messung und der des gewählten Tags.
- Messungen vor den sechs Wochen des Graphen (`changes/backlog/langzeitansicht.md`): der Graph und was sich wählen lässt, bleiben bei den sechs Wochen bis heute.
- Weitere Messungen eines Tags außer der zählenden und der letzten.

## Left standing

**Nach der letzten Review behoben, von keinem Reviewer gesehen**
- Blocker (2. Runde): Nach einem Klick oder Tipp auf den Graphen oder auf „Zurück zu heute“ blieb in Chromium der Standard-Fokusrahmen um den Graphen (gegen AC-5/AC-11). `src/app/WeightGraph.module.css` setzt jetzt `.drawing:focus { outline: none }`; den Rahmen der Tastatur zeichnet weiter `:focus-visible`. Ein Test liest nur das Stylesheet, im Browser ist der Fix nicht geprüft.
- Should-fix (2. Runde): Ein senkrechtes Wischen, das auf dem Graphen beginnt, zeigte kurz die Seite eines anderen Tags, bis der Browser `pointercancel` schickte. Jetzt wählt ein Finger (`pointerType` `touch`) erst beim Loslassen oder sobald er sich weiter waagrecht als senkrecht bewegt hat (`useDayChoice` in `src/app/WeightGraph.tsx`). Maus und Stift wählen wie bisher schon beim Drücken. Die Tests in `page.test.tsx` mit Touch-Eingaben von userEvent decken das ab, auf einem echten Touch-Gerät ist es nicht geprüft.

**Review-Befunde, nicht behoben**
- Nit (1. Runde): Der fokussierbare Graph heißt für Screenreader nur „Messungen und Trend der letzten sechs Wochen“, nichts verrät ← und →. AC-9 verlangt keinen Hinweis; ein zusätzlicher Text auf der Seite ist eine Entscheidung über die Oberfläche, die ich nicht treffen wollte.
- Nit (1. Runde): Das neue Export `measurementsKnownOn` steht in `src/verdict/assessment.ts` nach Zeile 60. `assess` stand dort schon vorher; oben stehen die Typen.
- Nit (2. Runde): Der Fokusrahmen der Tastatur um „Zurück zu heute“ ragt rechts etwa 5 px über das Band hinaus, weil der Knopf bündig am Rand sitzt. Nur kosmetisch und nur mit der Tastatur sichtbar.

**Nicht ausgeführte Prüfungen**
- Nach den beiden Fixes oben hat niemand die Seite im Browser bedient. Ein echtes Handy oder ein echter Screenreader kam in keiner Runde zum Einsatz; die Reviewer haben headless Chromium über CDP mit Maus-, Tastatur- und Touch-Eingaben benutzt.

**Kriterien, die kein automatischer Test ganz beweist**
- AC-1 (senkrechtes Wischen scrollt): Getestet ist `touch-action: pan-y` im Stylesheet und dass ein senkrechtes Wischen keinen Tag wählt. Dass die Seite tatsächlich scrollt, haben beide Reviewer mit CDP-Touch auf 360 × 640 gesehen.
- AC-10 (eine Zeile auf 360 px, ab 65em an der Stelle der Statuszeile, nichts scrollt waagrecht): Die Tests lesen nur Stylesheets (`nowrap`, 420 px, `margin-left: auto`, nichts über 360 px). Gemessen haben es beide Reviewer in Chromium auf 360 × 640 und 1280 × 900: das Band steht bei x 700–1120, wie die Spalte der vier Zahlen.
- AC-3 (Knopf mindestens 48 px): Getestet ist `min-height: 48px` im Stylesheet; der Reviewer hat 48 px gemessen.
- AC-9 (Screenreader sagt das Band höflich an): Getestet sind `role="status"` und `aria-live="polite"` mit „Stand 18.10.“. Mit einem echten Screenreader ist es nicht geprüft.
- AC-5/AC-11 (ohne Fokusrahmen nach Tipp): jsdom kennt kein `:focus-visible`. Getestet ist nur, dass die Seite `focus({ focusVisible })` mit `false` nach Tipp und `true` nach Tastatur aufruft, dazu die Stylesheet-Regel oben.

**Entscheidungen, die sich schwer zurücknehmen lassen**
- `ShownDayAnnouncement` ist eine Live-Region, die immer auf der Seite steht, weil eine Region, die erst mit ihrem Text erscheint, nicht zuverlässig vorgelesen wird. Damit hat die Seite zwei `role="status"`; der Test in `GoogleStatus.test.tsx` sucht seine Region jetzt innerhalb der Statuszeile.
- Das Band ist so hoch wie die Statuszeile: `calc((14px + 13px) * var(--mantine-line-height) + 11px)` in `ShownDayBand.module.css` folgt den Schriftgrößen und Abständen in `GoogleStatus.module.css`. Ändert sich die Statuszeile, muss das Band mit; ein Test in `page.test.tsx` prüft Lücke und Innenabstand der Statuszeile mit.
- Der Graph bleibt `role="img"`, obwohl er per Tab erreichbar ist und ← → nimmt (mit `biome-ignore` für `noNoninteractiveTabindex`, wie im Muster). Eine andere Rolle (etwa `slider`) würde die Ansage und die Tests ändern.

**Abweichungen vom Muster und von den Nudges**
- Muster: Dort ist „Zurück zu heute“ ein Knopf von etwa 36 px mit Abstand im Band. Gebaut ist ein Knopf von 48 px (AC-3) über die ganze Höhe des Bands, mit einem 5 px breiten Rand in der Farbe des Bands, damit er wie im Muster abgesetzt wirkt. Das Band ist so hoch wie die Statuszeile (52,85 px statt 48 px), damit beim Wählen nichts darunter springt.
- Muster: Dort wählt jeder Druck sofort. Gebaut wählt ein Finger erst beim Loslassen oder bei einer waagrechten Bewegung (siehe oben).
- Der Punkt des gezeigten Tags hat auf dem Handy den Radius 7 wie im Muster und auf breiten Bildschirmen 8; das Muster zeigt nur das Handy.
- Die Nudges sind sonst so gebaut: `measurementsKnownOn` neben `assess`, `shownDay` in `page.tsx`, `WeightGraph` meldet über `onShowDay` und zeichnet die `sixWeekSeries` von heute, `GoogleStatus` ist unverändert, „Stand“ steht im Glossar, `changes/backlog/werte-einzelner-tage.md` ist gelöscht. `WeightGraph` bekommt zusätzlich `surface` für den Rand des markierten Punkts und einen `ref`, damit der Fokus nach „Zurück zu heute“ auf den Graphen gehen kann.
- Während ein Tag gewählt ist, haben + und sein Blatt die Farben des gezeigten Tags, und der Vorschlag im Feld bleibt die Letzte Messung von heute. Wie es dort richtig ist, entscheidet 02 (AC-7).

**Namen, die nicht aus dem Glossar kommen**
- `measurementsKnownOn` (die Regel „die Seite eines Tags kennt nur die Messungen bis einschließlich jenes Tags“; steht jetzt im Glossareintrag „Stand“), `ShownDayBand` und `ShownDayAnnouncement` (das Band und seine Ansage), `useDayChoice` (Tipp, Ziehen und Tasten im Graphen), `onShowDay` und `backToToday`.
