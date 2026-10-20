/**
 * German formatting of the numbers and dates on the page; days and times as
 * on a clock in Berlin, wherever the browser is.
 */

import type { CalendarDay } from "@/measurement/calendar-day";
import type { GraphWindow, Span } from "@/trend/graph-window/graph-window";

/** A weight in kg, with a decimal comma and one decimal: `98,6`. */
export function formatKg(kg: number): string {
  return KG.format(kg);
}

/** A pace in kg per week, signed, with two decimals: `−0,42`, `±0,00`. */
export function formatPace(kgPerWeek: number): string {
  return signed(kgPerWeek, PACE);
}

/**
 * Whether {@link formatPace} shows `kgPerWeek` as `±0,00`: a pace too small
 * to show a sign.
 */
export function isPaceShownAsZero(kgPerWeek: number): boolean {
  return roundsToZero(kgPerWeek, PACE);
}

/** The standard deviation of a pace in kg per week, with two decimals: `0,29`. */
export function formatPaceDeviation(kgPerWeek: number): string {
  return PACE.format(kgPerWeek);
}

/** The Berlin day of `instant`, without the year: `5.8.`. */
export function formatDay(instant: Date): string {
  return DAY.format(instant);
}

/** A calendar day, without the year: `5.8.`. */
export function formatCalendarDay(day: CalendarDay): string {
  // Noon UTC falls on the same day in Berlin, in summer and in winter.
  return formatDay(new Date(`${day}T12:00:00Z`));
}

/** The month of a calendar day, short: `Jan`, `Mär`, `Sep`. */
export function formatMonth(day: CalendarDay): string {
  // Noon UTC falls on the same day in Berlin, in summer and in winter.
  return MONTH.format(new Date(`${day}T12:00:00Z`));
}

/** The name of `span`: `6 Wochen`, `3 Monate`, `1 Jahr`. */
export function formatSpan(span: Span): string {
  switch (span) {
    case "sixWeeks":
      return "6 Wochen";
    case "threeMonths":
      return "3 Monate";
    case "oneYear":
      return "1 Jahr";
  }
}

/**
 * The range of a window of `span` beside ‹ ›: for „6 Wochen“ „Bis heute“ up
 * to `today`, otherwise its first and last day, `8.9.26 – 19.10.26`; for
 * „3 Monate“ its first and last month, `Aug – Okt 2026`, each with its year
 * where they differ; for „1 Jahr“ its year.
 */
export function formatRange(
  span: Span,
  graphWindow: GraphWindow,
  today: CalendarDay,
): string {
  const { firstDay, lastDay } = graphWindow;
  const firstYear = firstDay.slice(0, 4);
  const lastYear = lastDay.slice(0, 4);
  switch (span) {
    case "sixWeeks":
      if (lastDay === today) return "Bis heute";
      return `${formatDayWithYear(firstDay)} – ${formatDayWithYear(lastDay)}`;
    case "threeMonths":
      if (firstYear === lastYear)
        return `${formatMonth(firstDay)} – ${formatMonth(lastDay)} ${lastYear}`;
      return `${formatMonth(firstDay)} ${firstYear} – ${formatMonth(lastDay)} ${lastYear}`;
    case "oneYear":
      return firstYear;
  }
}

/** The Berlin time of day of `instant`: `7:12`. */
export function formatTime(instant: Date): string {
  return TIME.format(instant);
}

/** A calendar day with a two-digit year: `8.9.26`. */
function formatDayWithYear(day: CalendarDay): string {
  // Noon UTC falls on the same day in Berlin, in summer and in winter.
  return DAY_WITH_YEAR.format(new Date(`${day}T12:00:00Z`));
}

/**
 * `value` in `format`, after its sign: `+`, a minus sign `−` (not the
 * hyphen), or `±` where it rounds to zero.
 */
function signed(value: number, format: Intl.NumberFormat): string {
  const magnitude = format.format(Math.abs(value));
  if (roundsToZero(value, format)) return `±${magnitude}`;
  return `${value > 0 ? "+" : "−"}${magnitude}`;
}

/** Whether `value` in `format` comes out as zero. */
function roundsToZero(value: number, format: Intl.NumberFormat): boolean {
  return format.format(Math.abs(value)) === format.format(0);
}

const KG = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const PACE = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const DAY = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "numeric",
  month: "numeric",
});

const DAY_WITH_YEAR = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  day: "numeric",
  month: "numeric",
  year: "2-digit",
});

const MONTH = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  month: "short",
});

const TIME = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  hour: "numeric",
  minute: "2-digit",
});
