import type { PaceBand } from "@/trend/pace";
import type { Assessment, AssessmentStatus } from "@/verdict/assessment";
import { CONFIRMATION_DAYS, type DaysWithoutDecrease } from "@/verdict/verdict";
import {
  formatCalendarDay,
  formatKg,
  formatKgChange,
  formatPace,
} from "./format";
import classes from "./Verdict.module.css";

/**
 * The verdict, or why there is none, from `assessment`: the headline, the
 * sentence under it where it has one, and the pace band. The headline grows
 * wider and heavier with the level of a no-decrease verdict.
 */
export function Verdict({ assessment }: { assessment: Assessment }) {
  const { status, pace } = assessment;
  const sentence = explanation(status);
  return (
    <>
      <h1 className={classes.headline} data-emphasis={emphasis(status)}>
        {headline(status)}
      </h1>
      {sentence !== null && <p className={classes.explanation}>{sentence}</p>}
      {pace !== null && <p className={classes.band}>{BAND_NAMES[pace.band]}</p>}
    </>
  );
}

/** Trend, „Gemessen“ and the 4-week pace of `assessment`, each where it has one. */
export function Figures({ assessment }: { assessment: Assessment }) {
  const { trendKg, measuredKg, pace } = assessment;
  if (trendKg === null && measuredKg === null && pace === null) return null;
  return (
    <dl className={classes.figures}>
      {trendKg !== null && (
        <Figure label="Trend" value={formatKg(trendKg)} unit="kg" />
      )}
      {measuredKg !== null && (
        <Figure label="Gemessen" value={formatKg(measuredKg)} unit="kg" />
      )}
      {pace !== null && (
        <Figure
          label="Tempo 4 Wochen"
          value={formatPace(pace.kgPerWeek)}
          unit="kg pro Woche"
        />
      )}
    </dl>
  );
}

/** The colours of the surface: its background and the text on it. */
export interface SurfaceColours {
  surface: string;
  ink: string;
}

export const NEUTRAL: SurfaceColours = { surface: "#DDE1E5", ink: "#20262C" };

/**
 * The colours of the surface under `status`: blue while losing, escalating
 * with the level of no decrease, under „Nimmt zu“ too, orange for a clear
 * increase after a gap, neutral for everything else.
 */
export function surfaceColours(status: AssessmentStatus): SurfaceColours {
  switch (status.kind) {
    case "losing":
      return { surface: "#D5E4F1", ink: "#10355A" };
    case "noDecrease":
    case "gaining":
      return LEVEL_COLOURS[status.level];
    case "gapComparison":
      return status.variation === "clearIncrease" ? LEVEL_COLOURS[2] : NEUTRAL;
    case "lastMeasurementTooOld":
    case "noVerdictYet":
      return NEUTRAL;
  }
}

const LEVEL_COLOURS: Record<1 | 2 | 3, SurfaceColours> = {
  1: { surface: "#F5E1CB", ink: "#5A2C06" },
  2: { surface: "#EDA562", ink: "#3A1801" },
  3: { surface: "#8A380A", ink: "#FFF3E8" },
};

function headline(status: AssessmentStatus): string {
  switch (status.kind) {
    case "losing":
      return "Nimmt ab";
    case "noDecrease":
      return noDecreaseFor(status);
    case "gaining":
      return "Nimmt zu";
    case "gapComparison":
      return `Nach ${status.gapDays} Tagen ohne Messung: ${formatKgChange(status.differenceKg)} kg gegenüber vorher`;
    case "lastMeasurementTooOld":
      return `Letzte Messung vor ${status.days} Tagen`;
    case "noVerdictYet":
      return "Noch kein Urteil";
  }
}

/** How the headline is set, as `Verdict.module.css` names it. */
function emphasis(status: AssessmentStatus): string {
  switch (status.kind) {
    case "losing":
    case "gaining":
      return "short";
    case "noDecrease":
      return `level${status.level}`;
    case "gapComparison":
    case "lastMeasurementTooOld":
    case "noVerdictYet":
      return "statement";
  }
}

/** The sentence under the headline, where it has one. */
function explanation(status: AssessmentStatus): string | null {
  switch (status.kind) {
    case "noDecrease":
      // Where no trend fell, there is no day it fell until.
      if (status.atLeast) return null;
      return `Zuletzt abgenommen bis ${formatCalendarDay(status.since)}`;
    case "gaining":
      return gainingExplanation(status);
    case "gapComparison":
      return `${status.variation === "withinNormalVariation" ? "Im Rahmen der normalen Schwankung." : "Deutlich mehr als die normale Schwankung."} Ein Urteil gibt es wieder ab der 5. Messung nach der Lücke.`;
    case "noVerdictYet":
      return "Ein Urteil gibt es ab der 5. Messung.";
    case "losing":
    case "lastMeasurementTooOld":
      return null;
  }
}

/** Under „Nimmt zu“, the days without a decrease that would otherwise be the headline. */
function gainingExplanation(status: DaysWithoutDecrease): string {
  if (status.atLeast) return noDecreaseFor(status);
  const until = `abgenommen bis ${formatCalendarDay(status.since)}`;
  if (status.days < CONFIRMATION_DAYS) return `Zuletzt ${until}`;
  return `${noDecreaseFor(status)}, zuletzt ${until}`;
}

/** „Seit (mindestens) N Tagen kein Abnehmen“. */
function noDecreaseFor(status: DaysWithoutDecrease): string {
  return status.atLeast
    ? `Seit mindestens ${status.days} Tagen kein Abnehmen`
    : `Seit ${status.days} Tagen kein Abnehmen`;
}

const BAND_NAMES: Record<PaceBand, string> = {
  loss: "4 Wochen: nimmt ab",
  stagnation: "4 Wochen: stagniert",
  gain: "4 Wochen: nimmt zu",
};

function Figure({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div>
      <dt className={classes.label}>{label}</dt>
      <dd className={classes.figure}>
        <span className={classes.value}>{value}</span>{" "}
        <span className={classes.unit}>{unit}</span>
      </dd>
    </div>
  );
}
