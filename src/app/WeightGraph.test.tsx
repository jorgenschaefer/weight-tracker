import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import {
  type CountingMeasurement,
  countingMeasurements,
} from "@/measurement/measurement";
import { stubContainerWidth } from "@/test/container-width";
import {
  leavePage,
  NOW,
  openHistoryOn,
  standInForGoogle,
} from "@/test/open-page";
import { weightHistory } from "@/test/weight-history-fixture";
import {
  type GraphWindow,
  type Span,
  windowUpTo,
} from "@/trend/graph-window/graph-window";
import {
  type WindowSeries,
  windowSeries,
} from "@/trend/graph-window/window-series";
import type { Trend } from "@/trend/trend";
import { WeightGraph } from "./WeightGraph";

vi.mock("@/measurement/google-health", () => ({
  loadGoogleSignIn: vi.fn(),
  enterMeasurement: vi.fn(),
  signIn: vi.fn(),
  fetchMeasurements: vi.fn(),
  revokeAccess: vi.fn(),
}));

// Safe: valid `YYYY-MM-DD`s.
const october17 = "2026-10-17" as CalendarDay;

/** The graphWindow of „6 Wochen“ up to 17.10. */
const upToOctober17 = windowUpTo("sixWeeks", october17);

const realSeries = () =>
  windowSeries(countingMeasurements(weightHistory()), upToOctober17);

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The colour of the surface the graph is drawn on. */
const SURFACE = "#D3EAD0";

/** What the graph shows: the window of `span` up to `today`. */
interface View {
  span: Span;
  graphWindow: GraphWindow;
  today: CalendarDay;
}

/** „6 Wochen“ up to 17.10. */
const sixWeeksTo17: View = {
  span: "sixWeeks",
  graphWindow: upToOctober17,
  today: october17,
};

/** The window of `span` up to `today`. */
const viewOf = (span: Span, today: CalendarDay): View => ({
  span,
  graphWindow: windowUpTo(span, today),
  today,
});

/** The days of the measurements of `series`, as if they were all there are. */
const measuredDays = (series: WindowSeries) =>
  series.measurements.map(({ measurement }) => measurement.day);

/**
 * The graph of `series` in `view`, drawn into a container `width` px wide,
 * marking `shownDay`.
 */
async function drawGraph(
  series: WindowSeries,
  width = 320,
  shownDay: CalendarDay | null = null,
  view: View = sixWeeksTo17,
): Promise<SVGSVGElement> {
  stubContainerWidth(width);
  render(
    <WeightGraph
      series={series}
      span={view.span}
      graphWindow={view.graphWindow}
      today={view.today}
      measuredDays={measuredDays(series)}
      shownDay={shownDay}
      onChooseDay={() => {}}
      onStepToDay={() => {}}
      surface={SURFACE}
    />,
  );
  const graph = await screen.findByRole("img", {
    name: /^Messungen und Trend/,
  });
  // Safe: the element with this role is the graph's <svg>.
  return graph as unknown as SVGSVGElement;
}

/**
 * The graph of `measurements`, the user's weight unless given, in the window
 * of `span` up to `today`.
 */
function drawSpan(
  span: Span,
  width = 320,
  today = october17,
  measurements = weightHistory(),
) {
  const view = viewOf(span, today);
  return drawGraph(
    windowSeries(countingMeasurements(measurements), view.graphWindow),
    width,
    null,
    view,
  );
}

const points = (graph: SVGSVGElement) => [...graph.querySelectorAll("circle")];

const isHollowRing = (point: Element) =>
  point.getAttribute("fill") === "none" &&
  point.getAttribute("stroke") === "currentColor";

const isFaintPoint = (point: Element) =>
  point.getAttribute("fill") === "currentColor" &&
  point.getAttribute("fill-opacity") === "0.38";

const isFullDot = (point: Element) =>
  point.getAttribute("fill") === "currentColor" &&
  !point.hasAttribute("fill-opacity");

const trendPieces = (graph: SVGSVGElement) => [
  ...graph.querySelectorAll("polyline"),
];

const bands = (graph: SVGSVGElement) => [...graph.querySelectorAll("polygon")];

