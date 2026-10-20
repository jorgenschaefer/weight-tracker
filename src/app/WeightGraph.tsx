"use client";

import { useElementSize } from "@mantine/hooks";
import { type Ref, useRef } from "react";
import {
  type CalendarDay,
  calendarDayBefore,
  daysBetween,
} from "@/measurement/calendar-day";
import type { SixWeekSeries } from "@/trend/six-week-series";
import type { Trend } from "@/trend/trend";
import { formatCalendarDay } from "./format";
import classes from "./WeightGraph.module.css";

/**
 * The graph of the six weeks up to `today`, as wide as the space it is given:
 * the counting measurements as points, the trend as a line inside a band of
 * ± its standard deviation, both broken at gaps.
 * Drawn in the text colour it inherits; nothing where the six weeks hold no
 * measurement, as without one there is no weight to scale to.
 *
 * It marks `shownDay`, an earlier day with a measurement, rimmed in
 * `surface`, the colour of the surface. A tap, a drag or ← and → choose the
 * day with a measurement nearest across or next to it, and report it to
 * `onShowDay`, which judges whether it is an earlier day; a second tap on the
 * day shown and Escape report `null`. `ref` reaches the drawing, which takes
 * the focus.
 */
export function WeightGraph({
  series,
  today,
  shownDay,
  onShowDay,
  surface,
  ref,
}: {
  series: SixWeekSeries;
  today: CalendarDay;
  shownDay: CalendarDay | null;
  onShowDay: (day: CalendarDay | null) => void;
  surface: string;
  ref?: Ref<SVGSVGElement>;
}) {
  const { ref: sized, width } = useElementSize();
  return (
    <div ref={sized}>
      {width > 0 && series.measurements.length > 0 && (
        <Drawing
          series={series}
          today={today}
          width={width}
          shownDay={shownDay}
          onShowDay={onShowDay}
          surface={surface}
          ref={ref}
        />
      )}
    </div>
  );
}

function Drawing({
  series,
  today,
  width,
  shownDay,
  onShowDay,
  surface,
  ref,
}: {
  series: SixWeekSeries;
  today: CalendarDay;
  width: number;
  shownDay: CalendarDay | null;
  onShowDay: (day: CalendarDay | null) => void;
  surface: string;
  ref?: Ref<SVGSVGElement>;
}) {
  const layout = width < WIDE_FROM_WIDTH ? COMPACT : WIDE;
  const scale = chartScale(series, today, width, layout);
  const choice = useDayChoice(series, scale, shownDay, onShowDay);
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
      aria-label="Messungen und Trend der letzten sechs Wochen"
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
      {scale.labelledDays.map((day) => (
        <text
          key={day}
          x={scale.x(day)}
          y={layout.height - layout.labelGap}
          fill="currentColor"
          fillOpacity={0.8}
          fontSize={layout.fontSize}
          textAnchor="middle"
        >
          {formatCalendarDay(day)}
        </text>
      ))}
      {series.trendLine.map((piece) => (
        <polygon
          key={piece[0].day}
          points={bandCorners(piece, scale).join(" ")}
          fill="currentColor"
          fillOpacity={0.16}
        />
      ))}
      {series.measurements.map(({ measurement, outlier }, i) => (
        <Point
          key={measurement.day}
          cx={scale.x(measurement.day)}
          cy={scale.y(measurement.kg)}
          radius={layout.radius}
          mark={mark(i === series.measurements.length - 1, outlier)}
        />
      ))}
      {series.trendLine.map((piece) => (
        <polyline
          key={piece[0].day}
          points={trendCorners(piece, scale).join(" ")}
          fill="none"
          stroke="currentColor"
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
          radius={layout.radius.shown}
          rule={[layout.top, layout.height - layout.bottom]}
          surface={surface}
        />
      )}
    </svg>
  );
}

/** The width of the trend line, in px. */
const LINE_WIDTH = 3;

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
  daysPerLabel: number;
  /** The radius of each mark: the latest is largest, but for the day shown. */
  radius: Record<Exclude<Mark, "latestOutlier"> | "shown", number>;
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
  radius: { counting: 3.5, outlier: 4.5, latest: 5.5, shown: 7 },
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
  radius: { counting: 4.5, outlier: 5.5, latest: 6.5, shown: 8 },
};

type Mark = "counting" | "outlier" | "latest" | "latestOutlier";

/** The last day's measurement is the largest mark, hollow where it is an outlier. */
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
  radius: Layout["radius"];
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
 * The handlers by which the drawing chooses a day of `series` for
 * `onShowDay`: a press on the drawing chooses the day whose point lies
 * nearest across, and so does every move while it is held; letting go of a
 * press that began on the day shown without choosing another goes back to
 * today. A press the browser takes over to scroll the page leaves the day
 * shown before it; a finger chooses only once it has let go or moved more
 * across than up or down, so a swipe to scroll shows no other day meanwhile.
 * ← and → choose the day with a measurement before and after, Escape goes
 * back to today. Where no earlier day is shown, `shownDay` is `null` and the
 * point of the last day with a measurement stands for today's page.
 */
function useDayChoice(
  series: SixWeekSeries,
  scale: ChartScale,
  shownDay: CalendarDay | null,
  onShowDay: (day: CalendarDay | null) => void,
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
  // Safe: the drawing has at least one measurement, so a last day.
  const lastDay = days.at(-1) as CalendarDay;
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
      if (!finger) onShowDay(day);
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
      onShowDay(day);
    },
    onPointerUp() {
      if (press.current?.onShownDay) onShowDay(null);
      else if (press.current?.fingerDown) onShowDay(press.current.pressedDay);
      press.current = null;
    },
    onPointerCancel() {
      if (press.current !== null && press.current.fingerDown === null)
        onShowDay(press.current.before);
      press.current = null;
    },
    onKeyDown(event: React.KeyboardEvent<SVGSVGElement>) {
      const i = days.indexOf(current);
      switch (event.key) {
        case "ArrowLeft":
          onShowDay(days[Math.max(0, i - 1)]);
          break;
        case "ArrowRight":
          onShowDay(days[Math.min(days.length - 1, i + 1)]);
          break;
        case "Escape":
          onShowDay(null);
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
  /** The days with a label, from the earliest. */
  labelledDays: CalendarDay[];
}

/**
 * Where a day and a weight lie in a drawing `width` px wide: `today` and the
 * 41 days before it from left to right, and whole kilos from just below the
 * lowest to just above the highest weight drawn, the band's edges included.
 */
function chartScale(
  series: SixWeekSeries,
  today: CalendarDay,
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
  // Not on today itself, whose label would stick out past the right edge.
  const labelledDays: CalendarDay[] = [];
  for (let ago = 3; ago <= SPAN_DAYS - 3; ago += layout.daysPerLabel)
    labelledDays.unshift(calendarDayBefore(today, ago));
  return {
    labelledKilos,
    labelledDays,
    x: (day) =>
      round(
        layout.left +
          ((SPAN_DAYS - daysBetween(day, today)) / SPAN_DAYS) *
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

const SPAN_DAYS = 41;

/**
 * The corners of one piece of the trend line. A piece of a single day gets
 * its corner twice: a line of no length, which the round caps draw as a dot.
 */
function trendCorners(piece: Trend[], scale: ChartScale): string[] {
  const corners = piece.map(
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
