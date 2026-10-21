"use client";

import { Anchor, Text } from "@mantine/core";
import { type RefObject, useEffect, useRef, useState } from "react";
import { berlinDay, type CalendarDay } from "@/measurement/calendar-day";
import type { GoogleHealthError } from "@/measurement/google-health";
import {
  countingMeasurements,
  latestMeasurement,
  type Measurement,
} from "@/measurement/measurement";
import {
  earlierWindow,
  type GraphWindow,
  hasEarlierWindow,
  hasLaterWindow,
  laterWindow,
  type Span,
  windowHolding,
  windowOnSwitch,
  windowUpTo,
} from "@/trend/graph-window/graph-window";
import {
  type WindowSeries,
  windowSeries,
} from "@/trend/graph-window/window-series";
import {
  type Assessment,
  assess,
  isEarlierDay,
  measurementsKnownOn,
} from "@/verdict/assessment";
import { type EnterWeight, EntrySheet } from "./EntrySheet";
import { failureReason } from "./failure-reason";
import {
  formatCalendarDaySeenFrom,
  formatKg,
  formatRange,
  formatTime,
} from "./format";
import { GoogleStatus } from "./GoogleStatus";
import classes from "./page.module.css";
import { ShownDayAnnouncement, ShownDayBand } from "./ShownDayBand";
import { SpanToggle } from "./SpanToggle";
import { type Measurements, useMeasurements } from "./useMeasurements";
import {
  Figures,
  NEUTRAL,
  type SurfaceColours,
  surfaceColours,
  Verdict,
} from "./Verdict";
import { WeightGraph } from "./WeightGraph";
import { WindowBar } from "./WindowBar";

export default function Page() {
  const measurements = useMeasurements();
  const today = useToday();
  const [chosenDay, setChosenDay] = useChosenDay(
    measurements?.fetchFailure ?? null,
  );
  const {
    span,
    graphWindow,
    chooseSpan,
    showEarlier,
    showLater,
    showWindowHolding,
    showWindowUpToToday,
  } = useGraphWindow(today);
  const graph = useRef<SVGSVGElement>(null);
  if (measurements === null) {
    return (
      <Surface
        colours={NEUTRAL}
        todayColours={NEUTRAL}
        measurements={null}
        onEnter={null}
        today={today}
        latestKg={null}
        shown={null}
      />
    );
  }
  const { cache, enteredMeasurements } = measurements;
  if (cache === null && enteredMeasurements.length === 0) {
    return (
      <Surface
        colours={NEUTRAL}
        todayColours={NEUTRAL}
        measurements={measurements}
        onEnter={measurements.enter}
        today={today}
        latestKg={null}
        shown={null}
      >
        <FirstVisit measurements={measurements} />
      </Surface>
    );
  }
  const all = [...(cache?.measurements ?? []), ...enteredMeasurements];
  const counting = countingMeasurements(all);
  // A day chosen that is no earlier day shows today and ends the choice: the
  // last day with a measurement, chosen in the graph, or a day whose counting
  // measurement, or those after it, a fetch took, so a later fetch that
  // brings them back does not bring it back too.
  const shownDay =
    chosenDay !== null && isEarlierDay(counting, chosenDay) ? chosenDay : null;
  if (shownDay !== chosenDay) setChosenDay(null);
  const latestToday = latestMeasurement(all);
  const assessmentToday = assess(counting, today);
  const firstMeasuredDay = counting.at(0)?.day;
  const known = shownDay === null ? all : measurementsKnownOn(all, shownDay);
  const assessment =
    shownDay === null
      ? assessmentToday
      : assess(countingMeasurements(known), shownDay);
  const colours = surfaceColours(assessment.status);
  // ← and → choose days outside the window too, which the graph then shows.
  const stepToDay = (day: CalendarDay) => {
    setChosenDay(day);
    showWindowHolding(day);
  };
  // The graph takes the focus, ringed only where the keyboard brought it,
  // as after a tap the page is to look as if no day had been chosen.
  const backToToday = (byKeyboard: boolean) => {
    setChosenDay(null);
    showWindowUpToToday();
    graph.current?.focus({ focusVisible: byKeyboard });
  };
  // A weight entered is today's, so the page shows today once it is saved.
  const enter: EnterWeight = async (kg) => {
    const saved = await measurements.enter(kg);
    if (saved.ok) {
      setChosenDay(null);
      showWindowUpToToday();
    }
    return saved;
  };
  return (
    <Surface
      colours={colours}
      todayColours={surfaceColours(assessmentToday.status)}
      measurements={measurements}
      onEnter={enter}
      today={today}
      latestKg={latestToday?.kg ?? null}
      shown={shownDay === null ? null : { day: shownDay, backToToday }}
    >
      <CachedMeasurements
        latest={latestMeasurement(known)}
        assessment={assessment}
        graph={{
          series: windowSeries(counting, graphWindow),
          span,
          onChooseSpan: chooseSpan,
          graphWindow,
          range: formatRange(span, graphWindow, today),
          onEarlier:
            firstMeasuredDay !== undefined &&
            hasEarlierWindow(graphWindow, firstMeasuredDay)
              ? showEarlier
              : null,
          onLater: hasLaterWindow(graphWindow, today) ? showLater : null,
          measuredDays: counting.map(({ day }) => day),
          shownDay,
          onChooseDay: setChosenDay,
          onStepToDay: stepToDay,
          colours,
          ref: graph,
        }}
        today={today}
        measurements={measurements}
      />
    </Surface>
  );
}

