/**
 * German formatting of the numbers and dates on the page; days and times as
 * on a clock in Berlin, wherever the browser is.
 */

import type { CalendarDay } from "@/measurement/calendar-day";

/** A weight in kg, with a decimal comma and one decimal: `98,6`. */
export function formatKg(kg: number): string {
  return KG.format(kg);
}

/** A change of weight in kg, signed, with one decimal: `+1,0`, `−2,5`, `±0,0`. */
export function formatKgChange(kg: number): string {
  return signed(kg, KG);
}

/** A pace in kg per week, signed, with two decimals: `−0,42`, `±0,00`. */
export function formatPace(kgPerWeek: number): string {
  return signed(kgPerWeek, PACE);
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
  if (magnitude === format.format(0)) return `±${magnitude}`;
  return `${value > 0 ? "+" : "−"}${magnitude}`;
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

const TIME = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  hour: "numeric",
  minute: "2-digit",
});
