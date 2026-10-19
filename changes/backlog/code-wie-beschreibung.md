---
effort: L
utility: M
---

# Code so lesbar wie die Beschreibung

> Plan und Anhang beschreiben Code und Seite vor
> `changes/2026-10-19-fruehwarnung-mit-einer-stimme/`. Seitdem gibt es kein
> 4-Tage-Tempo, keine Steigung, kein „kein Abnehmen“ und keine Ampel mehr,
> die Schwellen kommen aus der Streuung (`src/trend/scatter.ts`), und
> `sortAgainstThreshold` ist die eine Regel für alle Grenzen. Wer diesen
> Eintrag aufnimmt, schreibt zuerst den Anhang neu und prüft den Plan
> dagegen.

Der Anhang unten beschreibt in natürlicher Sprache, was die Seite tut. Der
Code sollte sich genauso lesen lassen. Bisher tut er das nicht. Die
Beschreibung ist um einen Tag mit seinen Eigenschaften gebaut (Trend,
Steigung, 4-Tage-Tempo; „der letzte Tag“, „die letzte Lücke“, „der erste
gezählte Tag“). Der Code hat dafür keinen eigenen Typ: jede Funktion bekommt
`counting` und `trends` und rechnet daraus selbst nach.

## Plan

### 1. Ein Typ für den Verlauf statt loser Listen

Heute wird dasselbe an vielen Stellen neu gesucht:

- `trends(counting)` zweimal: `src/verdict/assessment.ts` (`assessLastDay`)
  und `src/trend/six-week-series.ts`.
- `findGaps` dreimal: `gapUnderComparison`, `firstCountedDay`,
  `sixWeekSeries`.
- `trends.find((trend) => trend.day === day)` viermal (`pace`, `fourDayPace`,
  `compareAfterGap`, `assessLastDay`), `new Map(trends…)` zweimal.
- `fourDayPace` braucht den Parameter `firstComparable`, den jeder Aufrufer
  selbst ausrechnet.

Vorschlag: den Verlauf einmal aufbauen, wie die Grundbegriffe ihn aufbauen:

```ts
interface MeasuredDay {
  day: CalendarDay;
  measurement: CountingMeasurement;
  trend: Trend | null;
  fourDayPace: number | null;
}

interface History {
  days: MeasuredDay[];
  lastDay: MeasuredDay;
  lastGap: Gap | null;
  firstCountedDay: CalendarDay;
}
```

Das Urteil liest sich dann wie „Welches Urteil“, Punkt 1 bis 3:

```ts
export function verdict(history: History): Verdict {
  const withoutDecrease = daysWithoutDecrease(history);
  if (isAbove(history.lastDay.fourDayPace, GAINING_KG_PER_WEEK))
    return { kind: "gaining", ...withoutDecrease };
  if (withoutDecrease.lastLosingDay !== null && withoutDecrease.days < WAITING_DAYS)
    return { kind: "losing" };
  return { kind: "noDecrease", ...withoutDecrease };
}
```

`History` gibt es nur mit mindestens einer Messung; das `throw` in `lastOf`
(`src/verdict/verdict.ts`) fällt weg.

### 2. `assess` als Tabelle „Welche Überschrift erscheint“

`assess` ist verschachtelt: `assessLastDay` entscheidet die Fälle 1, 3, 4 und
5, danach überschreibt `assess` mit Fall 2. Der Typ `Assessment` mischt die
Einschätzung (Überschrift) mit den Zahlen und dem Graphen, die die
Beschreibung getrennt behandelt. Die Regel „bei ‚Noch kein Urteil‘ nur
‚Gemessen‘“ steht deshalb an drei Stellen: im Union-Typ, in `noVerdictYet`
(das auch die Ausreißer aus dem Graphen nimmt) und beim Umkopieren in
`assess`.

```ts
const onLastDay = assessmentOnLastDay(history);   // Fälle 3, 4, 5 der Reihe nach
return {
  assessment: lastMeasurementTooOld(history, today) ?? onLastDay,  // Fall 2 hat Vorrang
  figures: figuresUnder(onLastDay, history),       // die Zahlen bleiben wie am letzten Tag
  graph: graphUnder(onLastDay, history, today),
};
```

### 3. Grenzwerte einmal festlegen

