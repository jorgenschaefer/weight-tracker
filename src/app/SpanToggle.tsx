import { UnstyledButton } from "@mantine/core";
import type { Span } from "@/trend/graph-window/graph-window";
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
      {SPANS.map(({ value, name }) => (
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
          {name}
        </UnstyledButton>
      ))}
    </fieldset>
  );
}

const SPANS: { value: Span; name: string }[] = [
  { value: "sixWeeks", name: "6 Wochen" },
  { value: "threeMonths", name: "3 Monate" },
  { value: "oneYear", name: "1 Jahr" },
];
