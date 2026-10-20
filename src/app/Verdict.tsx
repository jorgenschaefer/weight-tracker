import type { Assessment, AssessmentStatus } from "@/verdict/assessment";
import type { MorningSentence } from "@/verdict/morning-sentence";
import { isLossLikelier, type TrafficLight } from "@/verdict/traffic-light";
import { formatKg } from "./format";
import classes from "./Verdict.module.css";

/**
 * The verdict from `status`: the Satz zum Morgen as the headline, under the
 * line that says how certain the likelier side is. Without a verdict, the
 * headline says why there is none.
 */
export function Verdict({ status }: { status: AssessmentStatus }) {
  switch (status.kind) {
    case "verdict":
      return (
        <>
          <p className={classes.line}>{certaintyLine(status.lossCertainty)}</p>
          <h1 className={classes.sentence}>
            {sentenceText(status.morningSentence)}
          </h1>
        </>
      );
    case "lastMeasurementTooOld":
      return (
        <h1 className={classes.statement}>
          {`Letzte Messung vor ${status.days} Tagen`}
        </h1>
      );
    case "noVerdictYet":
      return <h1 className={classes.statement}>Noch kein Urteil</h1>;
  }
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

/** The colours of the surface under `status`: its Ampel's, otherwise neutral. */
export function surfaceColours(status: AssessmentStatus): SurfaceColours {
  switch (status.kind) {
    case "verdict":
      return TRAFFIC_LIGHT_COLOURS[status.trafficLight];
    case "lastMeasurementTooOld":
    case "noVerdictYet":
      return NEUTRAL;
  }
}

const TRAFFIC_LIGHT_COLOURS: Record<TrafficLight, SurfaceColours> = {
  green: { surface: "#D3EAD0", ink: "#163D1B" },
  yellow: { surface: "#F3E2A2", ink: "#3B3004" },
  red: { surface: "#F2C6B8", ink: "#5A1A0B" },
};

/**
 * „N % sicher, dass du abnimmst“, or „… nicht abnimmst“ where that is the
 * likelier side: N its probability from `lossCertainty`, in whole percent, at
 * most {@link MAX_PERCENT}.
 */
function certaintyLine(lossCertainty: number): string {
  const losing = isLossLikelier(lossCertainty);
  const probability = losing ? lossCertainty : 1 - lossCertainty;
  const percent = Math.min(MAX_PERCENT, Math.round(probability * 100));
  // A no-break space keeps the number with its „%“.
  return `${percent} % sicher, dass du ${losing ? "abnimmst" : "nicht abnimmst"}`;
}

/** Nothing about a pace is certain: the line never says 100 %. */
const MAX_PERCENT = 99;

function sentenceText(sentence: MorningSentence): string {
  switch (sentence.kind) {
    case "gainStopped":
      return "Die Zunahme ist gestoppt. Ob du abnimmst, ist noch offen.";
    case "lossSlowing":
      return "Achtung, die Abnahme wird langsamer.";
    case "losingAgain":
      return "Du nimmst wieder ab.";
    case "gainingAgain":
      return "Achtung, du nimmst wieder zu.";
    case "outlier":
      return "Ausreißer, der Trend bleibt.";
    case "lightMorning":
      return "Leichter Morgen, aber ein Tag ändert den Trend noch nicht.";
    case "twoHeavierMornings":
      return "Zwei schwerere Morgen: Du nimmst noch ab, aber langsamer.";
    case "losingForDays":
      return `Du nimmst seit ${sentence.days} Tagen ab.`;
    case "losingForWeeks":
      return "Du nimmst seit Wochen ab.";
    case "probablyLosing":
      return "Es geht wahrscheinlich abwärts, noch nicht sicher.";
    case "open":
      return "Ob du abnimmst, ist noch offen.";
    case "gainingForDays":
      return `Du nimmst seit ${sentence.days} Tagen zu.`;
    case "gainingForWeeks":
      return "Du nimmst seit Wochen zu.";
  }
}

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
