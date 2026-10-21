import { kcalPerDay } from "@/trend/pace";
import type { Assessment, AssessmentStatus } from "@/verdict/assessment";
import type { MorningSentence } from "@/verdict/morning-sentence";
import { isLossLikelier, type TrafficLight } from "@/verdict/traffic-light";
import {
  formatKg,
  formatPace,
  formatPaceDeviation,
  isPaceShownAsZero,
} from "./format";
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

/**
 * The four figures of `assessment`, where it has a measurement: „Gewicht,
 * geschätzt“, „Gemessen“, „Tempo“, and its calories a day, each estimate
 * beside its standard deviation.
 */
export function Figures({ assessment }: { assessment: Assessment }) {
  const { trend, measuredKg } = assessment;
  if (trend === null) return null;
  const paceSd = Math.sqrt(trend.paceVariance);
  return (
    <dl className={classes.figures}>
      <Figure
        label="Gewicht, geschätzt"
        value={formatKg(trend.kg)}
        sd={formatKg(Math.sqrt(trend.kgVariance))}
        unit="kg"
      />
      <Figure label="Gemessen" value={formatKg(measuredKg)} unit="kg" />
      <Figure
        label="Tempo"
        value={formatPace(trend.pace)}
        sd={formatPaceDeviation(paceSd)}
        unit="kg/Wo"
      />
      <Figure
        {...balanceFigure(trend.pace)}
        sd={`${kcalPerDay(paceSd)}`}
        unit="kcal/Tag"
      />
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

export const TRAFFIC_LIGHT_COLOURS: Record<TrafficLight, SurfaceColours> = {
  green: { surface: "#D3EAD0", ink: "#163D1B" },
  yellow: { surface: "#F3E2A2", ink: "#3B3004" },
  red: { surface: "#F2C6B8", ink: "#5A1A0B" },
};

/**
 * The colour of a stretch of the trend line under its Ampel. The three can be
 * told apart at a glance, by at least ΔE 15 in OKLab, which takes
 * more lightness and colour than 3:1 against every surface allows: they stand
 * off each surface, of an Ampel or {@link NEUTRAL}, by at least 2:1. A stretch
 * takes its own day's Ampel and the surface today's, so the closest is the
 * yellow line on the red surface, at 2.2:1.
 */
export const TRAFFIC_LIGHT_LINE_COLOURS: Record<TrafficLight, string> = {
  green: "#047F21",
  yellow: "#B78006",
  red: "#B61F02",
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

/**
 * The label and value of the calories a day `pace` stands for, by the sign
 * „Tempo“ shows: „Bilanz“ 0 where it shows `±0,00`, so no kcal stand beside
 * a pace shown as none, otherwise „Defizit“ or „Überschuss“.
 */
function balanceFigure(pace: number): { label: string; value: string } {
  if (isPaceShownAsZero(pace)) return { label: "Bilanz", value: "0" };
  const label = pace < 0 ? "Defizit" : "Überschuss";
  return { label, value: `${kcalPerDay(pace)}` };
}

/** `value` under `label`, then „± `sd`“ where it is an estimate, then `unit`. */
function Figure({
  label,
  value,
  sd,
  unit,
}: {
  label: string;
  value: string;
  sd?: string;
  unit: string;
}) {
  return (
    <div>
      <dt className={classes.label}>{label}</dt>
      <dd className={classes.figure}>
        {value}{" "}
        {sd !== undefined && (
          <>
            <span className={classes.sd}>± {sd}</span>{" "}
          </>
        )}
        <span className={classes.unit}>{unit}</span>
      </dd>
    </div>
  );
}
