/**
 * German formatting of the numbers and dates on the page; days and times as
 * on a clock in Berlin, wherever the browser is.
 */

/** A weight in kg, with a decimal comma and one decimal: `98,6`. */
export function formatKg(kg: number): string {
  return KG.format(kg);
}

/** The Berlin day of `instant`, without the year: `5.8.`. */
export function formatDay(instant: Date): string {
  return DAY.format(instant);
}

/** The Berlin time of day of `instant`: `7:12`. */
export function formatTime(instant: Date): string {
  return TIME.format(instant);
}

const KG = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
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
