"use client";

import { useElementSize } from "@mantine/hooks";
import { type Ref, useRef } from "react";
import {
  type CalendarDay,
  calendarDayBefore,
  dayOfMonth,
  daysBetween,
  yearAndMonth,
} from "@/measurement/calendar-day";
import type { GraphWindow, Span } from "@/trend/graph-window/graph-window";
import type { WindowSeries } from "@/trend/graph-window/window-series";
import type { Trend } from "@/trend/trend";
import { type TrafficLight, trafficLight } from "@/verdict/traffic-light";
import {
  formatCalendarDay,
  formatMonth,
  formatRange,
  formatSpan,
} from "./format";
import { TRAFFIC_LIGHT_LINE_COLOURS } from "./Verdict";
import classes from "./WeightGraph.module.css";

/**
 * The graph of `graphWindow` in `span`, as wide as the space it is given: the
 * counting measurements of `series` as points, the trend as a line inside a
 * band of ± its standard deviation, both broken at gaps. Each stretch of the
 * line from one day with a measurement to the next takes the colour of the
 * Ampel of the later day. Where the window reaches past `today`, a dashed
 * line marks it.
 * The rest is drawn in the text colour it inherits; where the window holds no
 * measurement, there is no weight to scale to, and it says so instead.
 *
 * It marks `shownDay`, an earlier day with a measurement, rimmed in
 * `surface`, the colour of the surface. A tap or a drag choose the day of the
 * window with a measurement nearest across and report it to `onChooseDay`,
 * which judges whether it is an earlier day; a second tap on the day shown and
 * Escape report `null`. ← and → choose the day of `measuredDays`, the days
 * with a counting measurement in every window, those of `series` among them,
 * next to it, inside the window or not, and report it to `onStepToDay`, which
 * judges the same. `ref` reaches the drawing, which takes the focus.
 */
export function WeightGraph({
  series,
  span,
  graphWindow,
  today,
  measuredDays,
  shownDay,
  onChooseDay,
  onStepToDay,
  surface,
  ref,
}: {
  series: WindowSeries;
  span: Span;
  graphWindow: GraphWindow;
  today: CalendarDay;
  measuredDays: CalendarDay[];
  shownDay: CalendarDay | null;
  onChooseDay: (day: CalendarDay | null) => void;
  onStepToDay: (day: CalendarDay) => void;
  surface: string;
  ref?: Ref<SVGSVGElement>;
}) {
  const { ref: sized, width } = useElementSize();
  if (series.measurements.length === 0) {
    return <p className={classes.empty}>Keine Messung in diesem Zeitraum</p>;
  }
  return (
    <div ref={sized}>
      {width > 0 && (
        <Drawing
          series={series}
          span={span}
          graphWindow={graphWindow}
          today={today}
          width={width}
          measuredDays={measuredDays}
          shownDay={shownDay}
          onChooseDay={onChooseDay}
          onStepToDay={onStepToDay}
          surface={surface}
          ref={ref}
        />
      )}
    </div>
  );
}

