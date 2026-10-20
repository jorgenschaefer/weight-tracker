import { daysBetween } from "@/measurement/calendar-day";
import type { Trend } from "@/trend/trend";
import { lossCertainty, trafficLight } from "./traffic-light";

/**
 * The Satz zum Morgen of a day with a counting measurement, one per line of
 * the list it is the first that applies of:
 *
 * 1. `gainStopped` „Die Zunahme ist gestoppt. Ob du abnimmst, ist noch offen.“
 * 2. `lossSlowing` „Achtung, die Abnahme wird langsamer.“
 * 3. `losingAgain` „Du nimmst wieder ab.“
 * 4. `gainingAgain` „Achtung, du nimmst wieder zu.“
 * 5. `outlier` „Ausreißer, der Trend bleibt.“
 * 6. `lightMorning` „Leichter Morgen, aber ein Tag ändert den Trend noch nicht.“
 * 7. `twoHeavierMornings` „Zwei schwerere Morgen: Du nimmst noch ab, aber langsamer.“
 * 8. `losingForDays` „Du nimmst seit N Tagen ab.“, `losingForWeeks` „Du nimmst seit Wochen ab.“
 * 9. `probablyLosing` „Es geht wahrscheinlich abwärts, noch nicht sicher.“
 * 10. `open` „Ob du abnimmst, ist noch offen.“
 * 11. `gainingForDays` „Du nimmst seit N Tagen zu.“, `gainingForWeeks` „Du nimmst seit Wochen zu.“
 */
export type MorningSentence =
  | { kind: "gainStopped" }
  | { kind: "lossSlowing" }
  | { kind: "losingAgain" }
  | { kind: "gainingAgain" }
  | { kind: "outlier" }
  | { kind: "lightMorning" }
  | { kind: "twoHeavierMornings" }
  | { kind: "losingForDays"; days: number }
  | { kind: "losingForWeeks" }
  | { kind: "probablyLosing" }
  | { kind: "open" }
  | { kind: "gainingForDays"; days: number }
  | { kind: "gainingForWeeks" };

/**
 * The Satz zum Morgen of the last day of `trends` (ordered by day), from all
 * the days up to it - „seit N Tagen“ reaches back to the first day of its
 * colour in a row; there must be one. „Yesterday“ is the day before it with a
 * measurement; on the first day, its Ampel counts as unchanged.
 */
export function morningSentence(trends: Trend[]): MorningSentence {
  if (trends.length === 0) {
    throw new Error(
      "morningSentence needs the trend of at least one day; without a counting measurement there is no Satz zum Morgen",
    );
  }
  const today = trends[trends.length - 1];
  const yesterday = trends.length > 1 ? trends[trends.length - 2] : today;
  const light = trafficLight(today);
  const lightYesterday = trafficLight(yesterday);
  if (lightYesterday === "red" && light === "yellow") {
    return { kind: "gainStopped" };
  }
  if (lightYesterday === "green" && light === "yellow") {
    return { kind: "lossSlowing" };
  }
  if (light === "green" && lightYesterday !== "green") {
    return { kind: "losingAgain" };
  }
  if (light === "red" && lightYesterday !== "red") {
    return { kind: "gainingAgain" };
  }
  if (light === "green" && today.z > OUTLIER_Z) return { kind: "outlier" };
  if (light === "red" && today.z < -OUTLIER_Z) return { kind: "lightMorning" };
  if (light === "green" && today.z > HEAVIER_Z && yesterday.z > HEAVIER_Z) {
    return { kind: "twoHeavierMornings" };
  }
  switch (light) {
    case "green": {
      const days = daysOf(light, trends);
      return days >= WEEKS_FROM_DAYS
        ? { kind: "losingForWeeks" }
        : { kind: "losingForDays", days };
    }
    case "yellow":
      return lossCertainty(today) >= EVEN_CHANCE
        ? { kind: "probablyLosing" }
        : { kind: "open" };
    case "red": {
      const days = daysOf(light, trends);
      return days >= WEEKS_FROM_DAYS
        ? { kind: "gainingForWeeks" }
        : { kind: "gainingForDays", days };
    }
  }
}

/** How many standard deviations off a morning is an Ausreißer. */
const OUTLIER_Z = 2;
/** How many standard deviations heavier a morning counts as heavier. */
const HEAVIER_Z = 1;
/** From this many days of green or red on, they have held for weeks. */
const WEEKS_FROM_DAYS = 14;
/** From this {@link lossCertainty} on, a loss is probable. */
const EVEN_CHANCE = 0.5;

/**
 * The calendar days from the first of the days in a row with measurement
 * whose Ampel is `light`, up to the last of `trends`, both counted.
 */
function daysOf(light: "green" | "red", trends: Trend[]): number {
  const before = trends.findLastIndex((trend) => trafficLight(trend) !== light);
  const first = trends[before + 1];
  return daysBetween(first.day, trends[trends.length - 1].day) + 1;
}