/**
 * Today in Berlin, read again whenever the page comes back into view: a tab
 * left open overnight judges on the day it is shown, not the day it opened.
 */
function useToday(): CalendarDay {
  const [today, setToday] = useState(() => berlinDay(new Date()));
  useEffect(() => {
    const readClock = () => setToday(berlinDay(new Date()));
    document.addEventListener("visibilitychange", readClock);
    return () => document.removeEventListener("visibilitychange", readClock);
  }, []);
  return today;
}

/**
 * The span chosen and the window of it the graph shows: the window up to
 * today, which moves on with today, until ‹ ›, or a day chosen outside it,
 * show an earlier one. Opened anew, the page shows „6 Wochen“ up to today.
 */
function useGraphWindow(today: CalendarDay) {
  const [span, setSpan] = useState<Span>("sixWeeks");
  // The earlier window ‹ › show; `null` for the window up to today.
  const [pastWindow, setPastWindow] = useState<GraphWindow | null>(null);
  const graphWindow = pastWindow ?? windowUpTo(span, today);
  return {
    span,
    graphWindow,
    chooseSpan(chosen: Span) {
      setSpan(chosen);
      setPastWindow(windowOnSwitch(chosen, graphWindow, today));
    },
    showEarlier: () => setPastWindow(earlierWindow(span, graphWindow)),
    showLater: () => setPastWindow(laterWindow(span, graphWindow, today)),
    showWindowHolding: (day: CalendarDay) =>
      setPastWindow(windowHolding(span, graphWindow, day, today)),
    showWindowUpToToday: () => setPastWindow(null),
  };
}

/**
 * The earlier day chosen in the graph, whose page is shown while it is still
 * an earlier day; `null` for today. The page comes back into view on today,
 * as it opens on it, and shows today as a fetch fails, so the status line can
 * say why: a new `fetchFailure`, not one that still stands from before.
 */
function useChosenDay(fetchFailure: GoogleHealthError | null) {
  const [chosenDay, setChosenDay] = useState<CalendarDay | null>(null);
  const [failureSeen, setFailureSeen] = useState(fetchFailure);
  if (fetchFailure !== failureSeen) {
    setFailureSeen(fetchFailure);
    if (fetchFailure !== null) setChosenDay(null);
  }
  useEffect(() => {
    const showToday = () => {
      if (document.visibilityState === "visible") setChosenDay(null);
    };
    document.addEventListener("visibilitychange", showToday);
    return () => document.removeEventListener("visibilitychange", showToday);
  }, []);
  return [chosenDay, setChosenDay] as const;
}

/**
 * The colour field: the whole screen, its content in the middle under the
 * status line, and the button to enter a weight, in every state of the page.
 * The browser around the page, Android's status bar and address bar, takes
 * its colour. `measurements` is `null` for the moment before the page has
 * read its cache, in which neither the status line nor the button does
 * anything; the button enters with `onEnter`. The page shown takes
 * `colours`; the sheet to enter a weight takes today's, `todayColours`, and
 * suggests today's Letzte Messung, `latestKg`. While the page of an earlier
 * day is `shown`, its band stands in place of the status line.
 */
function Surface({
  colours,
  todayColours,
  measurements,
  onEnter,
  today,
  latestKg,
  shown,
  children,
}: {
  colours: SurfaceColours;
  todayColours: SurfaceColours;
  measurements: Measurements | null;
  onEnter: EnterWeight | null;
  today: CalendarDay;
  latestKg: number | null;
  shown: {
    day: CalendarDay;
    backToToday: (byKeyboard: boolean) => void;
  } | null;
  children?: React.ReactNode;
}) {
  return (
    <main
      className={classes.surface}
      style={{ backgroundColor: colours.surface, color: colours.ink }}
    >
      {/* React moves it into <head> and keeps it there in step. */}
      <meta name="theme-color" content={colours.surface} />
      <div className={classes.content}>
        {shown === null ? (
          <GoogleStatus measurements={measurements} today={today} />
        ) : (
          <ShownDayBand
            shownDay={shown.day}
            today={today}
            colours={colours}
            onBackToToday={shown.backToToday}
          />
        )}
        <ShownDayAnnouncement shownDay={shown?.day ?? null} today={today} />
        {children}
      </div>
      <EntrySheet
        colours={colours}
        todayColours={todayColours}
        onEnter={onEnter}
        latestKg={latestKg}
      />
    </main>
  );
}

