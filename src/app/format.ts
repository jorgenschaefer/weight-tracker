/**
 * German formatting of the numbers and dates on the page; days and times as
 * on a clock in Berlin, wherever the browser is.
 */

import type { CalendarDay } from "@/measurement/calendar-day";

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

/** The Berlin time of day of `instant`: `7:12`. */
export function formatTime(instant: Date): string {
  return TIME.format(instant);
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

const MONTH = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  month: "short",
});

const TIME = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  hour: "numeric",
  minute: "2-digit",
});
