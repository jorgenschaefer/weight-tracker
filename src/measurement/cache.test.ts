import { describe, expect, it } from "vitest";
import {
  CACHE_KEY,
  olderPeriodToFetch,
  parseCache,
  periodToFetch,
  replaceFetchedPeriod,
  serializeCache,
} from "./cache";

const cache = {
  fetchedAt: new Date("2026-10-17T08:00:00.000Z"),
  fullHistory: true,
  measurements: [
    { time: new Date("2026-10-16T05:30:00.000Z"), kg: 98.8 },
    { time: new Date("2026-10-17T05:30:00.000Z"), kg: 98.599 },
  ],
};

describe("CACHE_KEY", () => {
  it("is the key of version 1 of the stored form", () => {
    expect(CACHE_KEY).toBe("gewicht:v1");
  });
});

describe("serializeCache", () => {
  it("stores the time of the fetch, whether it holds the whole history, and every measurement, times in ISO", () => {
    expect(JSON.parse(serializeCache(cache))).toEqual({
      fetchedAt: "2026-10-17T08:00:00.000Z",
      fullHistory: true,
      measurements: [
        { time: "2026-10-16T05:30:00.000Z", kg: 98.8 },
        { time: "2026-10-17T05:30:00.000Z", kg: 98.599 },
      ],
    });
  });
});

describe("parseCache", () => {
  it("reads back what was stored", () => {
    expect(parseCache(serializeCache(cache))).toEqual(cache);
  });

  it("reads a cache without measurements", () => {
    expect(
      parseCache(
        '{"fetchedAt":"2026-10-17T08:00:00.000Z","fullHistory":false,"measurements":[]}',
      ),
    ).toEqual({
      fetchedAt: new Date("2026-10-17T08:00:00.000Z"),
      fullHistory: false,
      measurements: [],
    });
  });

  it("reads a cache from before the whole history was fetched as not holding it", () => {
    expect(
      parseCache('{"fetchedAt":"2026-10-17T08:00:00.000Z","measurements":[]}'),
    ).toEqual({
      fetchedAt: new Date("2026-10-17T08:00:00.000Z"),
      fullHistory: false,
      measurements: [],
    });
  });

  it("finds no valid cache where there is no entry", () => {
    expect(parseCache(null)).toBeNull();
  });

  const valid = { time: "2026-10-17T05:30:00.000Z", kg: 98.6 };
  it.each([
    ["an empty entry", ""],
    ["no JSON", "gewicht"],
    ["cut-off JSON", '{"fetchedAt":"2026-10-17T08:00:00.000Z","measurem'],
    ["JSON null", "null"],
    ["a JSON list", "[]"],
    ["no time of the fetch", JSON.stringify({ measurements: [valid] })],
    [
      "a time of the fetch that is no time",
      JSON.stringify({ fetchedAt: "gestern", measurements: [valid] }),
    ],
    [
      "a time of the fetch that is a number",
      JSON.stringify({ fetchedAt: 1792224000000, measurements: [valid] }),
    ],
    [
      "a whole history that is no truth value",
      JSON.stringify({
        fetchedAt: valid.time,
        fullHistory: "ja",
        measurements: [valid],
      }),
    ],
    ["no measurements", JSON.stringify({ fetchedAt: valid.time })],
    [
      "measurements that are no list",
      JSON.stringify({ fetchedAt: valid.time, measurements: {} }),
    ],
    [
      "a measurement that is null",
      JSON.stringify({ fetchedAt: valid.time, measurements: [valid, null] }),
    ],
    [
      "a measurement without time",
      JSON.stringify({ fetchedAt: valid.time, measurements: [{ kg: 98.6 }] }),
    ],
    [
      "a measurement whose time is no time",
      JSON.stringify({
        fetchedAt: valid.time,
        measurements: [{ time: "2026-13-01", kg: 98.6 }],
      }),
    ],
    [
      "a measurement whose time is not in the stored form",
      JSON.stringify({
        fetchedAt: valid.time,
        measurements: [{ time: "2026-10-17T07:30:00+02:00", kg: 98.6 }],
      }),
    ],
    [
      "a measurement without weight",
      JSON.stringify({
        fetchedAt: valid.time,
        measurements: [{ time: valid.time }],
      }),
    ],
    [
      "a measurement whose weight is text",
      JSON.stringify({
        fetchedAt: valid.time,
        measurements: [{ time: valid.time, kg: "98,6" }],
      }),
    ],
    [
      "a measurement whose weight is null",
      '{"fetchedAt":"2026-10-17T08:00:00.000Z","measurements":[{"time":"2026-10-17T05:30:00.000Z","kg":null}]}',
    ],
  ])("finds no valid cache in %s", (_, stored) => {
    expect(parseCache(stored)).toBeNull();
  });
});
const now = new Date("2026-10-17T08:00:00.000Z");
const daysBeforeNow = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
const HISTORY_START = new Date("2000-01-01T00:00:00.000Z");
const fetchedDaysAgo = (days: number, fullHistory = true) => ({
  fetchedAt: daysBeforeNow(days),
  fullHistory,
  measurements: [],
});