Die Beschreibung hat eine Regel für alle Grenzen. Der Code hat
`ROUNDING_ERROR` zweimal (`src/trend/outlier.ts`, `src/verdict/verdict.ts`)
und rechnet es an jeder Grenze von Hand ein. Vorschlag: ein kleines Modul mit
`isAbove(value, limit)` / `isBelow(value, limit)` (`null` liegt nie darüber
oder darunter).

### 4. Typen, die die Fallunterscheidung abbilden

`DaysWithoutDecrease { days, atLeast, since, level }`: `since` bedeutet je
nach `atLeast` den letzten Tag mit fallendem Trend oder den ersten gezählten
Tag. Die Beschreibung unterscheidet „gab es einen Tag mit fallendem Trend /
gab es keinen“. Vorschlag:
`{ days: number; lastLosingDay: CalendarDay | null; level: Level }`. In
`src/app/Verdict.tsx` wird aus `if (status.atLeast)` dann
`if (status.lastLosingDay === null)`.

### 5. Modulschnitt nach der Reihenfolge der Grundbegriffe

„Jeder nutzt nur die davor“:

- `median` liegt in `src/trend/trend.ts`, `gap-comparison` holt es von dort.
  Der Median ist der zweite Grundbegriff und gehört ganz nach unten, etwa
  `src/measurement/median.ts`.
- Der erste gezählte Tag („nach der letzten Lücke“) steht als
  `firstCountedDay` in `src/verdict/verdict.ts`, das 4-Tage-Tempo in
  `src/trend/` braucht ihn aber schon. Er gehört zur Lücke
  (`src/measurement/gap.ts`) bzw. in `History`.
- `src/trend/six-week-series.ts` ist der Abschnitt „Die Zahlen und der Graph“
  und rechnet die Trends selbst neu. Mit Punkt 1 schneidet er nur noch aus
  `History` aus und trennt an den Lücken.
- Vergleiche, die rechnen statt zu sagen, was gemeint ist:
  `daysBetween(firstComparable, trend.day) >= 0`,
  `measurement.day >= gap.firstDayAfter` (mit Kommentar zur Textsortierung).
  Hilfsfunktionen wie `isOnOrAfter(day, other)` in `calendar-day.ts`; in
  `fourDayPace` wird das Fenster „4 bis 7 Tage vorher“ dann eine Bedingung
  statt `findLast` mit Prüfung danach.

### 6. Namen an die Beschreibung angleichen

| Beschreibung | Code jetzt | Vorschlag |
|---|---|---|
| Einschätzung | `AssessmentStatus` | `Assessment`; das Glossar bekommt dafür das Wort „Einschätzung“ (es sagt bisher, die Seite habe keins) |
| Urteil | `TrendVerdict` / `trendVerdict` | `Verdict` / `verdict` |
| Wartezeit von 3 Tagen | `CONFIRMATION_DAYS` | `WAITING_DAYS` |
| Grenze 2 · s / √n | `normalVariation` | `limit`; die normale Schwankung ist in der Beschreibung s, nicht die Grenze |
| Tempo 4 Wochen / 4-Tage-Tempo | `pace` / `fourDayPace` | `fourWeekPace` / `fourDayPace` |

### 7. Texte der Seite pro Fall zusammenfassen

`src/app/Verdict.tsx` hat vier `switch` über dieselben Fälle (`headline`,
`explanation`, `emphasis`, `surfaceColours`). Die Beschreibung nennt
Überschrift und Satz pro Fall zusammen: eine Funktion
`wording(assessment): { headline, sentence }`. `surfaceColours` passt schon
zur Farbtabelle.

### 8. Die Beschreibung an einer Stelle

Dieselbe Regel steht dreimal da (Glossar, Beschreibung, Doc-Kommentare), und
die Fassungen weichen schon voneinander ab (siehe unten). Das Glossar bleibt
knapp, die Beschreibung im Anhang wird die ausführliche Fassung, und die
Doc-Kommentare verweisen auf ihren Abschnitt und sagen nur, was dort nicht
steht.

Mit 1 und 2 anfangen; 3 bis 7 sind danach je ein kleiner Umbau mit grünen
Tests.

## Unklar, was richtig ist

