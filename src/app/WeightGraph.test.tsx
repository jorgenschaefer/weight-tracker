import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CalendarDay } from "@/measurement/calendar-day";
import {
  type CountingMeasurement,
  countingMeasurements,
} from "@/measurement/measurement";
import { stubContainerWidth } from "@/test/container-width";
import {
  evening,
  leavePage,
  NOW,
  openOn,
  standInForGoogle,
} from "@/test/open-page";
import { weightHistory } from "@/test/weight-history-fixture";
import { type SixWeekSeries, sixWeekSeries } from "@/trend/six-week-series";
import { WeightGraph } from "./WeightGraph";

vi.mock("@/measurement/google-health", () => ({
  loadGoogleSignIn: vi.fn(),
  enterMeasurement: vi.fn(),
  signIn: vi.fn(),
  fetchMeasurements: vi.fn(),
  revokeAccess: vi.fn(),
}));

// Safe: valid `YYYY-MM-DD`s.
const october15 = "2026-10-15" as CalendarDay;
const october16 = "2026-10-16" as CalendarDay;
const october17 = "2026-10-17" as CalendarDay;

const realSeries = () =>
  sixWeekSeries(countingMeasurements(weightHistory()), october17);

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The graph, drawn into a container `width` px wide. */
async function drawGraph(
  series: SixWeekSeries,
  width = 320,
  today = october17,
): Promise<SVGSVGElement> {
  stubContainerWidth(width);
  render(<WeightGraph series={series} today={today} />);
  const graph = await screen.findByRole("img", {
    name: "Messungen und Trend der letzten sechs Wochen",
  });
  // Safe: the element with this role is the graph's <svg>.
  return graph as unknown as SVGSVGElement;
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

const corners = (piece: Element) =>
  (piece.getAttribute("points") ?? "").trim().split(/\s+/).length;

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

/** Three days up to 17.10., the second one an outlier, without a trend. */
const withOutlierInTheMiddle: SixWeekSeries = {
  measurements: [
    { measurement: measured("2026-10-15", 98.0), outlier: false },
    { measurement: measured("2026-10-16", 99.5), outlier: true },
    { measurement: measured("2026-10-17", 98.1), outlier: false },
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

    expect(points(graph).filter(isHollowRing)).toHaveLength(8);
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

  it("draws the last day's measurement as a ring as large as the full dot where it is an outlier", async () => {
    const [, , fullDot] = points(await drawGraph(withOutlierInTheMiddle));
    const fullDotRadius = radius(fullDot);
    cleanup();
    const [, ring] = points(
      await drawGraph({
        ...withOutlierInTheMiddle,
        measurements: withOutlierInTheMiddle.measurements.slice(0, 2),
      }),
    );

    expect(isHollowRing(ring)).toBe(true);
    expect(radius(ring)).toBe(fullDotRadius);
  });

  it("draws the trend as a line 3 px wide, broken at the gap from 22.9. to 1.10.", async () => {
    const series = realSeries();
    const pieces = trendPieces(await drawGraph(series));

    expect(pieces.map(corners)).toEqual(
      series.trendLine.map((piece) => piece.length),
    );
    expect(pieces).toHaveLength(2);
    for (const piece of pieces) {
      expect(piece).toHaveAttribute("fill", "none");
      expect(piece).toHaveAttribute("stroke", "currentColor");
      expect(piece).toHaveAttribute("stroke-width", "3");
    }
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
        { measurement: measured("2026-10-16", 98.0), outlier: false },
      ],
      trendLine: [
        [
          { day: october16, kg: 98.0, slopePerWeek: 0 },
          { day: october17, kg: 97.0, slopePerWeek: 0 },
        ],
      ],
    });
    const [point] = points(graph).map(centre);

    expect(trendPieces(graph)[0].getAttribute("points")?.split(" ")[0]).toBe(
      `${point.x},${point.y}`,
    );
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
    [599, "190"],
    [600, "380"],
  ])("draws a graph %d px wide %s px tall", async (width, height) => {
    expect(await drawGraph(realSeries(), width)).toHaveAttribute(
      "height",
      height,
    );
  });

  it("draws nothing where the six weeks hold no measurement", async () => {
    stubContainerWidth(320);
    const { container } = render(
      <WeightGraph
        series={{ measurements: [], trendLine: [] }}
        today={october17}
      />,
    );
    // The width arrives in the next frame.
    await act(() => new Promise(requestAnimationFrame));

    expect(container.querySelector("svg")).toBeNull();
  });

  it("marks a trend piece of a single day, after a gap, where the trend lies", async () => {
    const graph = await drawGraph({
      measurements: [
        { measurement: measured("2026-10-10", 98.0), outlier: false },
        { measurement: measured("2026-10-15", 97.6), outlier: false },
      ],
      trendLine: [[{ day: october15, kg: 97.3, slopePerWeek: 0 }]],
    });
    const [piece] = trendPieces(graph);
    const [first, ...rest] = (piece.getAttribute("points") ?? "").split(" ");

    // Its round caps draw a dot the width of the line on that one corner.
    expect(rest).toEqual([first]);
    expect(piece).toHaveAttribute("stroke-linecap", "round");
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
        { measurement: measured("2026-10-16", 99.0), outlier: false },
        { measurement: measured("2026-10-17", 99.2), outlier: false },
      ],
      trendLine: [
        [
          { day: october16, kg: 96.0, slopePerWeek: 0 },
          { day: october17, kg: 96.1, slopePerWeek: 0 },
        ],
      ],
    });
    const height = Number(graph.getAttribute("height"));

    expect(labels(graph)[0]).toBe("95");
    for (const corner of trendPieces(graph)[0]
      .getAttribute("points")
      ?.split(" ") ?? []) {
      const y = Number(corner.split(",")[1]);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(height);
    }
  });
});

describe("the outliers on the page", () => {
  beforeEach(() => standInForGoogle(NOW));
  afterEach(leavePage);

  /** The graph on the page, opened in the evening of `today` with the real history up to it. */
  async function graphOnPage(today: string): Promise<SVGSVGElement> {
    openOn(
      today,
      weightHistory().filter((m) => m.time <= evening(today)),
    );
    const graph = await screen.findByRole("img", {
      name: "Messungen und Trend der letzten sechs Wochen",
    });
    // Safe: the element with this role is the graph's <svg>.
    return graph as unknown as SVGSVGElement;
  }

  it.each([
    // 0.83 kg over a trend of 96.78 kg, beyond 1.25 × a scatter of 0.54 kg.
    ["2026-10-08", true],
    // 0.97 kg over a trend of 97.33 kg, within 1.25 × a scatter of 0.81 kg.
    ["2026-10-16", false],
    // 1.02 kg under a trend of 99.82 kg, beyond 1.25 × a scatter of 0.69 kg.
    ["2026-09-15", true],
    // 0.75 kg under a trend of 100.05 kg, within 1.25 × a scatter of 0.68 kg.
    ["2026-09-14", false],
  ])(
    "on %s marks the measurement of the day an outlier: %s, by the scatter of its day",
    async (today, outlier) => {
      const last = points(await graphOnPage(today)).at(-1);

      expect(last && isHollowRing(last)).toBe(outlier);
    },
  );
});
