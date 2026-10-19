# Criteria: Frühwarnung mit einer Stimme

## Problem

Die Seite sagt nicht, wofür jede ihrer Angaben da ist, und kurzfristig spricht sie mit mehreren Stimmen. Stattdessen soll man zwei Dinge sehen und wissen, wofür jedes da ist: eine langfristige Sicht, die nahe an der Wahrheit liegt und, wie man weiß, langsam reagiert; und eine Frühwarnung für eine mögliche Änderung des Trends, die mit einer Stimme spricht - eine Botschaft, die die jüngste Richtung und einen Morgen, der deutlich davon abweicht, zusammenhält und als Ermutigung oder Warnung endet. Das gilt unabhängig vom Urteil: auch ein deutlicher Rückgang an einem „Nimmt ab“-Tag bekommt ein ermutigendes Wort, ein deutlicher Sprung nach oben während eines fallenden Trends eine Warnung.

Der Fall: Am 19.10.2026 stand „Nimmt zu“ und darunter „Seit 9 Tagen kein Abnehmen“. Die zweite Zeile liest sich wie ein eigenes Urteil, weil sie an anderen Tagen eins ist - welches gilt: zunehmen oder nur nicht abnehmen? Der deutliche Rückgang an diesem Morgen (97,0 kg gegen einen Trend von 98,3 kg) bekam kein Wort, an genau dem Morgen, an dem eine Ermutigung gefehlt hat. Gewünscht war etwa: „4-Wochen-Trend: Nimmt ab. Aktuell nimmst du eher zu, aber heute hast du wieder gut Gewicht verloren – weiter so!“ Die Messungen sind die Testdaten `src/test/fixtures/gewicht-2026-07-bis-10.csv` bis 17.10. und 98,4 kg am 18.10. und 97,0 kg am 19.10. Dass „4 Wochen: nimmt ab“ den kurzfristigen Angaben widersprechen kann, ist dagegen verständlich.

## Acceptance criteria

