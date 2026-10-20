---
criteria:  CRITERIA.md
closes:    AC-4, AC-5
advances:  
after:     
status:    ready
attempts:  0
---

## Build
Zeigt „Tempo“ `±0,00`, heißt die vierte Zahl „Bilanz“ und zeigt 0; sonst folgen „Defizit“ und „Überschuss“ dem Vorzeichen, das „Tempo“ zeigt.

## Done when
> **AC-4** Zeigt „Tempo“ `±0,00`, heißt die vierte Zahl „Bilanz“, und ihr Wert ist 0 mit ihrer Unsicherheit wie bisher, etwa „Bilanz 0 ± 560 kcal/Tag“ am 3.7. der Testdaten. „Defizit“ und „Überschuss“ stehen dann nicht auf der Seite; das gilt auch bei einem Tempo von genau 0.

> **AC-5** Zeigt „Tempo“ ein Minus, heißt die vierte Zahl „Defizit“, zeigt es ein Plus, „Überschuss“. Ihr Wert und ihre Unsicherheit bleiben, wie sie heute sind.

## Technical decisions
> **Stored formats** keine. Was der Skill auf `walk.localhost` speichert, liegt dort unter denselben Schlüsseln; `walk:fixture` muss dort einmal neu gespeichert werden.

> **Wire formats** keine. `walkOn`, `standIn` und `standInReopen` behalten Namen und Optionen.

> **Trust boundaries** keine. Auf `walk.localhost` geht keine echte Anmeldung bei Google; der Skill braucht keine.

> **Dependencies** keine.

## Nudges
> Ob „Tempo“ auf 0 rundet, entscheidet eine Stelle in `src/app/format.ts`, dieselbe Prüfung, mit der `signed` `±` setzt. Bezeichnung und Wert der vierten Zahl nehmen sie von dort; `kcalPerDay` in `src/trend/pace.ts` bleibt, wie es ist.

> Der Eintrag „Tempo“ in `UBIQUITOUS_LANGUAGE.md` nennt „Bilanz“ für ein Tempo, das als `±0,00` erscheint.

> Der Test „say „Überschuss“ at a pace of 0“ in `src/app/Verdict.test.tsx` wird zu „Bilanz“; AC-4 bekommt einen Fall knapp unter und knapp über 0.

## Context
`Figures` in `src/app/Verdict.tsx` wählt heute „Defizit“ oder „Überschuss“ mit `trend.pace < 0` am ungerundeten Tempo, den Wert mit `kcalPerDay` (`src/trend/pace.ts`, gerundet auf zehn kcal). „Tempo“ zeigt `formatPace` aus `src/app/format.ts`, dessen `signed` `±` setzt, wo der Betrag auf zwei Stellen 0 ergibt. So steht am 3.7. der Testdaten „Defizit 0“ neben „±0,00“, und ein Tempo knapp unter 0,005 kg/Wo ergibt „±0,00“ neben 10 kcal.

Vereinbart ist dieses Aussehen:

```
Tempo     ±0,00 ± 0,51 kg/Wo      Tempo     −0,46 ± 0,29 kg/Wo
Bilanz    0 ± 560 kcal/Tag        Defizit   510 ± 320 kcal/Tag
```

## Not here
Den run-Skill baut 01.

## Left standing
