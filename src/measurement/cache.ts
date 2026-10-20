import { MS_PER_DAY } from "./calendar-day";
import { isRecord, parseJson } from "./json";
import { byTime, type Measurement } from "./measurement";

/**
 * The `localStorage` key of the cache. The format's version is part of the
 * key, so an entry of another version is never read as this one.
 */
export const CACHE_KEY = "gewicht:v1";

/**
 * The raw measurements of every period fetched so far, when the last fetch
 * was, and whether a fetch has reached back to {@link HISTORY_START}.
 */
export interface MeasurementCache {
  fetchedAt: Date;
  /** `false` in a cache stored before the whole history was fetched. */
  fullHistory: boolean;
  measurements: Measurement[];
}

/** The span of time a fetch from Google Health covers, `from` and `to` included. */
export interface FetchPeriod {
  from: Date;
  to: Date;
}

/**
 * The period to fetch at `now`: everything since {@link HISTORY_START} until
 * a fetch has reached back that far; after that the last 14 days, or
 * everything since the last fetch where that lies further back.
 */
export function periodToFetch(
  cache: MeasurementCache | null,
  now: Date,
): FetchPeriod {
  if (cache === null || !cache.fullHistory) {
    return { from: HISTORY_START, to: now };
  }
  const sinceLastFetch = Math.min(
    cache.fetchedAt.getTime(),
    daysBefore(now, REFETCHED_DAYS).getTime(),
  );
  return { from: new Date(sinceLastFetch), to: now };
}

/**
 * The cache after fetching `period`: the `fetched` measurements of the period
 * replace the cached ones of it, so corrected ones are corrected and deleted
 * ones gone; cached measurements outside it stay unchanged. The fetch is
 * dated to the end of the period. It holds the whole history once a fetch
 * has reached back to {@link HISTORY_START}, since each later period reaches
 * back to the fetch before it.
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
  const fullHistory =
    (cache?.fullHistory ?? false) || period.from <= HISTORY_START;
  return { fetchedAt: period.to, fullHistory, measurements };
}

/** The stored form of `cache`, as kept under {@link CACHE_KEY}. */
export function serializeCache(cache: MeasurementCache): string {
  return JSON.stringify({
    fetchedAt: cache.fetchedAt.toISOString(),
    fullHistory: cache.fullHistory,
    measurements: cache.measurements.map(toStoredMeasurement),
  });
}

/**
 * The cache stored as `stored`, or `null` where there is no valid cache: the
 * entry is missing, is not the stored form of a cache, or holds a time that is
 * not one. An entry without `fullHistory`, stored before it existed, does not
 * hold the whole history.
 */
export function parseCache(stored: string | null): MeasurementCache | null {
  if (stored === null) return null;
  const entry = parseJson(stored);
  if (!isRecord(entry) || !Array.isArray(entry.measurements)) return null;

  const fetchedAt = parseTime(entry.fetchedAt);
  const fullHistory = entry.fullHistory ?? false;
  const measurements = entry.measurements.map(parseStoredMeasurement);
  if (
    fetchedAt === null ||
    typeof fullHistory !== "boolean" ||
    !measurements.every((m) => m !== null)
  ) {
    return null;
  }
  return { fetchedAt, fullHistory, measurements };
}

/** How far back the first fetch reaches, before any weight Google Health has. */
const HISTORY_START = new Date("2000-01-01T00:00:00.000Z");
const REFETCHED_DAYS = 14;

function isIn(period: FetchPeriod, measurement: Measurement): boolean {
  return period.from <= measurement.time && measurement.time <= period.to;
}

function daysBefore(instant: Date, days: number): Date {
  return new Date(instant.getTime() - days * MS_PER_DAY);
}

/**
 * The stored form of one measurement, its time as `toISOString` writes it,
 * as the cache and the entered measurements keep it.
 */
export function toStoredMeasurement({ time, kg }: Measurement): {
  time: string;
  kg: number;
} {
  return { time: time.toISOString(), kg };
}

/**
 * The measurement stored as `stored` by {@link toStoredMeasurement}, or
 * `null` where it is not one.
 */
export function parseStoredMeasurement(stored: unknown): Measurement | null {
  if (!isRecord(stored) || typeof stored.kg !== "number") return null;
  const time = parseTime(stored.time);
  return time === null ? null : { time, kg: stored.kg };
}

/**
 * The time written as `stored`, exactly as `toISOString` writes it, or `null`
 * where it is not one.
 */
export function parseTime(stored: unknown): Date | null {
  if (typeof stored !== "string") return null;
  const time = new Date(stored);
  if (Number.isNaN(time.getTime()) || time.toISOString() !== stored) {
    return null;
  }
  return time;
}