- **AC-1** Die Streuung eines Tages ist die Wurzel aus dem Mittel der Quadrate der Abstände „zählende Messung minus Trend ihres Tages“ aller Tage mit Trend in den 28 Tagen vor ihm. Mit weniger als 10 solchen Abständen ist sie 0,7 kg.
- **AC-2** Jede Prüfung fragt, ob ein Wert über das 1,25-Fache dessen hinausgeht, was Rauschen allein ergibt. Die Schwellen sind 1,25 × σ kg für den Morgen, 1,25 × 0,80 × σ kg pro Woche für das 7-Tage-Tempo und 1,25 × 0,20 × σ kg pro Woche für das 28-Tage-Tempo, σ die Streuung des Tages. Ein Wert genau auf der Schwelle gilt als „stagniert“ bzw. als keine Abweichung.
- **AC-3** Frühwarnung: Das 7-Tage-Tempo eines Tages ist sein Trend gegen den Trend des letzten Tages, der 7 bis 10 Tage vor ihm liegt, in kg pro Woche; verglichen wird nur mit Tagen ab dem ersten Tag nach der letzten Lücke. Unter minus der Schwelle lautet die Überschrift „Nimmt ab“, über der Schwelle „Nimmt zu“, dazwischen „Stagniert“. Über der Überschrift steht „Frühwarnung · letzte Tage“.
- **AC-4** Unter der Überschrift steht „Der Trend fällt seit N Tagen.“, „Der Trend stagniert seit N Tagen.“ oder „Der Trend steigt seit N Tagen.“. N sind die Tage seit dem letzten Tag mit Messung, an dem die Frühwarnung etwas anderes sagte als heute („Nimmt ab“, „Stagniert“, „Nimmt zu“) oder nichts davon; bei N = 1 heißt es „seit einem Tag“. Sagte sie an jenem Tag nichts davon, heißt es „seit mindestens N Tagen“.
- **AC-5** Bei „Nimmt ab“ ist die Fläche blau wie bisher. „Stagniert“ und „Nimmt zu“ tragen die Farben der Warnstufe von N - 1 bis 6, 7 bis 13, ab 14 Tagen -, schon vom ersten Tag an. Die Überschrift ist auf jeder Warnstufe gesetzt wie bisher „Nimmt ab“; sie wird nicht breiter oder kräftiger.
- **AC-6** Liegt die zählende Messung des letzten Tages mit Messung mehr als die Schwelle über ihrem Trend, steht in der Frühwarnung unter dem Satz eine Karte in umgekehrten Farben: „Heute · X kg über dem Trend“ und darunter „Hoffentlich ein Ausreißer – gestern viel gegessen? Vorsicht!“. Liegt sie mehr als die Schwelle darunter: „Heute · X kg unter dem Trend“ und „Vielleicht ein Ausreißer, vielleicht die Wende. Weiter so!“. Sonst gibt es keine Karte. X ist der Abstand, auf eine Nachkommastelle gerundet. War die Messung nicht heute, steht „Gestern“ oder „Am T.M.“ an Stelle von „Heute“. Die Karte erscheint nur mit der Frühwarnung, nicht beim Vergleich nach einer Lücke, bei „Letzte Messung vor N Tagen“ oder bei „Noch kein Urteil“.
- **AC-7** Der Graph markiert genau die Messungen als Ausreißer, die nach der Regel aus AC-6 mit der Streuung ihres eigenen Tages über der Schwelle liegen, egal ob darüber oder darunter.
- **AC-8** Unter der Frühwarnung steht „Langfristig · 4 Wochen“, darunter „Nimmt ab, −0,33 kg pro Woche (≈ 360 kcal Defizit pro Tag)“ bzw. „Stagniert, …“ oder „Nimmt zu, … (≈ … kcal Überschuss pro Tag)“, und darunter „Nah an der Wahrheit, reagiert langsam.“. Das 28-Tage-Tempo wird berechnet wie bisher das Tempo 4 Wochen, auch über Lücken hinweg, auf Hundertstel gerundet; seine Tempo-Stufe folgt aus dem gerundeten Wert und der Schwelle aus AC-2. Die kcal pro Tag sind der Betrag des gerundeten Tempos × 7700 / 7, auf Zehner abgerundet (−0,35 kg pro Woche ergibt 380 kcal); bei einem Tempo von 0,00 steht keine Klammer. Die Zahl „Tempo 4 Wochen“ steht nicht mehr bei den Zahlen; dort stehen Trend und Gemessen.
- **AC-9** „kein Abnehmen“, „Zuletzt abgenommen bis“ und die Ampel „4 Wochen: …“ unter der Überschrift kommen auf der Seite nicht mehr vor.
- **AC-10** Der Vergleich nach einer Lücke steht an Stelle der Frühwarnung, bis der Tag ein 7-Tage-Tempo nach der Lücke hat; sein Satz endet mit „Ein Urteil gibt es wieder eine Woche nach der Lücke.“. „Noch kein Urteil“ steht, solange der Trend oder das 7-Tage-Tempo fehlt, mit dem Satz „Ein Urteil gibt es nach knapp zwei Wochen mit Messungen.“. Gibt es unter „Noch kein Urteil“ schon einen Trend, zeigen die Zahlen den Trend und der Graph die Trendlinie und die Ausreißer nach AC-7. „Letzte Messung vor N Tagen“ tritt an Stelle der Frühwarnung wie bisher. In allen drei Fällen steht der Block „Langfristig“, wo es ein 28-Tage-Tempo gibt.
- **AC-11** Mit den Testdaten und zusätzlich 98,4 kg am 18.10. und 97,0 kg am 19.10.2026 lautet die Seite: am 7.10. der Vergleich nach der Lücke; am 8.10. „Nimmt ab“; am 12.10. „Nimmt ab“ mit „Der Trend fällt seit mindestens 5 Tagen.“, der Karte „Heute · 2,6 kg über dem Trend“ und „Nimmt ab, −0,74 kg pro Woche (≈ 810 kcal Defizit pro Tag)“; am 13.10. „Stagniert“ mit „Der Trend stagniert seit einem Tag.“ und der Karte „Heute · 1,2 kg über dem Trend“; am 16.10. „Stagniert“ mit „Der Trend stagniert seit 4 Tagen.“ und ohne Karte (0,97 kg über dem Trend, Schwelle 1,01 kg); am 17.10. „Nimmt zu“ mit „Der Trend steigt seit einem Tag.“; am 19.10. „Nimmt zu“ mit „Der Trend steigt seit 3 Tagen.“, der Karte „Heute · 1,3 kg unter dem Trend“ und „Nimmt ab, −0,33 kg pro Woche (≈ 360 kcal Defizit pro Tag)“.
- **AC-12** Auf einem Bildschirm von 360 × 640 px sind in jedem Zustand, auch mit dem Knopf „Daten abrufen“ und mit der Zeile „Vorläufig, wird aktualisiert …“, Überschrift, Satz, Karte, der Block „Langfristig“ und die Zahlen ohne Scrollen sichtbar, und nichts scrollt horizontal. Auf breiten Bildschirmen steht die Frühwarnung mit der Karte links, „Langfristig“ und die Zahlen rechts, aufgeteilt wie bisher Urteil und Zahlen.
- **AC-13** „Letzte Messung“, Abruf, Abmelden und der Graph bis auf die Markierung der Ausreißer bleiben unverändert.