function Drawing({
  series,
  span,
  graphWindow,
  today,
  width,
  measuredDays,
  shownDay,
  onChooseDay,
  onStepToDay,
  surface,
  ref,
}: {
  series: WindowSeries;
  span: Span;
  graphWindow: GraphWindow;
  today: CalendarDay;
  width: number;
  measuredDays: CalendarDay[];
  shownDay: CalendarDay | null;
  onChooseDay: (day: CalendarDay | null) => void;
  onStepToDay: (day: CalendarDay) => void;
  surface: string;
  ref?: Ref<SVGSVGElement>;
}) {
  const layout = width < WIDE_FROM_WIDTH ? COMPACT : WIDE;
  const scale = chartScale(series, span, graphWindow, width, layout);
  const choice = useDayChoice(
    series,
    measuredDays,
    scale,
    shownDay,
    onChooseDay,
    onStepToDay,
  );
  const shown = series.measurements.find(
    ({ measurement }) => measurement.day === shownDay,
  );
  return (
    <svg
      ref={ref}
      className={classes.drawing}
      width={width}
      height={layout.height}
      role="img"
      aria-label={`Messungen und Trend, ${formatSpan(span)}, ${formatRange(span, graphWindow, today)}`}
      // A picture still, though it takes ← and → to choose a day: the band
      // above says which one is shown.
      // biome-ignore lint/a11y/noNoninteractiveTabindex: see above
      tabIndex={0}
      {...choice}
    >
      {scale.labelledKilos.map((kg) => (
        <g key={kg}>
          <line
            x1={layout.left}
            x2={width - layout.right}
            y1={scale.y(kg)}
            y2={scale.y(kg)}
            stroke="currentColor"
            strokeOpacity={0.2}
          />
          <text
            x={layout.left - layout.labelGap}
            y={scale.y(kg) + 4}
            fill="currentColor"
            fillOpacity={0.8}
            fontSize={layout.fontSize}
            textAnchor="end"
          >
            {kg}
          </text>
        </g>
      ))}
      {scale.timeLabels.map(({ day, text }) => (
        <text
          key={day}
          x={scale.x(day)}
          y={layout.height - layout.labelGap}
          fill="currentColor"
          fillOpacity={0.8}
          fontSize={layout.fontSize}
          textAnchor="middle"
        >
          {text}
        </text>
      ))}
      {/* `YYYY-MM-DD` orders as text the way the days do. */}
      {today < graphWindow.lastDay && (
        <line
          x1={scale.x(today) + TODAY_LINE_OFFSET}
          x2={scale.x(today) + TODAY_LINE_OFFSET}
          y1={layout.top}
          y2={layout.height - layout.bottom}
          stroke="currentColor"
          strokeOpacity={0.35}
          strokeDasharray="3 3"
        />
      )}
      {series.trendLine.map((piece) => (
        <polygon
          key={piece[0].day}
          points={bandCorners(piece, scale).join(" ")}
          fill="currentColor"
          fillOpacity={0.16}
        />
      ))}
      {series.measurements.map(({ measurement, outlier, latest }) => (
        <Point
          key={measurement.day}
          cx={scale.x(measurement.day)}
          cy={scale.y(measurement.kg)}
          radius={layout.radius[span]}
          mark={mark(latest, outlier)}
        />
      ))}
      {series.trendLine.flatMap(sameLightRuns).map(({ light, trends }) => (
        <polyline
          key={trends.at(-1)?.day}
          points={trendCorners(trends, scale).join(" ")}
          fill="none"
          stroke={TRAFFIC_LIGHT_LINE_COLOURS[light]}
          strokeWidth={LINE_WIDTH}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
      {shown !== undefined && (
        <ShownDayMark
          x={scale.x(shown.measurement.day)}
          y={scale.y(shown.measurement.kg)}
          outlier={shown.outlier}
          radius={layout.shownRadius}
          rule={[layout.top, layout.height - layout.bottom]}
          surface={surface}
        />
      )}
    </svg>
  );
}

/** The width of the trend line, in px. */
const LINE_WIDTH = 3;

/**
 * The line for today stands this far right of today's point, in px, so it
 * does not cut through it.
 */
const TODAY_LINE_OFFSET = 3;

/** The two arrangements of the specimens: a phone's and a wide screen's. */
interface Layout {
  height: number;
  /** The margins around the area the days and weights span. */
  left: number;
  right: number;
  top: number;
  bottom: number;
  fontSize: number;
  /** From a label to the line or edge it belongs to. */
  labelGap: number;
  /** Above this many kilos from the lowest to the highest, every other one. */
  everyOtherKiloAbove: number;
  /** In „6 Wochen“. */
  daysPerLabel: number;
  /** In „1 Jahr“; in „3 Monate“ each month has its label. */
  monthsPerLabelInAYear: number;
  /**
   * The radius of each mark in each span, smaller the more days it shows:
   * the latest is largest; an outlier's ring is 1 px smaller, so its 2 px
   * stroke reaches only as far.
   */
  radius: Record<Span, MarkRadius>;
  /** The radius of the day shown, in every span: larger than any other. */
  shownRadius: number;
}

const COMPACT: Layout = {
  height: 190,
  left: 30,
  right: 6,
  top: 8,
  bottom: 24,
  fontSize: 11,
  labelGap: 6,
  everyOtherKiloAbove: 5,
  daysPerLabel: 10,
  monthsPerLabelInAYear: 2,
  radius: {
    sixWeeks: { counting: 3.5, outlier: 4.5, latest: 5.5 },
    threeMonths: { counting: 2.4, outlier: 3, latest: 4 },
    oneYear: { counting: 1.6, outlier: 2, latest: 3 },
  },
  shownRadius: 7,
};

/** The narrowest drawing in the wide layout. */
const WIDE_FROM_WIDTH = 600;

const WIDE: Layout = {
  height: 380,
  left: 36,
  right: 8,
  top: 10,
  bottom: 28,
  fontSize: 12,
  labelGap: 8,
  everyOtherKiloAbove: Number.POSITIVE_INFINITY,
  daysPerLabel: 7,
  monthsPerLabelInAYear: 1,
  radius: {
    sixWeeks: { counting: 4.5, outlier: 5.5, latest: 6.5 },
    threeMonths: { counting: 3.4, outlier: 4, latest: 5 },
    oneYear: { counting: 2.6, outlier: 3, latest: 4 },
  },
  shownRadius: 8,
};

type Mark = "counting" | "outlier" | "latest" | "latestOutlier";

/** The radius of each mark but the latest outlier, which is the latest's. */
type MarkRadius = Record<Exclude<Mark, "latestOutlier">, number>;

/**
 * The last day's measurement of all is the largest mark, hollow where it is
 * an outlier.
 */
function mark(latest: boolean, outlier: boolean): Mark {
  if (latest) return outlier ? "latestOutlier" : "latest";
  return outlier ? "outlier" : "counting";
}

function Point({
  cx,
  cy,
  mark,
  radius,
}: {
  cx: number;
  cy: number;
  mark: Mark;
  radius: MarkRadius;
}) {
  switch (mark) {
    case "counting":
      return (
        <circle
          cx={cx}
          cy={cy}
          r={radius.counting}
          fill="currentColor"
          fillOpacity={0.38}
        />
      );
    case "outlier":
      return <Ring cx={cx} cy={cy} r={radius.outlier} />;
    case "latest":
      return <circle cx={cx} cy={cy} r={radius.latest} fill="currentColor" />;
    case "latestOutlier":
      return <Ring cx={cx} cy={cy} r={radius.latest} />;
  }
}

/** An outlier's hollow ring. */
function Ring({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    />
  );
}

/**
 * The mark of the day shown: a rule from top to bottom through its point, and
 * a larger point over it, hollow where it is an outlier, rimmed in `surface`
 * so it stands off the trend line.
 */
function ShownDayMark({
  x,
  y,
  outlier,
  radius,
  rule: [top, bottom],
  surface,
}: {
  x: number;
  y: number;
  outlier: boolean;
  radius: number;
  rule: [number, number];
  surface: string;
}) {
  return (
    <g>
      <line
        x1={x}
        x2={x}
        y1={top}
        y2={bottom}
        stroke="currentColor"
        strokeOpacity={0.5}
        strokeWidth={1.5}
      />
      {outlier ? (
        <circle
          cx={x}
          cy={y}
          r={radius}
          fill={surface}
          stroke="currentColor"
          strokeWidth={2.5}
        />
      ) : (
        <circle
          cx={x}
          cy={y}
          r={radius}
          fill="currentColor"
          stroke={surface}
          strokeWidth={2.5}
        />
      )}
    </g>
  );
}

/**
 * The handlers by which the drawing chooses a day for `onChooseDay`: a press
 * on the drawing chooses the day of `series` whose point lies
 * nearest across, and so does every move while it is held; letting go of a
 * press that began on the day shown without choosing another goes back to
 * today. A press the browser takes over to scroll the page leaves the day
 * shown before it; a finger chooses only once it has let go or moved more
 * across than up or down, so a swipe to scroll shows no other day meanwhile.
 * ← and → choose the day of `measuredDays` before and after for
 * `onStepToDay`, Escape goes
 * back to today. Where no earlier day is shown, `shownDay` is `null` and the
 * last day with a measurement stands for today's page.
 */
function useDayChoice(
  series: WindowSeries,
  measuredDays: CalendarDay[],
  scale: ChartScale,
  shownDay: CalendarDay | null,
  onChooseDay: (day: CalendarDay | null) => void,
  onStepToDay: (day: CalendarDay) => void,
) {
  // The press now held down: the day shown before it, the day it began on and
  // whether that is the day shown and no other has been chosen since; for a
  // finger that has chosen nothing yet, where it went down. `null` while
  // nothing is pressed.
  const press = useRef<{
    before: CalendarDay | null;
    pressedDay: CalendarDay;
    onShownDay: boolean;
    fingerDown: { x: number; y: number } | null;
  } | null>(null);
  const days = series.measurements.map(({ measurement }) => measurement.day);
  // Safe: `measuredDays` holds the days of `series`, which has at least one.
  const lastDay = measuredDays.at(-1) as CalendarDay;
  const current = shownDay ?? lastDay;
  const nearestTo = (event: React.PointerEvent<SVGSVGElement>) =>
    nearestDay(
      days,
      scale,
      event.clientX - event.currentTarget.getBoundingClientRect().left,
    );
  return {
    onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
      const day = nearestTo(event);
      const finger = event.pointerType === "touch";
      press.current = {
        before: shownDay,
        pressedDay: day,
        onShownDay: day === current,
        fingerDown: finger ? { x: event.clientX, y: event.clientY } : null,
      };
      if (!finger) onChooseDay(day);
    },
    onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
      if (event.buttons === 0) return;
      const held = press.current;
      if (held?.fingerDown) {
        const across = Math.abs(event.clientX - held.fingerDown.x);
        if (across <= Math.abs(event.clientY - held.fingerDown.y)) return;
        held.fingerDown = null;
      }
      const day = nearestTo(event);
      if (day === current) return;
      if (press.current !== null) press.current.onShownDay = false;
      onChooseDay(day);
    },
    onPointerUp() {
      if (press.current?.onShownDay) onChooseDay(null);
      else if (press.current?.fingerDown) onChooseDay(press.current.pressedDay);
      press.current = null;
    },
    onPointerCancel() {
      if (press.current !== null && press.current.fingerDown === null)
        onChooseDay(press.current.before);
      press.current = null;
    },
    onKeyDown(event: React.KeyboardEvent<SVGSVGElement>) {
      const i = measuredDays.indexOf(current);
      switch (event.key) {
        case "ArrowLeft":
          onStepToDay(measuredDays[Math.max(0, i - 1)]);
          break;
        case "ArrowRight":
          onStepToDay(measuredDays[Math.min(measuredDays.length - 1, i + 1)]);
          break;
        case "Escape":
          onChooseDay(null);
          break;
        default:
          return;
      }
      event.preventDefault();
    },
  };
}

/** Of `days`, the one whose point lies nearest across to `x`. */
function nearestDay(
  days: CalendarDay[],
  scale: ChartScale,
  x: number,
): CalendarDay {
  return days.reduce((nearest, day) =>
    Math.abs(scale.x(day) - x) < Math.abs(scale.x(nearest) - x) ? day : nearest,
  );
}

interface ChartScale {
  x(day: CalendarDay): number;
  y(kg: number): number;
  /** The whole kilos with a grid line and a label, from the lowest. */
  labelledKilos: number[];
  /** The labels under the graph, of days or months, from the earliest. */
  timeLabels: { day: CalendarDay; text: string }[];
}

/**
 * Where a day and a weight lie in a drawing `width` px wide: the days of
 * `graphWindow` from left to right, and whole kilos from just below the
 * lowest to just above the highest weight drawn, the band's edges included.
 */
function chartScale(
  series: WindowSeries,
  span: Span,
  graphWindow: GraphWindow,
  width: number,
  layout: Layout,
): ChartScale {
  const weights = [
    ...series.measurements.map(({ measurement }) => measurement.kg),
    ...series.trendLine
      .flat()
      .flatMap((trend) => [trend.kg - kgSd(trend), trend.kg + kgSd(trend)]),
  ];
  const lowest = Math.floor(Math.min(...weights) - 0.3);
  const highest = Math.ceil(Math.max(...weights) + 0.3);
  const kiloStep = highest - lowest > layout.everyOtherKiloAbove ? 2 : 1;
  const labelledKilos: number[] = [];
  for (let kg = lowest; kg <= highest; kg += kiloStep) labelledKilos.push(kg);
  const windowDays = daysBetween(graphWindow.firstDay, graphWindow.lastDay);
  return {
    labelledKilos,
    timeLabels: timeLabels(span, graphWindow, layout),
    x: (day) =>
      round(
        layout.left +
          (daysBetween(graphWindow.firstDay, day) / windowDays) *
            (width - layout.left - layout.right),
      ),
    y: (kg) =>
      round(
        layout.top +
          ((highest - kg) / (highest - lowest)) *
            (layout.height - layout.top - layout.bottom),
      ),
  };
}

/**
 * The labels under the graph: in „6 Wochen“ a day every `daysPerLabel` days,
 * in „3 Monate“ and „1 Jahr“ the name of each month, or of every
 * `monthsPerLabelInAYear`th in a year, in its middle.
 */
function timeLabels(
  span: Span,
  graphWindow: GraphWindow,
  layout: Layout,
): ChartScale["timeLabels"] {
  switch (span) {
    case "sixWeeks":
      return dayLabels(graphWindow, layout.daysPerLabel);
    case "threeMonths":
      return monthLabels(graphWindow, 1);
    case "oneYear":
      return monthLabels(graphWindow, layout.monthsPerLabelInAYear);
  }
}

function dayLabels(
  graphWindow: GraphWindow,
  daysPerLabel: number,
): ChartScale["timeLabels"] {
  const windowDays = daysBetween(graphWindow.firstDay, graphWindow.lastDay);
  // Not on the last day itself, whose label would stick out past the right
  // edge.
  const labels: ChartScale["timeLabels"] = [];
  for (let ago = 3; ago <= windowDays - 3; ago += daysPerLabel) {
    const day = calendarDayBefore(graphWindow.lastDay, ago);
    labels.unshift({ day, text: formatCalendarDay(day) });
  }
  return labels;
}

/**
 * The name of every `monthsPerLabel`th month of `graphWindow`, which starts
 * on the first of a month, from its first, on the 15th.
 */
function monthLabels(
  graphWindow: GraphWindow,
  monthsPerLabel: number,
): ChartScale["timeLabels"] {
  const labels: ChartScale["timeLabels"] = [];
  const [year, firstMonth] = yearAndMonth(graphWindow.firstDay);
  for (let month = firstMonth; ; month += monthsPerLabel) {
    const day = dayOfMonth(year, month, 15);
    if (day > graphWindow.lastDay) return labels;
    labels.push({ day, text: formatMonth(day) });
  }
}

/**
 * One piece of the trend line in runs of stretches under the same Ampel, the
 * Ampel of the later day of each stretch; each run begins on the day the one
 * before ends on. A piece of a single day is one run under its own Ampel.
 */
function sameLightRuns(
  piece: Trend[],
): { light: TrafficLight; trends: Trend[] }[] {
  if (piece.length === 1) {
    return [{ light: trafficLight(piece[0]), trends: piece }];
  }
  const runs: { light: TrafficLight; trends: Trend[] }[] = [];
  for (const [i, trend] of piece.entries()) {
    if (i === 0) continue;
    const light = trafficLight(trend);
    const run = runs.at(-1);
    if (run?.light === light) run.trends.push(trend);
    else runs.push({ light, trends: [piece[i - 1], trend] });
  }
  return runs;
}

/**
 * The corners of one run of the trend line. A run of a single day gets
 * its corner twice: a line of no length, which the round caps draw as a dot.
 */
function trendCorners(trends: Trend[], scale: ChartScale): string[] {
  const corners = trends.map(
    (trend) => `${scale.x(trend.day)},${scale.y(trend.kg)}`,
  );
  return corners.length === 1 ? [corners[0], corners[0]] : corners;
}

/**
 * The corners of the band around one piece of the trend line: along the
 * trend plus its standard deviation, and back along the trend minus it. A
 * piece of a single day gets a bar as wide as the line, as its line is a dot.
 */
function bandCorners(piece: Trend[], scale: ChartScale): string[] {
  if (piece.length === 1) {
    const [trend] = piece;
    const x = scale.x(trend.day);
    const top = scale.y(trend.kg + kgSd(trend));
    const bottom = scale.y(trend.kg - kgSd(trend));
    const left = round(x - LINE_WIDTH / 2);
    const right = round(x + LINE_WIDTH / 2);
    return [
      `${left},${top}`,
      `${right},${top}`,
      `${right},${bottom}`,
      `${left},${bottom}`,
    ];
  }
  const corner = (trend: Trend, side: 1 | -1) =>
    `${scale.x(trend.day)},${scale.y(trend.kg + side * kgSd(trend))}`;
  return [
    ...piece.map((trend) => corner(trend, 1)),
    ...piece.toReversed().map((trend) => corner(trend, -1)),
  ];
}

/** The standard deviation of `trend`'s weight, in kg. */
function kgSd(trend: Trend): number {
  return Math.sqrt(trend.kgVariance);
}

/** To a tenth of a pixel, which is all a screen shows. */
function round(px: number): number {
  return Math.round(px * 10) / 10;
}
