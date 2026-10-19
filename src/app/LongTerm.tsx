import { kcalPerDay, type Pace, type PaceBand } from "@/trend/pace";
import { formatPace } from "./format";
import classes from "./LongTerm.module.css";

/**
 * „Langfristig · 4 Wochen“: the 28-day `pace` in its band, the calories a
 * day it stands for, and what this pace is like; nothing where there is no
 * pace.
 */
export function LongTerm({ pace }: { pace: Pace | null }) {
  if (pace === null) return null;
  const calories = calorieBracket(pace.kgPerWeek);
  return (
    <section className={classes.longTerm}>
      <h2 className={classes.heading}>Langfristig · 4 Wochen</h2>
      <p className={classes.pace}>
        {`${BAND_NAMES[pace.band]}, ${formatPace(pace.kgPerWeek)} kg pro Woche`}
        {calories !== null && (
          <>
            {" "}
            <span className={classes.calories}>{calories}</span>
          </>
        )}
      </p>
      <p className={classes.character}>
        Nah an der Wahrheit, reagiert langsam.
      </p>
    </section>
  );
}

const BAND_NAMES: Record<PaceBand, string> = {
  loss: "Nimmt ab",
  stagnation: "Stagniert",
  gain: "Nimmt zu",
};

/**
 * „(≈ 360 kcal Defizit pro Tag)“ by the sign of `kgPerWeek`, whatever its
 * band; none at a pace of 0.
 */
function calorieBracket(kgPerWeek: number): string | null {
  if (kgPerWeek === 0) return null;
  const kind = kgPerWeek < 0 ? "Defizit" : "Überschuss";
  return `(≈ ${kcalPerDay(kgPerWeek)} kcal ${kind} pro Tag)`;
}
