import { type CalendarDay, daysBetween } from "@/measurement/calendar-day";
import type { MorningDeviation } from "@/trend/outlier";
import { formatCalendarDay, formatKg } from "./format";
import classes from "./MorningDeviation.module.css";
import type { SurfaceColours } from "./Verdict";

/**
 * The card of the morning's `deviation`, in the inverted `colours` of the
 * surface: the day as seen from `today`, how far over or under the trend,
 * and what to make of it.
 */
export function MorningDeviationCard({
  deviation,
  today,
  colours,
}: {
  deviation: MorningDeviation;
  today: CalendarDay;
  colours: SurfaceColours;
}) {
  const above = deviation.differenceKg > 0;
  return (
    <div
      className={classes.card}
      style={{ backgroundColor: colours.ink, color: colours.surface }}
    >
      <p className={classes.distance}>
        {`${dayName(deviation.day, today)} · ${formatKg(Math.abs(deviation.differenceKg))} kg ${above ? "über" : "unter"} dem Trend`}
      </p>
      <p className={classes.message}>
        {above
          ? "Hoffentlich ein Ausreißer – gestern viel gegessen? Vorsicht!"
          : "Vielleicht ein Ausreißer, vielleicht die Wende. Weiter so!"}
      </p>
    </div>
  );
}

/** „Heute“, „Gestern“, or „Am 12.10.“. */
function dayName(day: CalendarDay, today: CalendarDay): string {
  switch (daysBetween(day, today)) {
    case 0:
      return "Heute";
    case 1:
      return "Gestern";
    default:
      return `Am ${formatCalendarDay(day)}`;
  }
}
