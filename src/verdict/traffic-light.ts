import type { Trend } from "@/trend/trend";

/**
 * The Ampel of a day: green where the pace lies under
 * {@link LOSS_THRESHOLD_KG_PER_WEEK} with more than {@link CONFIDENCE}
 * probability, red where it lies not under it with more than that, otherwise
 * yellow. It depends on its day alone.
 */
export type TrafficLight = "green" | "yellow" | "red";

/** The probability that the pace of `trend` lies under -0.1 kg per week. */
export function lossCertainty(trend: Trend): number {
  const sd = Math.sqrt(trend.paceVariance);
  return 1 - normalCdf((trend.pace - LOSS_THRESHOLD_KG_PER_WEEK) / sd);
}

/**
 * Whether a loss is at least as likely as none, at `certainty`, a
 * {@link lossCertainty}.
 */
export function isLossLikelier(certainty: number): boolean {
  return certainty >= EVEN_CHANCE;
}

/** The Ampel of the day of `trend`. */
export function trafficLight(trend: Trend): TrafficLight {
  const certainty = lossCertainty(trend);
  if (certainty > CONFIDENCE) return "green";
  if (1 - certainty > CONFIDENCE) return "red";
  return "yellow";
}

// `analysis/kalman/kalman.py` uses the same values, and the two change
// together.
/** The pace a loss worth the name lies under, in kg per week. */
const LOSS_THRESHOLD_KG_PER_WEEK = -0.1;
/** How likely a side has to be for green or red. */
const CONFIDENCE = 0.8;
/** From this {@link lossCertainty} on, a loss is the likelier side. */
const EVEN_CHANCE = 0.5;

/** The probability that a standard normal value lies under `x`. */
function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

// JavaScript has no erf: this is the series near 0 and the continued fraction
// for erfc further out from CPython's C source. On -6 to 6 it differs from
// Python's `math.erf`, which `kalman.py` uses, by at most about 4e-16.
const ERF_SERIES_CUTOFF = 1.5;
const ERF_SERIES_TERMS = 25;
const ERFC_CONTFRAC_CUTOFF = 30;
const ERFC_CONTFRAC_TERMS = 50;

function erf(x: number): number {
  if (Math.abs(x) < ERF_SERIES_CUTOFF) return erfSeries(x);
  const erfc = erfcContinuedFraction(Math.abs(x));
  return x > 0 ? 1 - erfc : erfc - 1;
}

function erfSeries(x: number): number {
  const x2 = x * x;
  let acc = 0;
  let fk = ERF_SERIES_TERMS + 0.5;
  for (let i = 0; i < ERF_SERIES_TERMS; i++) {
    acc = 2 + (x2 * acc) / fk;
    fk -= 1;
  }
  return (acc * x * Math.exp(-x2)) / Math.sqrt(Math.PI);
}

/** erfc(`x`) for `x` of at least {@link ERF_SERIES_CUTOFF}. */
function erfcContinuedFraction(x: number): number {
  if (x >= ERFC_CONTFRAC_CUTOFF) return 0;
  const x2 = x * x;
  let a = 0;
  let da = 0.5;
  let p = 1;
  let pLast = 0;
  let q = da + x2;
  let qLast = 1;
  for (let i = 0; i < ERFC_CONTFRAC_TERMS; i++) {
    a += da;
    da += 2;
    const b = da + x2;
    [p, pLast] = [b * p - a * pLast, p];
    [q, qLast] = [b * q - a * qLast, q];
  }
  return ((p / q) * x * Math.exp(-x2)) / Math.sqrt(Math.PI);
}
