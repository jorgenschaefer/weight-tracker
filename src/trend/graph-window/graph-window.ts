import {
  type CalendarDay,
  calendarDayBefore,
} from "@/measurement/calendar-day";

/** „Zeitraum“: how much the graph shows at once. */
export type Span = "sixWeeks" | "threeMonths" | "oneYear";

/** The first and the last day the graph shows, both included. */
export interface GraphWindow {
  firstDay: CalendarDay;
  lastDay: CalendarDay;
}

/**
 * The window of `span` up to `today`: for „6 Wochen“ the 42 days ending with
 * it, for „3 Monate“ its month and the two before, whole, and for „1 Jahr“
 * its calendar year.
 */
export function windowUpTo(span: Span, today: CalendarDay): GraphWindow {
  switch (span) {
    case "sixWeeks":
      return { firstDay: calendarDayBefore(today, 41), lastDay: today };
    case "threeMonths": {
      const [year, month] = yearAndMonth(today);
      return {
        firstDay: dayOfMonth(year, month - 2, 1),
        lastDay: dayOfMonth(year, month + 1, 0),
      };
    }
    case "oneYear": {
      const [year] = yearAndMonth(today);
      return {
        firstDay: dayOfMonth(year, 0, 1),
        lastDay: dayOfMonth(year, 11, 31),
      };
    }
  }
}

/** The year of `day` and its month, January 0. */
function yearAndMonth(day: CalendarDay): [number, number] {
  return [Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1];
}

/**
 * Day `date` of `month` (January 0) in `year`; a month or date past either
 * end counts on into the next or back into the one before, so date 0 is the
 * last day of the month before.
 */
function dayOfMonth(year: number, month: number, date: number): CalendarDay {
  // Safe: an ISO date in UTC starts with its `YYYY-MM-DD`.
  return new Date(Date.UTC(year, month, date))
    .toISOString()
    .slice(0, 10) as CalendarDay;
}