/** The corners of a polyline or polygon, each as its x and y. */
const cornerPoints = (shape: Element) =>
  (shape.getAttribute("points") ?? "")
    .trim()
    .split(/\s+/)
    .map((corner) => {
      const [x, y] = corner.split(",").map(Number);
      return { x, y };
    });

const corners = (piece: Element) => cornerPoints(piece).length;

/**
 * How many corners each piece of the line between gaps has: the polylines
 * of `pieces` joined where one ends on the corner the next begins with.
 */
function joinedCornerCounts(pieces: Element[]): number[] {
  const counts: number[] = [];
  let previousEnd: { x: number; y: number } | undefined;
  for (const piece of pieces) {
    const piecePoints = cornerPoints(piece);
    const [first] = piecePoints;
    if (
      previousEnd !== undefined &&
      previousEnd.x === first.x &&
      previousEnd.y === first.y
    ) {
      counts[counts.length - 1] += piecePoints.length - 1;
    } else {
      counts.push(piecePoints.length);
    }
    previousEnd = piecePoints.at(-1);
  }
  return counts;
}

const centre = (point: Element) => ({
  x: Number(point.getAttribute("cx")),
  y: Number(point.getAttribute("cy")),
});

const labels = (graph: SVGSVGElement) =>
  [...graph.querySelectorAll("text")].map((label) => label.textContent);

const gridLines = (graph: SVGSVGElement) => [...graph.querySelectorAll("line")];

const radius = (point: Element) => Number(point.getAttribute("r"));

/**
 * A counting measurement of `day` at 7:00 in Berlin summer time; `day` is a
 * valid `YYYY-MM-DD`, which makes the cast to a calendar day safe.
 */
const measured = (day: string, kg: number): CountingMeasurement => ({
  time: new Date(`${day}T07:00:00+02:00`),
  kg,
  day: day as CalendarDay,
});

/**
 * The trend of `day` (a valid `YYYY-MM-DD`, which makes the cast safe) at
 * `kg`, ± `sdKg`; its pace does not matter to the graph.
 */
const trendOn = (day: string, kg: number, sdKg = 0.3): Trend => ({
  day: day as CalendarDay,
  kg,
  kgVariance: sdKg ** 2,
  pace: 0,
  paceVariance: 0.09,
  z: 0,
});

/** Paces, in kg per week, whose Ampel is green, yellow or red. */
const GREEN = -1;
const YELLOW = -0.1;
const RED = 1;

const withPace = (trend: Trend, pace: number): Trend => ({ ...trend, pace });

/** Three days up to 17.10., the second one an outlier, without a trend. */
const withOutlierInTheMiddle: WindowSeries = {
  measurements: [
    {
      measurement: measured("2026-10-15", 98.0),
      outlier: false,
      latest: false,
    },
    { measurement: measured("2026-10-16", 99.5), outlier: true, latest: false },
    { measurement: measured("2026-10-17", 98.1), outlier: false, latest: true },
  ],
  trendLine: [],
};

