import { UnstyledButton } from "@mantine/core";
import classes from "./WindowBar.module.css";

/**
 * The row under the toggle of the span: the `range` of the window the graph
 * shows, and ‹ › for the window before and after it, each locked where its
 * handler is `null`. A locked arrow keeps the focus, as a `disabled` one
 * would drop it to the page at the end of every run of ‹ or ›.
 */
export function WindowBar({
  range,
  onEarlier,
  onLater,
}: {
  range: string;
  onEarlier: (() => void) | null;
  onLater: (() => void) | null;
}) {
  return (
    <div className={classes.bar}>
      {/* A screen reader says the range ‹ or › moved to. */}
      <span className={classes.range} role="status" aria-live="polite">
        {range}
      </span>
      <span className={classes.arrows}>
        <UnstyledButton
          className={classes.arrow}
          aria-label="Früher"
          aria-disabled={onEarlier === null}
          onClick={onEarlier ?? undefined}
        >
          <span className={classes.glyph}>‹</span>
        </UnstyledButton>
        <UnstyledButton
          className={classes.arrow}
          aria-label="Später"
          aria-disabled={onLater === null}
          onClick={onLater ?? undefined}
        >
          <span className={classes.glyph}>›</span>
        </UnstyledButton>
      </span>
    </div>
  );
}