Code, Glossar und Beschreibung widersprechen sich an zwei Stellen. Welche
Fassung gilt, ist noch zu entscheiden:

- **Toleranz im Vergleich nach einer Lücke.** Die Beschreibung sagt, die
  Grenzwert-Regel gilt für alle Grenzen. `variation()` in
  `src/verdict/gap-comparison.ts` vergleicht den Unterschied mit 2 · s / √n
  ohne Toleranz.
- **Stufe 1.** Glossar und der Kommentar an `Level` in
  `src/verdict/verdict.ts` sagen „3–6 Tage“. Beschreibung und `level()`
  sagen „unter 7 Tage (auch unter 3)“; „Nimmt zu“ nutzt Stufe 1 auch unter
  3 Tagen.

## Anhang: die Beschreibung

Bis hierher lag sie als `ALGORITHM.md` im Repository.

### Wie die Seite eine Gewichtskurve einschätzt

#### Worum es geht

Eine Person wiegt sich regelmäßig, die Messungen landen in Google Health. Das
Gewicht schwankt von Tag zu Tag um einige hundert Gramm, auch wenn sich
eigentlich nichts ändert. Die Seite soll trotzdem eine klare Antwort geben:
Nimmt die Person gerade ab, oder nicht mehr?

Dazu glättet sie die Messungen zu einem **Trend** und leitet daraus genau
eine **Einschätzung** ab, die als Überschrift erscheint.

Die Fachbegriffe in diesem Text sind im Glossar `UBIQUITOUS_LANGUAGE.md`
festgelegt. Der Code dazu liegt in `src/measurement/`, `src/trend/` und
`src/verdict/`.

#### Was auf der Seite steht

Von oben nach unten:

1. die **Überschrift**: die Einschätzung, z. B. „Nimmt ab“,
2. je nach Fall ein erklärender **Satz** darunter,
3. die **Tempo-Stufe**, auch „Ampel“ genannt, z. B. „4 Wochen: nimmt ab“,
4. die Zahlen **Trend**, **Gemessen**, **Tempo 4 Wochen** und **Letzte
   Messung**,
5. ein **Graph** der letzten sechs Wochen.

Die Fläche hinter Überschrift und Zahlen ist je nach Einschätzung eingefärbt.

#### Grundbegriffe

Die Begriffe bauen aufeinander auf; jeder nutzt nur die davor.

**Tag.** Gemeint ist immer ein Kalendertag in der Zeitzone Europe/Berlin.
„Heute“ ist der aktuelle Tag dort, „der letzte Tag“ ist der letzte Tag, an
dem gemessen wurde.

**Median.** Der mittlere Wert, wenn man Zahlen der Größe nach ordnet. Anders
als der Durchschnitt verschiebt ihn ein einzelner extremer Wert kaum.

**Zählende Messung.** Wiegt sich die Person an einem Tag mehrmals, zählt nur
die erste Messung des Tages. Alle Rechnungen (Trend, Tempo, Urteil) verwenden
nur diese zählenden Messungen. Die weiteren Messungen erscheinen nur in der
Zeile „Letzte Messung“.

**Lücke.** Liegen zwei aufeinanderfolgende Tage mit Messung mehr als 3 Tage
auseinander, ist dazwischen eine Lücke. Beispiele: Vom 1. zum 5. ist eine
Lücke (4 Tage Abstand), vom 1. zum 4. nicht (3 Tage Abstand). Die Länge der
Lücke ist dieser Abstand in Tagen: Vom 22.9. bis zum 1.10. ist eine Lücke von
9 Tagen.

**Trend** (eines Tages mit Messung). Das geglättete Gewicht dieses Tages. So
wird er berechnet:

1. Man nimmt die zählenden Messungen dieses Tages und der 13 Tage davor, also
   eines Fensters von 14 Tagen. Sind es weniger als 5, hat der Tag keinen
   Trend.
2. Für jedes Paar dieser Messungen berechnet man die Steigung zwischen ihnen
   (Gewichtsunterschied geteilt durch den Abstand in Tagen). Der Median all
   dieser Steigungen ist die Steigung des Trends. Das Verfahren heißt
   Theil-Sen.
3. Jede Messung wird entlang dieser Steigung auf den betrachteten Tag
   verschoben: Man rechnet also aus, was sie bei dieser Steigung an diesem Tag
   gewogen hätte. Der Median dieser Werte ist der Trend.

