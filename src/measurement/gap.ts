import { type CalendarDay, daysBetween } from "./calendar-day";
import type { CountingMeasurement } from "./measurement";

/** Two consecutive days with a counting measurement more than 3 days apart. */
export interface Gap {
  lastDayBefore: CalendarDay;
  firstDayAfter: CalendarDay;
}

/** The gaps among `counting`, ordered by day as the measurements are. */
export function findGaps(counting: CountingMeasurement[]): Gap[] {
  return counting.slice(1).flatMap((after, i) => {
    const before = counting[i];
    if (daysBetween(before.day, after.day) <= MAX_DAYS_APART_WITHOUT_GAP) {
      return [];
    }
    return [{ lastDayBefore: before.day, firstDayAfter: after.day }];
  });
}

const MAX_DAYS_APART_WITHOUT_GAP = 3;