describe("periodToFetch", () => {
  it("fetches the last 90 days first without a valid cache", () => {
    expect(periodToFetch(null, now)).toEqual({
      from: daysBeforeNow(90),
      to: now,
    });
  });

  it.each([
    ["an hour ago", 1 / 24],
    ["three years ago", 3 * 365],
  ])(
    "fetches the last 90 days first after a fetch of less than the whole history %s",
    (_, fetchedAgo) => {
      expect(periodToFetch(fetchedDaysAgo(fetchedAgo, false), now)).toEqual({
        from: daysBeforeNow(90),
        to: now,
      });
    },
  );

  it.each([
    ["the last 14 days after a fetch an hour ago", 1 / 24, 14],
    ["the last 14 days after a fetch 13 days ago", 13, 14],
    ["the last 14 days after a fetch exactly 14 days ago", 14, 14],
    ["everything since a fetch 20 days ago", 20, 20],
    ["everything since a fetch 91 days ago", 91, 91],
    ["everything since a fetch three years ago", 3 * 365, 3 * 365],
    ["the last 14 days after a fetch dated after now", -1, 14],
  ])("fetches %s", (_, fetchedAgo, days) => {
    expect(periodToFetch(fetchedDaysAgo(fetchedAgo), now)).toEqual({
      from: daysBeforeNow(days),
      to: now,
    });
  });
});

describe("olderPeriodToFetch", () => {
  it.each([
    ["an hour ago", 1 / 24],
    ["three years ago", 3 * 365],
  ])(
    "fetches everything since 1.1.2000 after a fetch of less than the whole history %s",
    (_, fetchedAgo) => {
      expect(
        olderPeriodToFetch(fetchedDaysAgo(fetchedAgo, false), now),
      ).toEqual({ from: HISTORY_START, to: now });
    },
  );

  it("fetches nothing more where the cache holds the whole history", () => {
    expect(olderPeriodToFetch(fetchedDaysAgo(1 / 24), now)).toBeNull();
  });
});