Weil beide Schritte Mediane verwenden, verschiebt ein einzelner Ausreißer
weder den Trend noch seine Steigung.

**Steigung.** Die Steigung aus Schritt 2, umgerechnet in kg pro Woche.

**4-Tage-Tempo** (eines Tages). Zeigt, wie sich der Trend in den letzten Tagen
bewegt hat. Man sucht unter den Tagen, die 4 bis 7 Tage vorher liegen, den
spätesten mit Trend, und vergleicht seinen Trend mit dem Trend des
betrachteten Tages. Den Unterschied rechnet man in kg pro Woche um. Dabei
kommen nur Tage in Frage, die nach der letzten Lücke liegen. Gibt es keinen
solchen Tag, hat der Tag kein 4-Tage-Tempo. Das 4-Tage-Tempo steht nicht auf
der Seite; es entscheidet aber mit, ob der Trend fällt und ob „Nimmt zu“ gilt.

**Tempo 4 Wochen.** Zeigt die Entwicklung über einen längeren Zeitraum. Man
nimmt den Trend des letzten Tages und den Trend des spätesten Tages, der
mindestens 28 Tage davor liegt und einen Trend hat. Der Unterschied, geteilt
durch die Wochen dazwischen und auf hundertstel kg gerundet, ist das Tempo.
Anders als beim 4-Tage-Tempo darf zwischen den beiden Tagen eine Lücke liegen.
Hat der letzte Tag keinen Trend oder gibt es keinen Trend, der weit genug
zurückliegt, gibt es kein Tempo.

**Ausreißer.** Eine zählende Messung, die mehr als 0,9 kg vom Trend ihres
Tages abweicht. Der Graph hebt sie hervor. Auf das Urteil hat das keinen
eigenen Einfluss, weil der Trend Ausreißer schon von sich aus kaum beachtet.

**Grenzwerte.** Für alle Grenzen in diesem Text gilt: Ein Wert, der genau auf
der Grenze liegt, gilt nicht als überschritten. Das gilt auch dann, wenn die
Rechnung ihn durch einen winzigen Rundungsfehler knapp darüber oder darunter
legt.

#### Welche Überschrift erscheint

Die Seite prüft die folgenden Fälle der Reihe nach. Der erste, der zutrifft,
bestimmt die Überschrift.

| Nr. | Fall | Überschrift |
|---|---|---|
| 1 | Es gibt überhaupt keine Messung. | „Noch kein Urteil“, ohne Zahlen. |
| 2 | Die letzte Messung liegt mehr als 3 Tage vor heute. | „Letzte Messung vor N Tagen“ |
| 3 | Nach der letzten Lücke gibt es erst 1 bis 4 Messungen. | „Nach N Tagen ohne Messung: ±x kg gegenüber vorher“ (siehe „Nach einer Lücke“) |
| 4 | Der letzte Tag hat keinen Trend (weniger als 5 Messungen in seinen 14 Tagen). | „Noch kein Urteil“ mit dem Satz „Ein Urteil gibt es ab der 5. Messung.“ |
| 5 | Alles andere. | Das **Urteil**: „Nimmt zu“, „Nimmt ab“ oder „Seit (mindestens) N Tagen kein Abnehmen“ (siehe „Das Urteil“) |

Ergänzungen:

- Fall 2 hat Vorrang vor den Fällen 3 bis 5, auch vor „Noch kein Urteil“ in
  Fall 4. Die Zahlen bleiben dabei so, wie sie am letzten Tag waren.
- In Fall 3 gilt: Hat der letzte Tag vor der Lücke keinen Trend, erscheint
  stattdessen „Noch kein Urteil“.
- Bei „Noch kein Urteil“ zeigt die Seite von den Zahlen nur „Gemessen“, also
  keinen Trend, kein Tempo und keine Tempo-Stufe. Der Graph zeigt nur die
  Messpunkte, ohne Trendlinie und ohne hervorgehobene Ausreißer.

#### Nach einer Lücke

Direkt nach einer Lücke beruht der Trend noch vor allem auf den Messungen vor
der Lücke und sagt wenig über die Zeit danach. Deshalb zeigt die Seite in
dieser Phase (1 bis 4 Messungen nach der Lücke) kein Urteil, sondern einen
einfachen Vergleich:

