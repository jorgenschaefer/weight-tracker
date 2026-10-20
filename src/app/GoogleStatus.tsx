import { Text, UnstyledButton, VisuallyHidden } from "@mantine/core";
import { useState } from "react";
import type { CalendarDay } from "@/measurement/calendar-day";
import classes from "./GoogleStatus.module.css";
import {
  lastFetch,
  type StatusMark,
  signedInUntil,
  statusLine,
} from "./google-status";
import { Sheet } from "./Sheet";
import type { Measurements } from "./useMeasurements";

/**
 * The status line - „Google Health“ over what the page is doing with it, the
 * mark of the sign-in before it - and ⟳ beside it, on a page that judges on
 * `today`. A tap on either signs in and fetches where the page is not signed
 * in, and ⟳ fetches where it is; neither does anything while something runs.
 * Where the page is signed in, a tap on the status line opens its sheet,
 * whatever runs. Before the page has read this browser, `measurements` is
 * `null` and only „Google Health“ stands there, taking no tap.
 */
export function GoogleStatus({
  measurements,
  today,
}: {
  measurements: Measurements | null;
  today: CalendarDay;
}) {
  const [sheetOpened, setSheetOpened] = useState(false);
  // The sheet closes by itself once the sign-in ends - on „Abmelden“ or as
  // it expires - and does not open again with the next one.
  const signIn = measurements?.signIn ?? null;
  if (sheetOpened && signIn === null) setSheetOpened(false);

  if (measurements === null) {
    return (
      <div className={classes.status}>
        <UnstyledButton className={classes.line} disabled>
          <span className={classes.mark} />
          <span className={classes.text}>Google Health</span>
          <Chevron />
        </UnstyledButton>
        <UnstyledButton
          className={classes.refresh}
          aria-label="Abrufen"
          disabled
        >
          <Refresh />
        </UnstyledButton>
      </div>
    );
  }

  const { mark, detail, busy } = statusLine(
    {
      signedIn: signIn !== null,
      signingIn: measurements.signingIn,
      savingKg: measurements.savingKg,
      fetching: measurements.fetching,
      fetchFailure: measurements.fetchFailure,
      fetchedAt: measurements.cache?.fetchedAt ?? null,
    },
    today,
  );
  const name = `Google Health, ${detail}`;
  return (
    <div className={classes.status}>
      <UnstyledButton
        className={classes.line}
        aria-label={name}
        data-failed={mark === "failed" || undefined}
        onClick={() => {
          if (signIn !== null) setSheetOpened(true);
          else if (!busy) measurements.fetchData();
        }}
      >
        <span className={classes.mark} data-mark={mark}>
          <Mark mark={mark} />
        </span>
        <span className={classes.text}>
          <span>Google Health</span>
          <span className={classes.detail} data-detail>
            {detail}
          </span>
        </span>
        <Chevron />
      </UnstyledButton>
      <UnstyledButton
        className={classes.refresh}
        aria-label={signIn !== null ? "Abrufen" : "Anmelden und abrufen"}
        data-busy={busy || undefined}
        disabled={busy}
        onClick={measurements.fetchData}
      >
        <Refresh />
      </UnstyledButton>
      {/* The buttons' names change silently; this says each new state. */}
      <VisuallyHidden role="status" aria-live="polite">
        {name}
      </VisuallyHidden>
      {signIn !== null && (
        <Sheet
          title="Google Health"
          opened={sheetOpened}
          onClose={() => setSheetOpened(false)}
        >
          <Text className={classes.sheetLine}>{signedInUntil(signIn)}</Text>
          <Text className={classes.sheetLine}>
            {lastFetch(measurements.cache?.fetchedAt ?? null, today)}
          </Text>
          <UnstyledButton
            className={classes.logOut}
            onClick={measurements.logOut}
          >
            Abmelden
          </UnstyledButton>
        </Sheet>
      )}
    </div>
  );
}

function Mark({ mark }: { mark: StatusMark }) {
  switch (mark) {
    case "signedIn":
      return <span className={classes.dot} />;
    case "signedOut":
      return <span className={classes.circle} />;
    case "failed":
      return (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
      );
  }
}

function Chevron() {
  return (
    <svg
      className={classes.chevron}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function Refresh() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 4v5h-5" />
    </svg>
  );
}
