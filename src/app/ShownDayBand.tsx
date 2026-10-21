import { UnstyledButton, VisuallyHidden } from "@mantine/core";
import type { CalendarDay } from "@/measurement/calendar-day";
import { formatCalendarDaySeenFrom } from "./format";
import classes from "./ShownDayBand.module.css";
import type { SurfaceColours } from "./Verdict";

/**
 * The band in place of the status line and ⟳ while the page of an earlier
 * day, `shownDay`, is shown: „Stand <day>“, with the year where it is not the
 * year of `today`, in the surface's text colour, and
 * „Zurück zu heute“, which calls `onBackToToday`, telling it whether it
 * was pressed with the keyboard rather than tapped or clicked.
 */
export function ShownDayBand({
  shownDay,
  today,
  colours,
  onBackToToday,
}: {
  shownDay: CalendarDay;
  today: CalendarDay;
  colours: SurfaceColours;
  onBackToToday: (byKeyboard: boolean) => void;
}) {
  return (
    <div
      className={classes.band}
      style={{ backgroundColor: colours.ink, color: colours.surface }}
    >
      <span className={classes.day}>{shownDayLabel(shownDay, today)}</span>
      <UnstyledButton
        className={classes.back}
        style={{
          backgroundColor: colours.surface,
          borderColor: colours.ink,
          color: colours.ink,
        }}
        // A click from the keyboard counts no presses of a pointer.
        onClick={(event) => onBackToToday(event.detail === 0)}
      >
        Zurück zu heute
      </UnstyledButton>
    </div>
  );
}

/**
 * Says „Stand <day>“ to a screen reader whenever `shownDay` changes to an
 * earlier day. It stays on the page with or without one, as a live region
 * that only appears with its text is not reliably read out.
 */
export function ShownDayAnnouncement({
  shownDay,
  today,
}: {
  shownDay: CalendarDay | null;
  today: CalendarDay;
}) {
  return (
    <VisuallyHidden role="status" aria-live="polite">
      {shownDay === null ? "" : shownDayLabel(shownDay, today)}
    </VisuallyHidden>
  );
}

function shownDayLabel(day: CalendarDay, today: CalendarDay): string {
  return `Stand ${formatCalendarDaySeenFrom(day, today)}`;
}
