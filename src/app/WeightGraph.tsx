"use client";

import { useElementSize } from "@mantine/hooks";
import {
  type CalendarDay,
  calendarDayBefore,
  daysBetween,
} from "@/measurement/calendar-day";
import type { SixWeekSeries } from "@/trend/six-week-series";
import type { Trend } from "@/trend/trend";
import { formatCalendarDay } from "./format";

/**
 * The graph of the six weeks up to `today`, as wide as the space it is given:
 * the counting measurements as points, the trend as a line broken at gaps.
 * Drawn in the text colour it inherits; nothing where the six weeks hold no
 * measurement, as without one there is no weight to scale to.
 */
export function WeightGraph({
  series,
  today,
}: {
  series: SixWeekSeries;
  today: CalendarDay;
}) {
  const { ref, width } = useElementSize();
  return (
    <div ref={ref}>
      {width > 0 && series.measurements.length > 0 && (
        <Drawing series={series} today={today} width={width} />
      )}
    </div>
  );
}

function Drawing({
  series,
  today,
  width,
}: {
  series: SixWeekSeries;
  today: CalendarDay;
  width: number;
}) {
  const layout = width < WIDE_FROM_WIDTH ? COMPACT : WIDE;
  const scale = chartScale(series, today, width, layout);
  return (
    <svg
      width={width}
      height={layout.height}
      role="img"
      aria-label="Messungen und Trend der letzten sechs Wochen"
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
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

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
  /** The radius of each mark: the latest is largest. */
  radius: Record<Exclude<Mark, "latestOutlier">, number>;
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
  radius: { counting: 3.5, outlier: 4.5, latest: 5.5 },
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
  radius: { counting: 4.5, outlier: 5.5, latest: 6.5 },
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
 * lowest to just above the highest weight drawn.
 */
function chartScale(
  series: SixWeekSeries,
  today: CalendarDay,
  width: number,
  layout: Layout,
): ChartScale {
  const weights = [
    ...series.measurements.map(({ measurement }) => measurement.kg),
    ...series.trendLine.flat().map((trend) => trend.kg),
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

/** To a tenth of a pixel, which is all a screen shows. */
function round(px: number): number {
  return Math.round(px * 10) / 10;
}
