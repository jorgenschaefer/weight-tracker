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
 * The window of `span` up to `day`: for „6 Wochen“ the 42 days ending with
 * it, for „3 Monate“ its month and the two before, whole, and for „1 Jahr“
 * its calendar year. Up to today it is the window the page opens on.
 */
export function windowUpTo(span: Span, day: CalendarDay): GraphWindow {
  switch (span) {
    case "sixWeeks":
      return { firstDay: calendarDayBefore(day, 41), lastDay: day };
    case "threeMonths": {
      const [year, month] = yearAndMonth(day);
      return {
        firstDay: dayOfMonth(year, month - 2, 1),
        lastDay: dayOfMonth(year, month + 1, 0),
      };
    }
    case "oneYear": {
      const [year] = yearAndMonth(day);
      return {
        firstDay: dayOfMonth(year, 0, 1),
        lastDay: dayOfMonth(year, 11, 31),
      };
    }
  }
}

/** The window of `span` just before `graphWindow`, a whole span earlier. */
export function earlierWindow(
  span: Span,
  graphWindow: GraphWindow,
): GraphWindow {
  return windowUpTo(span, calendarDayBefore(graphWindow.firstDay, 1));
}

/**
 * The window of `span` just after `graphWindow`, a whole span later, while it
 * ends before today; `null`, the window up to today, where it would not.
 */
export function laterWindow(
  span: Span,
  graphWindow: GraphWindow,
  today: CalendarDay,
): GraphWindow | null {
  return beforeToday(
    windowUpTo(span, aSpanLater(span, graphWindow.lastDay)),
    today,
  );
}

/**
 * Whether there is a window before `graphWindow`: while it starts after
 * `firstDay`, the day of the first counting measurement.
 */
export function hasEarlierWindow(
  graphWindow: GraphWindow,
  firstDay: CalendarDay,
): boolean {
  // `YYYY-MM-DD` orders as text the way the days do.
  return firstDay < graphWindow.firstDay;
}

/** Whether there is a window after `graphWindow`: while it ends before today. */
export function hasLaterWindow(
  graphWindow: GraphWindow,
  today: CalendarDay,
): boolean {
  return beforeToday(graphWindow, today) !== null;
}

/**
 * The window of `span` on switching to it from `graphWindow`: up to the last
 * day of `graphWindow`, or today where that day lies after today; `null`, the
 * window up to today, where it reaches today.
 */
export function windowOnSwitch(
  span: Span,
  graphWindow: GraphWindow,
  today: CalendarDay,
): GraphWindow | null {
  // `YYYY-MM-DD` orders as text the way the days do.
  const lastDay = graphWindow.lastDay < today ? graphWindow.lastDay : today;
  return beforeToday(windowUpTo(span, lastDay), today);
}

/**
 * A day the window of `span` a whole span after the one up to `day` is up to:
 * 42 days later, in the third month after it, or in the year after it.
 */
function aSpanLater(span: Span, day: CalendarDay): CalendarDay {
  const [year, month] = yearAndMonth(day);
  switch (span) {
    case "sixWeeks":
      return dayOfMonth(year, month, Number(day.slice(8, 10)) + 42);
    case "threeMonths":
      return dayOfMonth(year, month + 3, 1);
    case "oneYear":
      return dayOfMonth(year + 1, 0, 1);
  }
}

/** `graphWindow` where it ends before today; `null` where it reaches it. */
function beforeToday(
  graphWindow: GraphWindow,
  today: CalendarDay,
): GraphWindow | null {
  // `YYYY-MM-DD` orders as text the way the days do.
  return graphWindow.lastDay < today ? graphWindow : null;
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
