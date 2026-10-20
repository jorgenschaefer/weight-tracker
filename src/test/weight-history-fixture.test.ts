import { describe, expect, it } from "vitest";
import { berlinDay } from "@/measurement/calendar-day";
import { weightHistory, weightHistoryUntil } from "./weight-history-fixture";

describe("weightHistory", () => {
  it("turns every row of the extract into a measurement on its Berlin day", () => {
    const history = weightHistory();
    const days = history.map((measurement) => berlinDay(measurement.time));

    expect(history).toHaveLength(97);
    expect([days[0], history[0].kg]).toEqual(["2026-07-01", 95.9]);
    expect([days.at(-1), history.at(-1)?.kg]).toEqual(["2026-10-17", 98.6]);
  });

  it("has the extract's gap, 22.9. to 1.10.", () => {
    const days: string[] = weightHistory().map((measurement) =>
      berlinDay(measurement.time),
    );

    expect(days[days.indexOf("2026-09-22") + 1]).toBe("2026-10-01");
  });
});

describe("weightHistoryUntil", () => {
  it("adds 98,4, 97,0 and 96,9 kg on 18.10. to 20.10. to the extract", () => {
    const history = weightHistoryUntil("2026-10-20");

    expect(history).toHaveLength(100);
    expect(
      history
        .slice(-3)
        .map((measurement) => [berlinDay(measurement.time), measurement.kg]),
    ).toEqual([
      ["2026-10-18", 98.4],
      ["2026-10-19", 97.0],
      ["2026-10-20", 96.9],
    ]);
  });
});