describe("WeightGraph", () => {
  it("draws a point for each counting measurement of the six weeks", async () => {
    const graph = await drawGraph(realSeries());

    expect(points(graph)).toHaveLength(34);
  });

  it("marks the outliers of the six weeks as hollow rings", async () => {
    const graph = await drawGraph(realSeries());

    expect(points(graph).filter(isHollowRing)).toHaveLength(6);
  });

  it("draws an outlier as a hollow ring, the other measurements as faint points", async () => {
    const [first, outlier] = points(await drawGraph(withOutlierInTheMiddle));

    expect(isHollowRing(outlier)).toBe(true);
    expect(isFaintPoint(first)).toBe(true);
  });

  it("draws the last day's counting measurement as a larger full dot", async () => {
    const [first, , last] = points(await drawGraph(withOutlierInTheMiddle));

    expect(isFullDot(last)).toBe(true);
    expect(radius(last)).toBeGreaterThan(radius(first));
  });

  it.each([
    ["sixWeeks", 320, 3.5, 5.5],
    ["threeMonths", 320, 2.4, 4],
    ["oneYear", 320, 1.6, 3],
    ["sixWeeks", 800, 4.5, 6.5],
    ["threeMonths", 800, 3.4, 5],
    ["oneYear", 800, 2.6, 4],
  ] as const)(
    "draws in %s, %i px wide, the points %f px and the last day's dot %f px in radius",
    async (span, width, counting, latest) => {
      const view = viewOf(span, october17);
      const graph = await drawGraph(
        windowSeries(countingMeasurements(weightHistory()), view.graphWindow),
        width,
        null,
        view,
      );

      const drawn = points(graph);
      expect(radius(drawn[0])).toBe(counting);
      expect(radius(drawn.filter(isFullDot)[0])).toBe(latest);
    },
  );

  it.each([
    ["sixWeeks", 320, 4.5, 5.5],
    ["threeMonths", 320, 3, 4],
    ["oneYear", 320, 2, 3],
    ["sixWeeks", 800, 5.5, 6.5],
    ["threeMonths", 800, 4, 5],
    ["oneYear", 800, 3, 4],
  ] as const)(
    "draws in %s, %i px wide, an outlier's ring of %f px, its 2 px stroke reaching as far as the last day's dot of %f px, and the last day's outlier as large as that dot",
    async (span, width, ring, latest) => {
      const view = viewOf(span, october17);
      const [, outlier] = points(
        await drawGraph(withOutlierInTheMiddle, width, null, view),
      );
      expect(radius(outlier)).toBe(ring);
      cleanup();

      const [, latestOutlier] = points(
        await drawGraph(
          {
            ...withOutlierInTheMiddle,
            measurements: [
              withOutlierInTheMiddle.measurements[0],
              { ...withOutlierInTheMiddle.measurements[1], latest: true },
            ],
          },
          width,
          null,
          view,
        ),
      );
      expect(isHollowRing(latestOutlier)).toBe(true);
      expect(radius(latestOutlier)).toBe(latest);
    },
  );

  it("draws no larger dot in a window before the last day's measurement", async () => {
    const earlierWindow = windowUpTo("sixWeeks", "2026-09-08" as CalendarDay);
    const graph = await drawGraph(
      windowSeries(countingMeasurements(weightHistory()), earlierWindow),
      320,
      null,
      { span: "sixWeeks", graphWindow: earlierWindow, today: october17 },
    );

    expect(points(graph).filter(isFullDot)).toEqual([]);
  });

  it("draws the last day's measurement as a ring as large as the full dot where it is an outlier", async () => {
    const [, , fullDot] = points(await drawGraph(withOutlierInTheMiddle));
    const fullDotRadius = radius(fullDot);
    cleanup();
    const [, ring] = points(
      await drawGraph({
        ...withOutlierInTheMiddle,
        measurements: [
          withOutlierInTheMiddle.measurements[0],
          { ...withOutlierInTheMiddle.measurements[1], latest: true },
        ],
      }),
    );

    expect(isHollowRing(ring)).toBe(true);
    expect(radius(ring)).toBe(fullDotRadius);
  });

  it("draws the trend as a line 3 px wide, broken at the gap from 22.9. to 1.10.", async () => {
    const series = realSeries();
    const pieces = trendPieces(await drawGraph(series));

    expect(joinedCornerCounts(pieces)).toEqual(
      series.trendLine.map((piece) => piece.length),
    );
    expect(series.trendLine).toHaveLength(2);
    for (const piece of pieces) {
      expect(piece).toHaveAttribute("fill", "none");
      expect(piece).toHaveAttribute("stroke-width", "3");
    }
  });

  it("colours each stretch of the line between two days with a measurement in the Ampel of the later day", async () => {
    const days = ["2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"];
    const graph = await drawGraph({
      measurements: [...days, "2026-10-16"].map((day, i) => ({
        measurement: measured(day, 98),
        outlier: false,
        latest: i === days.length,
      })),
      trendLine: [
        [
          withPace(trendOn(days[0], 98), RED),
          withPace(trendOn(days[1], 98), GREEN),
          withPace(trendOn(days[2], 98), GREEN),
          withPace(trendOn(days[3], 98), RED),
        ],
        [withPace(trendOn("2026-10-16", 98), YELLOW)],
      ],
    });

    expect(
      trendPieces(graph).map((piece) => [
        piece.getAttribute("stroke"),
        corners(piece),
      ]),
    ).toEqual([
      ["#047F21", 3],
      ["#B61F02", 2],
      ["#B78006", 2],
    ]);
  });

  it("colours the whole line of the user's weight in the three colours of the Ampel", async () => {
    const strokes = new Set(
      trendPieces(await drawSpan("threeMonths")).map((piece) =>
        piece.getAttribute("stroke"),
      ),
    );

    expect(strokes).toEqual(new Set(["#047F21", "#B78006", "#B61F02"]));
  });

  it("draws only the points, and no trend line, where there is no trend", async () => {
    const graph = await drawGraph(withOutlierInTheMiddle);

    expect(points(graph)).toHaveLength(3);
    expect(trendPieces(graph)).toHaveLength(0);
  });

  it("places the points by day from left to right, and higher weights higher up", async () => {
    const [first, outlier, last] = points(
      await drawGraph(withOutlierInTheMiddle),
    ).map(centre);

    expect(first.x).toBeLessThan(outlier.x);
    expect(outlier.x).toBeLessThan(last.x);
    expect(outlier.y).toBeLessThan(first.y);
    expect(last.y).toBeLessThan(first.y);
  });

  it("draws a trend of the same weight as a measurement at its height", async () => {
    const graph = await drawGraph({
      measurements: [
        {
          measurement: measured("2026-10-16", 98.0),
          outlier: false,
          latest: true,
        },
      ],
      trendLine: [[trendOn("2026-10-16", 98.0), trendOn("2026-10-17", 97.0)]],
    });
    const [point] = points(graph).map(centre);

    expect(cornerPoints(trendPieces(graph)[0])[0]).toEqual(point);
  });

  it("draws around each piece of the line a faint band in the text colour", async () => {
    const series = realSeries();
    const graph = await drawGraph(series);

    expect(bands(graph).map((band) => cornerPoints(band).length)).toEqual(
      series.trendLine.map((piece) => 2 * piece.length),
    );
    for (const band of bands(graph)) {
      expect(band).toHaveAttribute("fill", "currentColor");
      expect(Number(band.getAttribute("fill-opacity"))).toBeLessThan(0.38);
      expect(band).not.toHaveAttribute("stroke");
    }
  });

  it("draws the band from the trend plus its standard deviation to the trend minus it", async () => {
    const graph = await drawGraph({
      measurements: [
        {
          measurement: measured("2026-10-16", 98.0),
          outlier: false,
          latest: true,
        },
      ],
      trendLine: [
        [trendOn("2026-10-16", 98.0, 0.5), trendOn("2026-10-17", 97.0, 0.4)],
      ],
    });
    const [point] = points(graph).map(centre);
    const [upper16, upper17, lower17, lower16] = cornerPoints(bands(graph)[0]);
    const [, line17] = cornerPoints(trendPieces(graph)[0]);

    expect([upper16.x, lower16.x]).toEqual([point.x, point.x]);
    expect([upper17.x, lower17.x]).toEqual([line17.x, line17.x]);
    expect(point.y - upper16.y).toBeGreaterThan(0);
    expect(point.y - upper16.y).toBeCloseTo(lower16.y - point.y, 0);
    expect((line17.y - upper17.y) / (point.y - upper16.y)).toBeCloseTo(0.8, 1);
    expect(lower17.y - line17.y).toBeCloseTo(line17.y - upper17.y, 0);
  });

  it("scales the weights so the band stays inside", async () => {
    const graph = await drawGraph({
      measurements: [
        {
          measurement: measured("2026-10-16", 98.0),
          outlier: false,
          latest: false,
        },
        {
          measurement: measured("2026-10-17", 98.2),
          outlier: false,
          latest: true,
        },
      ],
      trendLine: [
        [trendOn("2026-10-16", 98.0, 3), trendOn("2026-10-17", 98.1, 3)],
      ],
    });
    const height = Number(graph.getAttribute("height"));

    expect(labels(graph)[0]).toBe("94");
    for (const { y } of cornerPoints(bands(graph)[0])) {
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(height);
    }
  });

  it.each([320, 960])(
    "fills a width of %d px and draws no point outside it",
    async (width) => {
      const graph = await drawGraph(realSeries(), width);

      expect(graph).toHaveAttribute("width", String(width));
      for (const point of points(graph)) {
        const { x, y } = centre(point);
        expect(x - radius(point)).toBeGreaterThanOrEqual(0);
        expect(x + radius(point)).toBeLessThanOrEqual(width);
        expect(y - radius(point)).toBeGreaterThanOrEqual(0);
        expect(y + radius(point)).toBeLessThanOrEqual(
          Number(graph.getAttribute("height")),
        );
      }
    },
  );

  it("labels every second kilo and every tenth day, in German, on a phone", async () => {
    const graph = await drawGraph(realSeries(), 320);

    expect(labels(graph)).toEqual([
      "96",
      "98",
      "100",
      "102",
      "14.9.",
      "24.9.",
      "4.10.",
      "14.10.",
    ]);
  });

  it("draws a grid line across the graph at each weight label", async () => {
    const graph = await drawGraph(realSeries(), 320);
    const weightLabels = [...graph.querySelectorAll("text")].slice(0, 4);

    expect(gridLines(graph)).toHaveLength(4);
    for (const [i, line] of gridLines(graph).entries()) {
      const lineY = Number(line.getAttribute("y1"));
      const labelBaseline = Number(weightLabels[i].getAttribute("y"));
      expect(line).toHaveAttribute("y2", String(lineY));
      expect(labelBaseline - lineY).toBeGreaterThan(0);
      expect(labelBaseline - lineY).toBeLessThan(6);
    }
  });

  it("labels each kilo where the weights lie within 5 kg of each other", async () => {
    const graph = await drawGraph(withOutlierInTheMiddle, 320);

    expect(labels(graph).slice(0, 4)).toEqual(["97", "98", "99", "100"]);
  });

  it("labels each kilo and every seventh day on a wide screen, and is taller", async () => {
    const graph = await drawGraph(realSeries(), 960);

    expect(graph).toHaveAttribute("height", "380");
    expect(labels(graph)).toEqual([
      "96",
      "97",
      "98",
      "99",
      "100",
      "101",
      "102",
      "9.9.",
      "16.9.",
      "23.9.",
      "30.9.",
      "7.10.",
      "14.10.",
    ]);
  });

  it.each([
    ["sixWeeks", "2026-10-17", "Messungen und Trend, 6 Wochen, Bis heute"],
    [
      "sixWeeks",
      "2026-09-08",
      "Messungen und Trend, 6 Wochen, 29.7.26 – 8.9.26",
    ],
    [
      "threeMonths",
      "2026-10-17",
      "Messungen und Trend, 3 Monate, Aug – Okt 2026",
    ],
    ["oneYear", "2026-10-17", "Messungen und Trend, 1 Jahr, 2026"],
  ] as const)(
    "tells a screen reader its span and range: %s up to %s, on 17.10., is „%s“",
    async (span, lastDay, name) => {
      const graphWindow = windowUpTo(span, lastDay as CalendarDay);
      const graph = await drawGraph(
        windowSeries(countingMeasurements(weightHistory()), graphWindow),
        320,
        null,
        { span, graphWindow, today: october17 },
      );

      expect(graph).toHaveAccessibleName(name);
    },
  );

  it.each([
    [599, "190"],
    [600, "380"],
  ])("draws a graph %d px wide %s px tall", async (width, height) => {
    expect(await drawGraph(realSeries(), width)).toHaveAttribute(
      "height",
      height,
    );
  });

  it("says „Keine Messung in diesem Zeitraum“ in place of a drawing where the window holds no measurement", async () => {
    stubContainerWidth(320);
    const { container } = render(
      <WeightGraph
        series={{ measurements: [], trendLine: [] }}
        span="sixWeeks"
        graphWindow={upToOctober17}
        today={october17}
        measuredDays={[]}
        shownDay={null}
        onChooseDay={() => {}}
        onStepToDay={() => {}}
        surface={SURFACE}
      />,
    );
    // The width arrives in the next frame.
    await act(() => new Promise(requestAnimationFrame));

    expect(container.querySelector("svg")).toBeNull();
    expect(container).toHaveTextContent(/^Keine Messung in diesem Zeitraum$/);
  });

  it("marks a trend piece of a single day, after a gap, where the trend lies", async () => {
    const graph = await drawGraph({
      measurements: [
        {
          measurement: measured("2026-10-10", 98.0),
          outlier: false,
          latest: false,
        },
        {
          measurement: measured("2026-10-15", 97.6),
          outlier: false,
          latest: true,
        },
      ],
      trendLine: [[trendOn("2026-10-15", 97.3)]],
    });
    const [piece] = trendPieces(graph);
    const [first, ...rest] = cornerPoints(piece);

    // Its round caps draw a dot the width of the line on that one corner.
    expect(rest).toEqual([first]);
    expect(piece).toHaveAttribute("stroke-linecap", "round");
  });

  it("draws the band of a trend piece of a single day as a bar the width of the line", async () => {
    const graph = await drawGraph({
      measurements: [
        {
          measurement: measured("2026-10-10", 98.0),
          outlier: false,
          latest: false,
        },
        {
          measurement: measured("2026-10-15", 97.6),
          outlier: false,
          latest: true,
        },
      ],
      trendLine: [[trendOn("2026-10-15", 97.3, 0.4)]],
    });
    const [line] = cornerPoints(trendPieces(graph)[0]);
    const band = cornerPoints(bands(graph)[0]);
    const xs = band.map(({ x }) => x);
    const ys = band.map(({ y }) => y);

    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(3);
    expect((Math.max(...xs) + Math.min(...xs)) / 2).toBeCloseTo(line.x);
    expect(Math.min(...ys)).toBeLessThan(line.y);
    expect(line.y - Math.min(...ys)).toBeCloseTo(Math.max(...ys) - line.y, 0);
  });

  it("sets each date label under the points of its day", async () => {
    const series = realSeries();
    const graph = await drawGraph(series);
    const october14 = series.measurements.findIndex(
      ({ measurement }) => measurement.day === "2026-10-14",
    );
    const label = [...graph.querySelectorAll("text")].find(
      (text) => text.textContent === "14.10.",
    );

    expect(label).toHaveAttribute("text-anchor", "middle");
    expect(Number(label?.getAttribute("x"))).toBe(
      centre(points(graph)[october14]).x,
    );
  });

  it("sets the weight labels left of the grid lines, ending at them", async () => {
    const graph = await drawGraph(realSeries());
    const weightLabels = [...graph.querySelectorAll("text")].slice(0, 4);
    const gridStart = Number(gridLines(graph)[0].getAttribute("x1"));

    for (const label of weightLabels) {
      expect(label).toHaveAttribute("text-anchor", "end");
      expect(Number(label.getAttribute("x"))).toBeLessThan(gridStart);
      expect(Number(label.getAttribute("x"))).toBeGreaterThan(gridStart - 10);
    }
    for (const point of points(graph)) {
      expect(centre(point).x).toBeGreaterThanOrEqual(gridStart);
    }
  });

  it("scales the weights so a trend far below the measurements stays inside", async () => {
    const graph = await drawGraph({
      measurements: [
        {
          measurement: measured("2026-10-16", 99.0),
          outlier: false,
          latest: false,
        },
        {
          measurement: measured("2026-10-17", 99.2),
          outlier: false,
          latest: true,
        },
      ],
      trendLine: [[trendOn("2026-10-16", 96.0), trendOn("2026-10-17", 96.1)]],
    });
    const height = Number(graph.getAttribute("height"));

    expect(labels(graph)[0]).toBe("95");
    for (const { y } of cornerPoints(trendPieces(graph)[0])) {
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(height);
    }
  });
});

