import { UnstyledButton } from "@mantine/core";
import type { Span } from "@/trend/graph-window/graph-window";
import { formatSpan } from "./format";
import classes from "./SpanToggle.module.css";
import type { SurfaceColours } from "./Verdict";

/**
 * The toggle above the graph: „6 Wochen“, „3 Monate“ and „1 Jahr“, `span`
 * filled in the surface's text colour, `colours.ink`. A tap reports its span
 * to `onChoose`.
 */
export function SpanToggle({
  span,
  colours,
  onChoose,
}: {
  span: Span;
  colours: SurfaceColours;
  onChoose: (span: Span) => void;
}) {
  return (
    <fieldset aria-label="Zeitraum" className={classes.toggle}>
      {SPANS.map((value) => (
        <UnstyledButton
          key={value}
          className={classes.option}
          aria-pressed={value === span}
          style={
            value === span
              ? { backgroundColor: colours.ink, color: colours.surface }
              : undefined
          }
          onClick={() => onChoose(value)}
        >
          {formatSpan(value)}
        </UnstyledButton>
      ))}
    </fieldset>
  );
}

const SPANS: Span[] = ["sixWeeks", "threeMonths", "oneYear"];
