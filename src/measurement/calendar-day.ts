/** A calendar day in Europe/Berlin, written `YYYY-MM-DD`. */
export type CalendarDay = string & { readonly brand: "CalendarDay" };

/** The calendar day in Europe/Berlin on which `instant` falls. */
export function berlinDay(instant: Date): CalendarDay {
  const parts = BERLIN_DATE.formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value;
  // Safe: the format yields every one of these parts, zero-padded.
  return `${part("year")}-${part("month")}-${part("day")}` as CalendarDay;
}

/** How many days `to` lies after `from`; negative where it lies before. */
export function daysBetween(from: CalendarDay, to: CalendarDay): number {
  return (utcMidnight(to) - utcMidnight(from)) / MS_PER_DAY;
}

/** The day `days` days before `day`. */
export function calendarDayBefore(day: CalendarDay, days: number): CalendarDay {
  const midnight = new Date(utcMidnight(day) - days * MS_PER_DAY);
  // Safe: an ISO date in UTC starts with its `YYYY-MM-DD`.
  return midnight.toISOString().slice(0, 10) as CalendarDay;
}

/** The day `days` days after `day`. */
export function calendarDayAfter(day: CalendarDay, days: number): CalendarDay {
  return calendarDayBefore(day, -days);
}

/**
 * The year of `day` and its month, counted from January 0 like `Date.UTC`,
 * not from 01 like the `MM` of a `CalendarDay`: `2026-10-17` is `[2026, 9]`.
 */
export function yearAndMonth(day: CalendarDay): [number, number] {
  return [Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1];
}

/**
 * Day `date` of `month` in `year`, the month counted from January 0 like
 * `Date.UTC` and {@link yearAndMonth}, not from 01 like the `MM` of a
 * `CalendarDay`: `dayOfMonth(2026, 9, 17)` is `2026-10-17`. A month or date
 * past either end counts on into the next or back into the one before, so
 * date 0 is the last day of the month before.
 */
export function dayOfMonth(
  year: number,
  month: number,
  date: number,
): CalendarDay {
  // Safe: an ISO date in UTC starts with its `YYYY-MM-DD`.
  return new Date(Date.UTC(year, month, date))
    .toISOString()
    .slice(0, 10) as CalendarDay;
}

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Midnight UTC of `day`: a calendar day, free of Berlin's daylight saving. */
function utcMidnight(day: CalendarDay): number {
  return Date.parse(`${day}T00:00:00Z`);
}

const BERLIN_DATE = new Intl.DateTimeFormat("en-US", {
  timeZone: "Europe/Berlin",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