> Median der zählenden Messungen nach der Lücke
> minus
> Trend am letzten Tag vor der Lücke

Beispiel für die Überschrift: „Nach 9 Tagen ohne Messung: +1,0 kg gegenüber
vorher“.

Ob dieser Unterschied größer ist als die normale Schwankung, entscheidet die
Grenze **2 · s / √n**:

- **s** ist die übliche Schwankung vor der Lücke: Man nimmt die zählenden
  Messungen der 4 Wochen bis zum letzten Tag vor der Lücke (ohne Tage, die
  keinen Trend haben), bildet für jede den Abstand zum Trend ihres Tages, und
  zieht die Wurzel aus dem Mittelwert der quadrierten Abstände.
- **n** ist die Zahl der Messungen nach der Lücke. Je mehr Messungen es nach
  der Lücke gibt, desto enger wird die Grenze.

| Unterschied | Satz | Fläche |
|---|---|---|
| über +Grenze | „Deutlich mehr als die normale Schwankung.“ | Orange |
| unter −Grenze | „Deutlich mehr als die normale Schwankung.“ | neutral |
| dazwischen | „Im Rahmen der normalen Schwankung.“ | neutral |

Danach folgt immer der Satz „Ein Urteil gibt es wieder ab der 5. Messung nach
der Lücke.“ Ab der 5. Messung nach der Lücke erscheint wieder das Urteil.

#### Das Urteil

##### Wann ein Tag einen fallenden Trend hat

Ein Tag hat einen **fallenden Trend**, wenn beides gilt:

- seine Steigung liegt unter −0,2 kg pro Woche, **und**
- sein 4-Tage-Tempo liegt unter −0,2 kg pro Woche. Hat er kein 4-Tage-Tempo,
  entscheidet die Steigung allein.

Warum beides? Die Steigung umfasst 14 Tage und ist deshalb ruhig. Nach einer
Umkehr zeigt sie aber noch etwa eine Woche lang das frühere Abnehmen an. Das
4-Tage-Tempo erkennt die Umkehr früher. Erst wenn beide fallen, gilt der Trend
als fallend.

##### Die Zahl N: Tage ohne Abnehmen

Gezählt wird ab dem **ersten gezählten Tag**. Das ist der Tag der allerersten
zählenden Messung oder, wenn es eine Lücke gab, der erste Tag nach der letzten
Lücke. Die Zeit davor wurde bereits durch den Vergleich nach der Lücke
beurteilt.

- **Gab es seit dem ersten gezählten Tag einen Tag mit fallendem Trend:** N ist
  die Zahl der Tage vom letzten dieser Tage bis zum letzten Tag. Der Satz
  „Zuletzt abgenommen bis T.M.“ nennt diesen Tag.
- **Gab es keinen:** N ist die Zahl der Tage vom ersten gezählten Tag bis zum
  letzten Tag. Die Seite schreibt dann „mindestens“, weil unbekannt ist, wann
  das Abnehmen tatsächlich aufgehört hat.

Aus N ergibt sich eine **Stufe**, die die Farbe bestimmt:

| N | Stufe |
|---|---|
| unter 7 Tage (auch unter 3) | 1 |
| 7 bis 13 Tage | 2 |
| ab 14 Tagen | 3 |

##### Welches Urteil

Die Seite prüft der Reihe nach:

1. **„Nimmt zu“**, wenn das 4-Tage-Tempo des letzten Tages über +1,0 kg pro
   Woche liegt. Das gilt sofort, ohne die Wartezeit von 3 Tagen aus Punkt 2,
   und verschwindet wieder, sobald das 4-Tage-Tempo nicht mehr darüber liegt.
   Der Satz darunter hängt von N ab:
   - N ab 3: „Seit N Tagen kein Abnehmen, zuletzt abgenommen bis T.M.“
   - N unter 3: „Zuletzt abgenommen bis T.M.“
   - kein Tag mit fallendem Trend: „Seit mindestens N Tagen kein Abnehmen“