## Agreed design

Ein Trend über 14 Tage und drei gleich gebaute Prüfungen darauf, jede „über 1,25-mal dem Rauschen“: der Morgen gegen den Trend (Karte), das 7-Tage-Tempo (Frühwarnung), das 28-Tage-Tempo (Langfristig). Alle Schwellen folgen aus der einen Streuung σ der Messungen um den Trend. Auf der Seite steht oben die Frühwarnung mit ihrer Überschrift, dem Satz mit der Dauer und, an Morgen über der Schwelle, der Karte in umgekehrten Farben; darunter der beschriftete Block „Langfristig · 4 Wochen“; dann Trend, Gemessen und der Graph. Das Modell mit Begründung, Pseudocode und Beispielen steht in [How the weight page reads the weight](https://claude.ai/code/artifact/68ca4e94-3163-472f-a952-a904614e48b4).

- Artifact: https://claude.ai/artifact/3RZPaRpUpCnwy5PooUGGP5
- Kopie: [`specimens/Main.dc.html`](specimens/Main.dc.html) (19.10.), [`specimens/A-12.dc.html`](specimens/A-12.dc.html) (12.10.), [`specimens/A-17.dc.html`](specimens/A-17.dc.html) (17.10., ohne Karte)

Der Graph ist im Muster nur ein Platzhalter; er bleibt, wie er ist. Die Kopien zeigen sich nur über das Artifact, nicht als lokale Dateien. Die kcal in „Langfristig“ gehen über das Problem hinaus; sie kamen auf Wunsch dazu, als das Modell feststand.

**Agreed; build to this, do not redesign.**

## Technical decisions

- **Stored formats** Keine. Der Cache `gewicht:v1` bleibt unverändert; Streuung, Tempi, Tempo-Stufe, Warnstufe und Karte werden aus den Messungen berechnet.
- **Wire formats** Keine.
- **Trust boundaries** Keine.
- **Dependencies** Keine.

## Nudges

- Die Streuung hat einen Ort, `src/trend/scatter.ts`; im Glossar „Streuung“ / `scatter`. Dort stehen als benannte Konstanten der Faktor 1,25, die Rauschfaktoren 1,0 (Morgen), 0,80 (7-Tage-Tempo) und 0,20 (28-Tage-Tempo), die 28 Tage, die 10 Abstände und die Start-Streuung 0,7 kg, und die Regel, die einen Wert gegen seine Schwelle in „darunter“, „dazwischen“ und „darüber“ sortiert.
- Jeder Rauschfaktor bekommt einen Kommentar, woher er kommt: aus einer Simulation eines gleichbleibenden Gewichts mit zufälliger täglicher Streuung von σ = 1 kg, mit Trend und Tempo berechnet wie auf der Seite, als mittlere Schwankung des Werts (7-Tage-Tempo 0,80, 28-Tage-Tempo 0,20, Morgen 0,92, aufgerundet auf 1,0). Die 0,7 kg bekommen einen Kommentar: die Streuung der Messungen von 2026.
- Der Vergleich nach einer Lücke nimmt als Streuung die Streuung des ersten Tags nach der Lücke aus `scatter`; `spreadBefore` in `src/verdict/gap-comparison.ts` fällt weg, und `MEASUREMENTS_UNTIL_VERDICT` weicht der Regel aus AC-10.
- `src/trend/four-day-pace.ts` wird zum 7-Tage-Tempo in `src/trend/week-pace.ts`; im Glossar „7-Tage-Tempo“ / `weekPace`. `slopePerWeek` fällt aus `Trend` weg, sobald nichts es mehr liest.
- `isOutlier` in `src/trend/outlier.ts` nimmt die Streuung statt der 0,9 kg; die Karte und der Graph fragen beide dort.
- `paceBand` in `src/trend/pace.ts` nimmt die Schwelle aus der Streuung statt ±0,2. Die kcal pro Tag rechnet eine Funktion neben dem Tempo, mit 7700 kcal pro kg als benannter Konstante.
- In `src/verdict/verdict.ts` fallen `isFalling`, `CONFIRMATION_DAYS` und `GAINING_KG_PER_WEEK` weg; das Urteil hat die Arten `losing` / `holding` / `gaining`, jede mit N, „mindestens“ und Warnstufe.
- In `UBIQUITOUS_LANGUAGE.md` werden Urteil (auf der Seite „Frühwarnung“), Stufe (heißt jetzt „Warnstufe“ und zählt die Tage, in denen die Frühwarnung dasselbe sagt), Tempo und Tempo-Stufe (Schwelle aus der Streuung, mit kcal) und Ausreißer (Schwelle aus der Streuung) angepasst; „Streuung“, „7-Tage-Tempo“ und „Abweichung am Morgen“ / `morningDeviation` für die Karte kommen dazu; „4-Tage-Tempo“ und „Steigung“ gehen.
- AC-11 ersetzt in den Tests die Tage aus AC-4 und AC-5 der Trendumkehr und die Tests der festen Schwellen 0,9 kg, +1,0 und ±0,2 kg pro Woche.
- Bei der Abnahme prüfen, ob `changes/backlog/nimmt-zu-nach-luecke.md` noch auftritt; AC-3 und AC-10 beheben es vermutlich. Tritt es nicht mehr auf, wird der Eintrag gelöscht.
- Das Kaloriendefizit aus `changes/backlog/hauptseite-abwaegen.md` ist mit AC-8 erledigt; der Eintrag verliert diesen Absatz.

## Out of scope

- Der Rest von `changes/backlog/hauptseite-abwaegen.md`: ob jede übrige Angabe der Hauptseite ihren Platz verdient.
- Eine Frühwarnung mit kürzerem Tempo in der ersten Woche nach einer Lücke.
- Eine Simulation der Rauschfaktoren aus der eigenen, schiefen Streuung zur Laufzeit.

## Ruled out

- **Langfristig oben, Frühwarnung als Karte darunter (Variante B)** - die Überschrift „Nimmt ab“ stünde auf der Alarmfarbe der Frühwarnung.
- **Ein Absatz statt Überschrift (Variante C)** - 27 Satzfälle, und die Kernbotschaft ist nicht auf einen Blick lesbar.
- **Trend oder Gerade über 28 Tage** - hinkt etwa zwei Wochen hinterher; am 19.10. läge 97,0 kg genau auf ihr, und die Umkehr im Oktober käme zu spät.
- **7-Tage-Gerade direkt durch die Messungen** - zu verrauscht (Schwelle etwa 1,8 kg pro Woche); erkennt die Umkehr im Oktober nicht.
- **Streuung über 14 Tage** - die Schwelle des Morgens springt zwischen 8.10. und 13.10. von 0,37 auf 1,13 kg; bei gleichen Urteilen im Oktober.
- **Streuung des Tempos selbst als Schwelle** - der steile Fall Anfang Oktober bläht sie auf, und die Umkehr ab 17.10. gälte als „stagniert“.
- **Feste Schwellen in kg (0,9 kg, +1,0, −0,2)** - von Hand gesetzt; sie lagen schon nahe 1,25-mal dem Rauschen, außer „fällt“ bei −0,2.
- **Frühwarnung als Abstand des kurzen vom langen Tempo** - springt im Oktober hin und her; das 7-Tage-Tempo ist ruhiger.
- **„Fällt seit N Tagen nicht mehr“** - N zählt jetzt die Tage, in denen die Frühwarnung dasselbe sagt, „steigt seit N Tagen“ stimmt also.
- **Kürzeres Tempo in der ersten Woche nach einer Lücke** - zusätzliche Rauschfaktoren je Spanne für einen seltenen Fall; der Vergleich nach der Lücke steht so lange.
- **Vorgaben für Trend und Tempi, wo sie fehlen** - würden ein Ergebnis erfinden; nur die Streuung beschreibt die Person und hat eine Vorgabe.
- **Höhere Schwelle für Warnungen als für Ermutigungen** - die Streuung ist schief, Sprünge nach oben sind häufiger; Warnungen bei Sprüngen sind aber gewollt, auch häufig.
