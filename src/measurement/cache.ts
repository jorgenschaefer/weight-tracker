import { MS_PER_DAY } from "./calendar-day";
import { byTime, type Measurement } from "./measurement";

/**
 * The `localStorage` key of the cache. The format's version is part of the
 * key, so an entry of another version is never read as this one.
 */
export const CACHE_KEY = "gewicht:v1";

/**
 * The raw measurements of every period fetched so far, and when the last
 * fetch was.
 */
export interface MeasurementCache {
  fetchedAt: Date;
  measurements: Measurement[];
}

/** The span of time a fetch from Google Health covers, `from` and `to` included. */
export interface FetchPeriod {
  from: Date;
  to: Date;
}

/**
 * The period to fetch at `now`: the last 90 days without a valid cache;
 * otherwise the last 14 days, or everything since the last fetch where that
 * lies further back, at most the last 90 days.
 */
export function periodToFetch(
  cache: MeasurementCache | null,
  now: Date,
): FetchPeriod {
  const earliest = daysBefore(now, MAX_FETCHED_DAYS);
  if (cache === null) return { from: earliest, to: now };

  const sinceLastFetch = Math.min(
    cache.fetchedAt.getTime(),
    daysBefore(now, REFETCHED_DAYS).getTime(),
  );
  return {
    from: new Date(Math.max(sinceLastFetch, earliest.getTime())),
    to: now,
  };
}

/**
 * The cache after fetching `period`: the `fetched` measurements of the period
 * replace the cached ones of it, so corrected ones are corrected and deleted
 * ones gone; cached measurements outside it stay unchanged. The fetch is
 * dated to the end of the period.
 */
export function replaceFetchedPeriod(
  cache: MeasurementCache | null,
  period: FetchPeriod,
  fetched: Measurement[],
): MeasurementCache {
  const kept = cache === null ? [] : cache.measurements;
  const measurements = [
    ...kept.filter((m) => !isIn(period, m)),
    ...fetched.filter((m) => isIn(period, m)),
  ].toSorted(byTime);
  return { fetchedAt: period.to, measurements };
}

/** The stored form of `cache`, as kept under {@link CACHE_KEY}. */
export function serializeCache(cache: MeasurementCache): string {
  return JSON.stringify({
    fetchedAt: cache.fetchedAt.toISOString(),
    measurements: cache.measurements.map(({ time, kg }) => ({
      time: time.toISOString(),
      kg,
    })),
  });
}

/**
 * The cache stored as `stored`, or `null` where there is no valid cache: the
 * entry is missing, is not the stored form of a cache, or holds a time that is
 * not one.
 */
export function parseCache(stored: string | null): MeasurementCache | null {
  if (stored === null) return null;
  const entry = parseJson(stored);
  if (!isRecord(entry) || !Array.isArray(entry.measurements)) return null;

  const fetchedAt = parseTime(entry.fetchedAt);
  const measurements = entry.measurements.map(parseMeasurement);
  if (fetchedAt === null || !measurements.every((m) => m !== null)) {
    return null;
  }
  return { fetchedAt, measurements };
}

const REFETCHED_DAYS = 14;
const MAX_FETCHED_DAYS = 90;

function isIn(period: FetchPeriod, measurement: Measurement): boolean {
  return period.from <= measurement.time && measurement.time <= period.to;
}

function daysBefore(instant: Date, days: number): Date {
  return new Date(instant.getTime() - days * MS_PER_DAY);
}

function parseJson(stored: string): unknown {
  try {
    return JSON.parse(stored);
  } catch {
    // JSON.parse of a string throws only a SyntaxError: the entry is no JSON.
    return null;
  }
}

function parseMeasurement(stored: unknown): Measurement | null {
  if (!isRecord(stored) || typeof stored.kg !== "number") return null;
  const time = parseTime(stored.time);
  return time === null ? null : { time, kg: stored.kg };
}

/** The time written as `stored`, exactly as `toISOString` writes it. */
function parseTime(stored: unknown): Date | null {
  if (typeof stored !== "string") return null;
  const time = new Date(stored);
  if (Number.isNaN(time.getTime()) || time.toISOString() !== stored) {
    return null;
  }
  return time;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