describe("replaceFetchedPeriod", () => {
  const period = { from: daysBeforeNow(14), to: now };
  const at = (time: string, kg: number) => ({ time: new Date(time), kg });

  it("caches the fetched measurements without a valid cache, dated to the end of the period", () => {
    const fetched = [
      at("2026-10-16T05:30:00Z", 98.8),
      at("2026-10-17T05:30:00Z", 98.6),
    ];

    expect(replaceFetchedPeriod(null, period, fetched)).toEqual({
      fetchedAt: now,
      fullHistory: false,
      measurements: fetched,
    });
  });

  it.each([
    ["fetching everything since 1.1.2000", null, HISTORY_START, true],
    [
      "fetching everything since 1.1.2000 into a cache without it",
      false,
      HISTORY_START,
      true,
    ],
    [
      "fetching less after the whole history was fetched",
      true,
      daysBeforeNow(14),
      true,
    ],
    [
      "fetching less into a cache without the whole history",
      false,
      daysBeforeNow(14),
      false,
    ],
  ])(
    "knows whether it holds the whole history after %s",
    (_, cachedWhole, from, whole) => {
      const cached =
        cachedWhole === null
          ? null
          : {
              fetchedAt: daysBeforeNow(1),
              fullHistory: cachedWhole,
              measurements: [],
            };

      expect(
        replaceFetchedPeriod(cached, { from, to: now }, []).fullHistory,
      ).toBe(whole);
    },
  );

  it("replaces the cached measurements of the period and keeps the older ones", () => {
    const cache = {
      fetchedAt: daysBeforeNow(2),
      fullHistory: true,
      measurements: [
        at("2026-09-01T05:30:00Z", 101.0), // before the period: stays
        at("2026-10-03T07:59:59Z", 100.2), // a second before the period: stays
        at("2026-10-03T08:00:00Z", 100.1), // the period's first instant: replaced
        at("2026-10-10T05:30:00Z", 99.9), // corrected in Google Health
        at("2026-10-12T05:30:00Z", 99.5), // deleted in Google Health
      ],
    };
    const fetched = [
      at("2026-10-03T08:00:00Z", 100.0),
      at("2026-10-10T05:30:00Z", 99.4),
      at("2026-10-17T05:30:00Z", 98.6), // new
    ];

    expect(replaceFetchedPeriod(cache, period, fetched)).toEqual({
      fetchedAt: now,
      fullHistory: true,
      measurements: [
        at("2026-09-01T05:30:00Z", 101.0),
        at("2026-10-03T07:59:59Z", 100.2),
        at("2026-10-03T08:00:00Z", 100.0),
        at("2026-10-10T05:30:00Z", 99.4),
        at("2026-10-17T05:30:00Z", 98.6),
      ],
    });
  });

  it("empties the period where Google Health returns nothing for it", () => {
    const cache = {
      fetchedAt: daysBeforeNow(2),
      fullHistory: true,
      measurements: [
        at("2026-09-01T05:30:00Z", 101.0),
        at("2026-10-12T05:30:00Z", 99.5),
      ],
    };

    expect(replaceFetchedPeriod(cache, period, [])).toEqual({
      fetchedAt: now,
      fullHistory: true,
      measurements: [at("2026-09-01T05:30:00Z", 101.0)],
    });
  });

  it("leaves the cache outside the period alone even where Google Health returns measurements outside it", () => {
    const cache = {
      fetchedAt: daysBeforeNow(2),
      fullHistory: true,
      measurements: [at("2026-09-01T05:30:00Z", 101.0)],
    };
    const fetched = [
      at("2026-09-01T05:30:00Z", 101.0),
      at("2026-10-17T05:30:00Z", 98.6),
    ];

    expect(replaceFetchedPeriod(cache, period, fetched)).toEqual({
      fetchedAt: now,
      fullHistory: true,
      measurements: [
        at("2026-09-01T05:30:00Z", 101.0),
        at("2026-10-17T05:30:00Z", 98.6),
      ],
    });
  });

  it("keeps the measurements in time order whatever order Google Health returns them in", () => {
    const cache = {
      fetchedAt: daysBeforeNow(2),
      fullHistory: true,
      measurements: [
        at("2026-10-12T05:30:00Z", 99.5),
        at("2026-09-01T05:30:00Z", 101.0),
      ],
    };
    const fetched = [
      at("2026-10-17T05:30:00Z", 98.6),
      at("2026-10-16T05:30:00Z", 98.8),
    ];

    expect(replaceFetchedPeriod(cache, period, fetched).measurements).toEqual([
      at("2026-09-01T05:30:00Z", 101.0),
      at("2026-10-16T05:30:00Z", 98.8),
      at("2026-10-17T05:30:00Z", 98.6),
    ]);
  });
});
