"use client";

import { useEffect, useState } from "react";
import {
  ENTERED_KEY,
  enteredAfterFetch,
  parseEnteredMeasurements,
  serializeEnteredMeasurements,
} from "@/measurement/entered-measurement";
import type { Measurement } from "@/measurement/measurement";

/**
 * The measurements entered on the page that Google Health has not returned
 * yet, kept in this browser across reloads.
 */
export interface EnteredMeasurements {
  /** `null` until read from this browser, once the page is mounted. */
  measurements: Measurement[] | null;
  /** Shows `entered`, which Google Health has just taken. */
  add(entered: Measurement): void;
  /**
   * Drops the entered measurements that a fetch of `fetched`, started at
   * `startedAt`, holds or has given up on.
   */
  dropAfterFetch(fetched: Measurement[], startedAt: Date): void;
  clear(): void;
}

/**
 * The entered measurements, read from this browser once the page is mounted.
 * Each change starts from what this browser holds, not from what the page
 * shows, so it keeps what another tab has entered since.
 */
export function useEnteredMeasurements(): EnteredMeasurements {
  const [measurements, setMeasurements] = useState<Measurement[] | null>(null);

  useEffect(() => {
    setMeasurements(loadEntered());
  }, []);

  function change(next: Measurement[]) {
    saveEntered(next);
    setMeasurements(next);
  }

  return {
    measurements,
    add: (entered) => change([...loadEntered(), entered]),
    dropAfterFetch: (fetched, startedAt) =>
      change(enteredAfterFetch(loadEntered(), fetched, startedAt)),
    clear: () => change([]),
  };
}

function loadEntered(): Measurement[] {
  return parseEnteredMeasurements(localStorage.getItem(ENTERED_KEY));
}

/** Keeps `entered` in this browser; no entry at all where there are none. */
function saveEntered(entered: Measurement[]): void {
  if (entered.length === 0) localStorage.removeItem(ENTERED_KEY);
  else localStorage.setItem(ENTERED_KEY, serializeEnteredMeasurements(entered));
}