describe("WeightGraph: „3 Monate“ and „1 Jahr“", () => {
  /** The labels under the graph, of days or months. */
  const timeLabels = (graph: SVGSVGElement) =>
    labels(graph).filter((label) => !/^\d+$/.test(label ?? ""));

  const pointOn = (graph: SVGSVGElement, span: Span, day: string) => {
    const series = windowSeries(
      countingMeasurements(weightHistory()),
      windowUpTo(span, october17),
    );
    const i = series.measurements.findIndex(
      ({ measurement }) => measurement.day === day,
    );
    return centre(points(graph)[i]);
  };

  /** The dashed line that marks today. */
  const todayLines = (graph: SVGSVGElement) =>
    gridLines(graph).filter((line) => line.hasAttribute("stroke-dasharray"));

  it("spans the days of the three months from the left edge to the right, the days after today empty", async () => {
    const graph = await drawSpan("threeMonths");
    const [grid] = gridLines(graph);
    const left = Number(grid.getAttribute("x1"));
    const right = Number(grid.getAttribute("x2"));

    expect(pointOn(graph, "threeMonths", "2026-08-01").x).toBe(left);
    // 1.8. to 17.10. are 77 of the 91 days from 1.8. to 31.10.
    expect(points(graph).at(-1)?.getAttribute("cx")).toBe(
      String(Math.round((left + (77 / 91) * (right - left)) * 10) / 10),
    );
  });

  it("labels each of the three months in its middle", async () => {
    const graph = await drawSpan("threeMonths");
    const august = [...graph.querySelectorAll("text")].find(
      (text) => text.textContent === "Aug",
    );

    expect(timeLabels(graph)).toEqual(["Aug", "Sep", "Okt"]);
    expect(august).toHaveAttribute("text-anchor", "middle");
    expect(Number(august?.getAttribute("x"))).toBe(
      pointOn(graph, "threeMonths", "2026-08-15").x,
    );
  });

  it("labels the three months across a new year", async () => {
    const graph = await drawSpan(
      "threeMonths",
      320,
      "2027-01-20" as CalendarDay,
      [measured("2026-12-30", 95.0), measured("2027-01-20", 94.8)],
    );

    expect(timeLabels(graph)).toEqual(["Nov", "Dez", "Jan"]);
  });

  it("labels every second month of the year on a phone", async () => {
    expect(timeLabels(await drawSpan("oneYear", 320))).toEqual([
      "Jan",
      "Mär",
      "Mai",
      "Jul",
      "Sep",
      "Nov",
    ]);
  });

  it("labels each month of the year on a wide screen", async () => {
    expect(timeLabels(await drawSpan("oneYear", 960))).toEqual([
      "Jan",
      "Feb",
      "Mär",
      "Apr",
      "Mai",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Okt",
      "Nov",
      "Dez",
    ]);
  });

  it.each<Span>(["threeMonths", "oneYear"])(
    "marks today with a dashed line from top to bottom, just right of its point, in %s",
    async (span) => {
      const graph = await drawSpan(span);
      const today = pointOn(graph, span, "2026-10-17");
      const [line] = todayLines(graph);

      expect(todayLines(graph)).toHaveLength(1);
      expect(line.getAttribute("x1")).toBe(line.getAttribute("x2"));
      expect(Number(line.getAttribute("x1"))).toBeGreaterThan(today.x);
      expect(Number(line.getAttribute("x1"))).toBeLessThan(today.x + 5);
      expect(Number(line.getAttribute("y1"))).toBeLessThan(today.y);
      expect(Number(line.getAttribute("y2"))).toBeGreaterThan(today.y);
    },
  );

  it("draws no line for today where the window ends with it", async () => {
    expect(todayLines(await drawSpan("sixWeeks"))).toEqual([]);
  });
});

