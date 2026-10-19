---
effort: L
utility: L
---

# Frühwarnung mit einer Stimme

Die Seite sagt nicht, wofür jede ihrer Angaben da ist, und kurzfristig spricht sie mit mehreren Stimmen.

Am 19.10.2026 stand dort „Nimmt zu“ und darunter „Seit 9 Tagen kein Abnehmen“. Die zweite Zeile liest sich wie ein eigenes Urteil, weil sie an anderen Tagen eins ist - welches gilt: zunehmen oder nur nicht abnehmen? Und der deutliche Rückgang an diesem Morgen (97,0 kg gegen einen Trend von 98,3 kg) bekam kein Wort. Dass „4 Wochen: nimmt ab“ den kurzfristigen Angaben widersprechen kann, ist dagegen verständlich.

Gewünscht: man sieht zwei Dinge und weiß, wofür jedes da ist.

1. Eine langfristige Sicht. Sie liegt nahe an der Wahrheit, und man weiß, dass sie langsam reagiert.
2. Eine Frühwarnung für eine mögliche Änderung des Trends. Sie spricht mit einer Stimme: eine Botschaft, die die jüngste Richtung und einen Morgen, der deutlich davon abweicht, zusammenhält und als Ermutigung oder Warnung endet.

Für den 19.10. etwa: „4-Wochen-Trend: Nimmt ab. Aktuell nimmst du eher zu, aber heute hast du wieder gut Gewicht verloren – weiter so!“ Umgekehrt endet ein deutlicher Sprung nach oben während eines fallenden Trends mit „Vorsicht“. Das gilt unabhängig vom Urteil: auch ein deutlicher Rückgang an einem „Nimmt ab“-Tag bekommt ein ermutigendes Wort.

Die Messungen bis zum 19.10., ein Tag nach dem anderen: 97,7 96,8 97,6 97,8 97,5 97,3 99,7 98,1 97,4 97,1 98,3 98,6 98,4 97,0. Der Trend (`trends`, `src/trend/trend.ts`) ist so gebaut, dass ein einzelner Tag ihn kaum bewegt: 98,4 → 98,3, die 97,0 ist ein Ausreißer (`src/trend/outlier.ts`). Das 4-Tage-Tempo des Trends lag bei +1,6 kg pro Woche, über der Grenze von +1,0 für „Nimmt zu“ (`trendVerdict`, `src/verdict/verdict.ts`). Unter „Nimmt zu“ setzt `gainingExplanation` (`src/app/Verdict.tsx`) die Tage ohne Abnehmen, die sonst die Überschrift wären.

Offen: was „deutlich abweicht“ heißt - die Idee war die Standardabweichung; die Seite kennt schon die 0,9 kg des Ausreißers. Und ob Zahlen und Graph etwas brauchen, damit die zwei Rollen klar sind.

Verwandt: `hauptseite-abwaegen.md` wägt jede Angabe der Hauptseite ab; `nimmt-zu-nach-luecke.md` wurde belassen, um es mit den übrigen Signalen zu klären.
