import type { Assessment, AssessmentStatus } from "@/verdict/assessment";
import type { TrendVerdict } from "@/verdict/verdict";
import { formatKg } from "./format";
import classes from "./Verdict.module.css";

/**
 * The verdict, or why there is none, from `assessment`: under
 * „Frühwarnung · letzte Tage“ where it is the Frühwarnung, the headline and
 * the sentence under it where it has one.
 */
export function Verdict({ assessment }: { assessment: Assessment }) {
  const { status } = assessment;
  const sentence = explanation(status);
  return (
    <>
      {isTrendVerdict(status) && (
        <p className={classes.kicker}>Frühwarnung · letzte Tage</p>
      )}
      <h1 className={classes.headline} data-emphasis={emphasis(status)}>
        {headline(status)}
      </h1>
      {sentence !== null && <p className={classes.explanation}>{sentence}</p>}
    </>
  );
}

/** Trend and „Gemessen“ of `assessment`, each where it has one. */
export function Figures({ assessment }: { assessment: Assessment }) {
  const { trendKg, measuredKg } = assessment;
  return (
    <dl className={classes.figures}>
      {trendKg !== null && <Figure label="Trend" kg={trendKg} />}
      {measuredKg !== null && <Figure label="Gemessen" kg={measuredKg} />}
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
 * with the Warnstufe of „Stagniert“ and „Nimmt zu“, neutral for everything
 * else.
 */
export function surfaceColours(status: AssessmentStatus): SurfaceColours {
  switch (status.kind) {
    case "losing":
      return { surface: "#D5E4F1", ink: "#10355A" };
    case "holding":
    case "gaining":
      return LEVEL_COLOURS[status.level];
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

function isTrendVerdict(status: AssessmentStatus): status is TrendVerdict {
  switch (status.kind) {
    case "losing":
    case "holding":
    case "gaining":
      return true;
    case "lastMeasurementTooOld":
    case "noVerdictYet":
      return false;
  }
}

function headline(status: AssessmentStatus): string {
  switch (status.kind) {
    case "losing":
      return "Nimmt ab";
    case "holding":
      return "Stagniert";
    case "gaining":
      return "Nimmt zu";
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
    case "holding":
    case "gaining":
      return "short";
    case "lastMeasurementTooOld":
    case "noVerdictYet":
      return "statement";
  }
}

/** The sentence under the headline, where it has one. */
function explanation(status: AssessmentStatus): string | null {
  switch (status.kind) {
    case "losing":
    case "holding":
    case "gaining":
      return trendVerdictSentence(status);
    case "noVerdictYet":
      return "Ein Urteil gibt es nach knapp drei Wochen mit Messungen.";
    case "lastMeasurementTooOld":
      return null;
  }
}

/** „Der Trend fällt seit (mindestens) N Tagen.“, „… seit einem Tag.“ */
function trendVerdictSentence(verdict: TrendVerdict): string {
  const days = verdict.days === 1 ? "einem Tag" : `${verdict.days} Tagen`;
  const since = verdict.atLeast ? `seit mindestens ${days}` : `seit ${days}`;
  return `Der Trend ${TREND_VERBS[verdict.kind]} ${since}.`;
}

const TREND_VERBS: Record<TrendVerdict["kind"], string> = {
  losing: "fällt",
  holding: "stagniert",
  gaining: "steigt",
};

function Figure({ label, kg }: { label: string; kg: number }) {
  return (
    <div>
      <dt className={classes.label}>{label}</dt>
      <dd className={classes.figure}>
        {formatKg(kg)} <span className={classes.unit}>kg</span>
      </dd>
    </div>
  );
}