/**
 * The page before the first fetch: what it does, and, while the page is not
 * signed in, where to sign in. A failed „Abmelden“ ends here.
 */
function FirstVisit({ measurements }: { measurements: Measurements }) {
  return (
    <>
      <Text className={classes.intro}>
        Diese Seite liest deine Gewichtsmessungen aus Google Health, trägt neue
        ein und zeigt dir, ob du noch abnimmst.
      </Text>
      {/* Signed in, a tap on the line opens its sheet instead. */}
      {measurements.signIn === null && (
        <Text className={classes.hint}>
          Tippe oben auf die Zeile, um dich bei Google anzumelden.
        </Text>
      )}
      <RevokeFailure error={measurements.revokeFailure} />
    </>
  );
}

/**
 * The page from the cached measurements and those entered that Google Health
 * has not returned yet: their newest, `latest`, the verdict and the four
 * figures of the day shown, and under them the toggle of the span, the range
 * of its window with ‹ › and the graph of the window, in which an earlier
 * day is chosen.
 */
function CachedMeasurements({
  latest,
  assessment,
  graph,
  today,
  measurements,
}: {
  latest: Measurement | null;
  assessment: Assessment;
  graph: {
    series: WindowSeries;
    span: Span;
    onChooseSpan: (span: Span) => void;
    graphWindow: GraphWindow;
    range: string;
    onEarlier: (() => void) | null;
    onLater: (() => void) | null;
    measuredDays: CalendarDay[];
    shownDay: CalendarDay | null;
    onChooseDay: (day: CalendarDay | null) => void;
    onStepToDay: (day: CalendarDay) => void;
    colours: SurfaceColours;
    ref: RefObject<SVGSVGElement | null>;
  };
  today: CalendarDay;
  measurements: Measurements;
}) {
  return (
    <>
      <div className={classes.summary}>
        <div>
          <LatestMeasurement
            latest={latest}
            today={today}
            enteredMeasurements={measurements.enteredMeasurements}
          />
          <RevokeFailure error={measurements.revokeFailure} />
          <section>
            <Verdict status={assessment.status} />
          </section>
        </div>
        <Figures assessment={assessment} />
      </div>
      {/* Without any measurement, there is nothing to show over time. */}
      {latest !== null && (
        <>
          <SpanToggle
            span={graph.span}
            colours={graph.colours}
            onChoose={graph.onChooseSpan}
          />
          <WindowBar
            range={graph.range}
            onEarlier={graph.onEarlier}
            onLater={graph.onLater}
          />
          <div className={classes.graph}>
            <WeightGraph
              series={graph.series}
              span={graph.span}
              graphWindow={graph.graphWindow}
              today={today}
              measuredDays={graph.measuredDays}
              shownDay={graph.shownDay}
              onChooseDay={graph.onChooseDay}
              onStepToDay={graph.onStepToDay}
              surface={graph.colours.surface}
              ref={graph.ref}
            />
          </div>
        </>
      )}
    </>
  );
}

/**
 * „Letzte Messung“: the newest measurement, counting or not, its day with the
 * year where that is not the year of `today`, and whether it is one entered
 * that no fetch has held yet.
 */
function LatestMeasurement({
  latest,
  today,
  enteredMeasurements,
}: {
  latest: Measurement | null;
  today: CalendarDay;
  enteredMeasurements: Measurement[];
}) {
  if (latest === null) {
    return (
      <Text className={classes.latest}>
        Noch keine Messung in Google Health
      </Text>
    );
  }
  const notYetFetched = enteredMeasurements.includes(latest)
    ? ", noch nicht aus Google Health abgerufen"
    : "";
  return (
    <Text className={classes.latest}>
      {`Letzte Messung ${formatCalendarDaySeenFrom(berlinDay(latest.time), today)} um ${formatTime(latest.time)} Uhr: ${formatKg(latest.kg)} kg${notYetFetched}`}
    </Text>
  );
}

/**
 * Why revoking the page's access failed, and where to remove it instead;
 * nothing where it did not fail.
 */
function RevokeFailure({ error }: { error: GoogleHealthError | null }) {
  if (error === null) return null;
  return (
    <div className={classes.problem} role="alert">
      <Text inherit>{`Widerruf fehlgeschlagen: ${failureReason(error)}`}</Text>
      <Text inherit>
        Die Seite darf deine Gewichtsmessungen weiter lesen und eintragen. Den
        Zugriff entfernst du in{" "}
        <Anchor
          inherit
          underline="always"
          c="inherit"
          href="https://myaccount.google.com/connections"
        >
          deinem Google-Konto
        </Anchor>
        .
      </Text>
    </div>
  );
}