2. **„Nimmt ab“**, wenn es einen Tag mit fallendem Trend gibt und N unter 3
   liegt. Das schließt den Fall ein, dass der Trend am letzten Tag selbst
   fällt. Die Wartezeit von 3 Tagen verhindert, dass ein kurzer Knick in der
   Kurve sofort eine Warnung auslöst.
3. Sonst:
   - **„Seit N Tagen kein Abnehmen“** mit dem Satz „Zuletzt abgenommen bis
     T.M.“, wenn es einen Tag mit fallendem Trend gab (N ist dann mindestens
     3), oder
   - **„Seit mindestens N Tagen kein Abnehmen“** ohne Satz, wenn es seit dem
     ersten gezählten Tag keinen Tag mit fallendem Trend gab.

#### Die Tempo-Stufe („Ampel“)

Gibt es ein Tempo 4 Wochen, steht unter der Überschrift eine von drei Stufen:

| Tempo 4 Wochen | Ampel |
|---|---|
| unter −0,2 kg pro Woche | „4 Wochen: nimmt ab“ |
| −0,2 bis +0,2 kg pro Woche, beide Grenzen eingeschlossen | „4 Wochen: stagniert“ |
| über +0,2 kg pro Woche | „4 Wochen: nimmt zu“ |

Maßgeblich ist das gerundete Tempo, also genau die Zahl, die auf der Seite
steht. Weil die Ampel 4 Wochen umfasst, kann sie nach einer Umkehr noch eine
Weile „nimmt ab“ zeigen, auch wenn die Überschrift schon „Nimmt zu“ lautet.

#### Die Zahlen und der Graph

- **Trend:** der Trend des letzten Tages, mit einer Nachkommastelle.
- **Gemessen:** die zählende Messung des letzten Tages, mit einer
  Nachkommastelle.
- **Tempo 4 Wochen:** das Tempo mit Vorzeichen und zwei Nachkommastellen.
- **Letzte Messung:** die neueste Messung überhaupt, mit Uhrzeit, auch wenn
  sie nicht zählt.
- **Graph:** heute und die 41 Tage davor (6 Wochen). Die zählenden Messungen
  erscheinen als Punkte, Ausreißer gekennzeichnet. Der Trend jedes Tages
  erscheint als Linie, die an jeder Lücke unterbrochen ist. Messungen vor
  diesen 6 Wochen fließen trotzdem in den Trend ein.

#### Die Farben

Die Fläche hinter Überschrift und Zahlen färbt sich nach der Einschätzung:

| Einschätzung | Fläche |
|---|---|
| „Nimmt ab“ | Blau |
| „Seit (mindestens) N Tagen kein Abnehmen“ oder „Nimmt zu“, Stufe 1 | helles Orange |
| dasselbe, Stufe 2 | Orange |
| dasselbe, Stufe 3 | dunkles Braunorange mit heller Schrift |
| Vergleich nach einer Lücke, Unterschied über +Grenze | Orange wie bei Stufe 2 |
| alles andere | neutrales Grau |

Bei „Seit (mindestens) N Tagen kein Abnehmen“ wird die Überschrift mit jeder
Stufe fetter und auf Stufe 3 zusätzlich breiter. „Nimmt zu“ ist in derselben
Schrift gesetzt wie „Nimmt ab“.

#### Ein Beispiel

Die Testdaten `src/test/fixtures/gewicht-2026-07-bis-10.csv` reichen bis zum
18.10.2026 (98,4 kg). Der Trend steigt ab dem 11.10. wieder.

| Tag | Was passiert | Überschrift |
|---|---|---|
| 10.10. | letzter Tag mit fallendem Trend | |
| 11.10. und 12.10. | Das 4-Tage-Tempo fällt nicht mehr, aber N liegt noch unter 3. | am 12.10. noch „Nimmt ab“ |
| 13.10. | N = 3 | „Seit 3 Tagen kein Abnehmen“, Satz: „Zuletzt abgenommen bis 10.10.“ |
| 17.10. | Das 4-Tage-Tempo liegt bei etwa +1,5 kg pro Woche, also über +1,0. | „Nimmt zu“, Satz: „Seit 7 Tagen kein Abnehmen, zuletzt abgenommen bis 10.10.“ |

Die Ampel zeigt am 18.10. noch „4 Wochen: nimmt ab“, weil das Tempo über
4 Wochen −0,28 kg pro Woche beträgt.
