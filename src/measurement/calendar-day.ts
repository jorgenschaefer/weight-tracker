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