describe("WeightGraph: the day shown", () => {
  // Safe: valid `YYYY-MM-DD`s.
  const october15 = "2026-10-15" as CalendarDay;
  const october16 = "2026-10-16" as CalendarDay;

  /** The upright lines of the drawing: the grid lines run across. */
  const rules = (graph: SVGSVGElement) =>
    gridLines(graph).filter(
      (line) => line.getAttribute("x1") === line.getAttribute("x2"),
    );

  it("marks nothing where no earlier day is shown", async () => {
    const graph = await drawGraph(withOutlierInTheMiddle);

    expect(points(graph)).toHaveLength(3);
    expect(rules(graph)).toEqual([]);
  });

  it("marks it with a rule from top to bottom through its point", async () => {
    const graph = await drawGraph(withOutlierInTheMiddle, 320, october15);
    const [point] = points(graph).map(centre);
    const [rule] = rules(graph);

    expect(rules(graph)).toHaveLength(1);
    expect(Number(rule.getAttribute("x1"))).toBe(point.x);
    expect(Number(rule.getAttribute("y1"))).toBeLessThan(point.y);
    expect(Number(rule.getAttribute("y2"))).toBeGreaterThan(point.y);
    expect(Number(rule.getAttribute("y2"))).toBeLessThan(
      Number(graph.getAttribute("height")),
    );
  });

  it("marks it with a full point larger than the last day's, rimmed in the colour of the surface", async () => {
    const graph = await drawGraph(withOutlierInTheMiddle, 320, october15);
    const [first, , last, shown] = points(graph);

    expect(points(graph)).toHaveLength(4);
    expect(centre(shown)).toEqual(centre(first));
    expect(radius(shown)).toBeGreaterThan(radius(last));
    expect(shown).toHaveAttribute("fill", "currentColor");
    expect(shown).toHaveAttribute("stroke", SURFACE);
  });

  it("keeps the point hollow where the day shown is an outlier", async () => {
    const graph = await drawGraph(withOutlierInTheMiddle, 320, october16);
    const [, outlier, last, shown] = points(graph);

    expect(centre(shown)).toEqual(centre(outlier));
    expect(radius(shown)).toBeGreaterThan(radius(last));
    expect(shown).toHaveAttribute("fill", SURFACE);
    expect(shown).toHaveAttribute("stroke", "currentColor");
  });

  // Whether the last day is an earlier day is the page's to judge.
  it("reports the last day with a measurement as it is, chosen with →", async () => {
    stubContainerWidth(320);
    const onStepToDay = vi.fn();
    render(
      <WeightGraph
        series={withOutlierInTheMiddle}
        span="sixWeeks"
        graphWindow={upToOctober17}
        today={october17}
        measuredDays={measuredDays(withOutlierInTheMiddle)}
        shownDay={october16}
        onChooseDay={() => {}}
        onStepToDay={onStepToDay}
        surface={SURFACE}
      />,
    );
    const graph = await screen.findByRole("img");

    fireEvent.keyDown(graph, { key: "ArrowRight" });

    expect(onStepToDay).toHaveBeenCalledWith(october17);
  });

  const css = readFileSync(
    join(import.meta.dirname, "WeightGraph.module.css"),
    "utf8",
  );

  // jsdom draws no focus ring, so the stylesheet is read instead.
  it("rings the drawing in focus only where the browser shows the focus, not after a tap", () => {
    expect(/\.drawing:focus\s*\{([^}]*)\}/.exec(css)?.[1]).toMatch(
      /outline:\s*none/,
    );
    expect(/\.drawing:focus-visible\s*\{([^}]*)\}/.exec(css)?.[1]).toMatch(
      /outline:\s*3px solid currentColor/,
    );
  });

  it("lets a swipe up or down over it scroll the page", () => {
    expect(/\.drawing\s*\{([^}]*)\}/.exec(css)?.[1]).toMatch(
      /touch-action:\s*pan-y/,
    );
  });

  // jsdom selects no text, so the stylesheet is read instead.
  it("selects none of its labels on a drag across it", () => {
    expect(/\.drawing\s*\{([^}]*)\}/.exec(css)?.[1]).toMatch(
      /(^|[^-])user-select:\s*none/,
    );
  });
});

describe("the outliers on the page", () => {
  beforeEach(() => standInForGoogle(NOW));
  afterEach(leavePage);

  /** The graph on the page, opened in the evening of `today` with the real history up to it. */
  async function graphOnPage(today: string): Promise<SVGSVGElement> {
    openHistoryOn(today);
    const graph = await screen.findByRole("img", {
      name: "Messungen und Trend, 6 Wochen, Bis heute",
    });
    // Safe: the element with this role is the graph's <svg>.
    return graph as unknown as SVGSVGElement;
  }

  it.each([
    // z 3.32, over 2.
    ["2026-10-12", true],
    // z 1.60, not over 2.
    ["2026-10-17", false],
    // z −2.50, under −2.
    ["2026-10-03", true],
    // z −1.70, not under −2.
    ["2026-09-14", false],
  ])(
    "on %s marks the measurement of the day an outlier: %s, by its z",
    async (today, outlier) => {
      const last = points(await graphOnPage(today)).at(-1);

      expect(last && isHollowRing(last)).toBe(outlier);
    },
  );
});
