# Kalman-Filter an der eigenen Historie

Die Auswertung hinter `changes/backlog/einschaetzung-mit-kalman.md`. Jeder
Tag sieht nur die Messungen bis zu diesem Morgen, wie die Seite. Die Daten
(`~/Projects/patientenakte-jorgen/unterlagen/gewicht.csv`) bleiben außerhalb
des Repos und werden übergeben:

```sh
C=~/Projects/patientenakte-jorgen/unterlagen/gewicht.csv
python3 -I kalman.py fit       $C   # Rauschparameter an den Daten schätzen
python3 -I kalman.py grid      $C   # Einstellungen der Ampel vergleichen
python3 -I kalman.py days      $C 2026-10-01 2026-10-20   # was der Filter an jedem Tag sagt
python3 -I kalman.py smoothers $C   # sieben Glättungen gegen einen rückblickenden Verlauf
```

Die gewählte Einstellung steht oben in `kalman.py`. Maßstab für `grid` und
`smoothers` ist eine lokale Regression über ±14 Tage, also selbst eine
Glättung; Verfahren, die ihr ähneln, schneiden dadurch etwas besser ab.

`days` gibt je Tag das geschätzte Gewicht, das Tempo und die kcal pro Tag mit
Unsicherheit, die Wahrscheinlichkeit nennenswerter Abnahme (unter
−0,1 kg/Woche) und die, im Plan zu sein (unter −0,5 kg/Woche), wie weit die
Messung von der Erwartung abweicht, und die Ampel. Das sind die Größen, aus
denen die Sätze zum Morgen entstehen sollen.
