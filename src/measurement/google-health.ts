import { isRecord, parseJson } from "./json";
import type { Measurement } from "./measurement";

/**
 * The one module that talks to Google: it loads Google Identity Services,
 * signs in for an access token, reads weight measurements from the Google
 * Health API, enters new ones into it and revokes the page's access. The
 * token it hands out is the caller's to keep.
 */

/** Read access to Health Metrics & Measurements. */
export const READ_SCOPE =
  "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly";

/** Write access to Health Metrics & Measurements, to enter measurements. */
export const WRITE_SCOPE =
  "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.writeonly";

/** What went wrong in talking to Google, for the page to tell in its words. */
export type GoogleHealthError =
  /** Google Identity Services has not loaded, so no sign-in can start. */
  | { kind: "signInUnavailable" }
  /** The person closed or declined the sign-in. */
  | { kind: "signInFailed" }
  /** The sign-in went through, but without read access to the weights. */
  | { kind: "accessNotGranted" }
  /** The sign-in or Google does not allow the page to enter measurements. */
  | { kind: "writeNotGranted" }
  /** Google no longer accepts the access token; a new sign-in gets another. */
  | { kind: "tokenRejected" }
  | { kind: "unreachable" }
  | { kind: "failed"; status: number }
  | { kind: "unexpectedResponse" }
  | { kind: "revokeFailed" };

export type GoogleHealthResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: GoogleHealthError };

/**
 * Starts loading Google Identity Services, so it is there by the time the
 * person clicks: a sign-in started later than the click is blocked as a
 * popup nobody asked for.
 */
export function loadGoogleSignIn(): void {
  if (document.getElementById(SCRIPT_ID) !== null) return;
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  document.head.append(script);
}

/**
 * Signs in with Google for an access token that reads the weights and, where
 * the person allows it, enters them. Call it
 * straight from the click, before anything is awaited, or the browser blocks
 * the popup.
 */
export function signIn(): Promise<GoogleHealthResult<SignedIn>> {
  const oauth2 = globalThis.google?.accounts.oauth2;
  if (oauth2 === undefined)
    return Promise.resolve(failure("signInUnavailable"));

  return new Promise((resolve) => {
    oauth2
      .initTokenClient({
        client_id: clientId(),
        scope: `${READ_SCOPE} ${WRITE_SCOPE}`,
        callback: (response) => resolve(grantedToken(response)),
        error_callback: () => resolve(failure("signInFailed")),
      })
      .requestAccessToken();
  });
}

/** The weight measurements taken since `from`, in any order. */
export async function fetchMeasurements(
  token: AccessToken,
  from: Date,
): Promise<GoogleHealthResult<Measurement[]>> {
  const measurements: Measurement[] = [];
  let pageToken: string | undefined;
  do {
    const page = await answeredInTime(fetchPage(token, from, pageToken));
    if (!page.ok) return page;
    measurements.push(...page.value.measurements);
    pageToken = page.value.nextPageToken;
  } while (pageToken !== undefined);
  return { ok: true, value: measurements };
}

/**
 * Writes `measurement` into Google Health. It has arrived once Google accepts
 * it, even where Google has not yet finished storing it.
 */
export function enterMeasurement(
  token: AccessToken,
  measurement: Measurement,
): Promise<GoogleHealthResult<null>> {
  return answeredInTime(postDataPoint(token, measurement));
}

/** Revokes the page's access at Google, which `token` was granted. */
export function revokeAccess(
  token: AccessToken,
): Promise<GoogleHealthResult<null>> {
  const oauth2 = globalThis.google?.accounts.oauth2;
  if (oauth2 === undefined)
    return Promise.resolve(failure("signInUnavailable"));

  return answeredInTime(
    new Promise((resolve) => {
      oauth2.revoke(token, ({ successful }) =>
        resolve(
          successful ? { ok: true, value: null } : failure("revokeFailed"),
        ),
      );
    }),
  );
}

/** An OAuth access token for the Google Health API. */
export type AccessToken = string;

/**
 * A sign-in: the access token, how long Google will accept it, and whether it
 * may enter measurements as well as read them.
 */
export interface SignedIn {
  token: AccessToken;
  expiresInSeconds: number;
  writeGranted: boolean;
}

const SCRIPT_ID = "google-identity-services";

const DATA_POINTS =
  "https://health.googleapis.com/v4/users/me/dataTypes/weight/dataPoints";

interface Page {
  measurements: Measurement[];
  nextPageToken: string | undefined;
}

async function fetchPage(
  token: AccessToken,
  from: Date,
  pageToken: string | undefined,
): Promise<GoogleHealthResult<Page>> {
  const url = new URL(DATA_POINTS);
  url.searchParams.set(
    "filter",
    `weight.sample_time.physical_time >= "${from.toISOString()}"`,
  );
  if (pageToken !== undefined) url.searchParams.set("pageToken", pageToken);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // fetch rejects only where the request did not get through.
    return failure("unreachable");
  }
  if (response.status === 401) return failure("tokenRejected");
  if (!response.ok)
    return { ok: false, error: { kind: "failed", status: response.status } };

  const page = parsePage(await response.text());
  return page === null
    ? failure("unexpectedResponse")
    : { ok: true, value: page };
}

/** The page of data points Google sent as `body`, or `null` if it is none. */
function parsePage(body: string): Page | null {
  const page = parseJson(body);
  if (!isRecord(page)) return null;

  // Google leaves an empty list out of the answer altogether.
  const dataPoints = page.dataPoints === undefined ? [] : page.dataPoints;
  if (!Array.isArray(dataPoints)) return null;
  const measurements = dataPoints.map(parseDataPoint);
  if (!measurements.every((m) => m !== null)) return null;

  const { nextPageToken } = page;
  if (nextPageToken !== undefined && typeof nextPageToken !== "string") {
    return null;
  }
  return { measurements, nextPageToken };
}

/**
 * The measurement a data point holds. Its instant is `physicalTime`; the
 * Berlin day comes from that, not from Google's `civilTime`.
 */
function parseDataPoint(dataPoint: unknown): Measurement | null {
  if (!isRecord(dataPoint) || !isRecord(dataPoint.weight)) return null;
  const { sampleTime, weightGrams } = dataPoint.weight;
  if (!isRecord(sampleTime) || typeof weightGrams !== "number") return null;
  if (typeof sampleTime.physicalTime !== "string") return null;

  const time = new Date(sampleTime.physicalTime);
  if (Number.isNaN(time.getTime())) return null;
  return { time, kg: weightGrams / 1000 };
}

async function postDataPoint(
  token: AccessToken,
  { time, kg }: Measurement,
): Promise<GoogleHealthResult<null>> {
  const dataPoint = {
    weight: {
      sampleTime: {
        physicalTime: time.toISOString(),
        // Where the browser is, as a duration east of UTC: Google shows the
        // weighing at the time of day it was there.
        utcOffset: `${-time.getTimezoneOffset() * 60}s`,
      },
      weightGrams: Math.round(kg * 1000),
    },
  };

  let response: Response;
  try {
    response = await fetch(DATA_POINTS, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataPoint),
    });
  } catch {
    // fetch rejects only where the request did not get through.
    return failure("unreachable");
  }
  if (response.status === 401) return failure("tokenRejected");
  if (response.status === 403) return failure("writeNotGranted");
  if (!response.ok)
    return { ok: false, error: { kind: "failed", status: response.status } };

  // Google answers with a long-running operation, which may already hold
  // the error of a write it refused.
  const operation = parseJson(await response.text());
  if (!isRecord(operation) || operation.error !== undefined) {
    return failure("unexpectedResponse");
  }
  return { ok: true, value: null };
}

/**
 * `answer`, or Google unreachable where it has not come within
 * {@link ANSWER_WITHIN_MS}: a request that hangs would otherwise keep the page
 * waiting for good.
 */
function answeredInTime<T>(
  answer: Promise<GoogleHealthResult<T>>,
): Promise<GoogleHealthResult<T>> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<GoogleHealthResult<T>>((resolve) => {
    timer = setTimeout(() => resolve(failure("unreachable")), ANSWER_WITHIN_MS);
  });
  return Promise.race([answer, late]).finally(() => clearTimeout(timer));
}

/** Long enough for a slow mobile connection, short enough to still be looking. */
const ANSWER_WITHIN_MS = 20_000;

function grantedToken(response: TokenResponse): GoogleHealthResult<SignedIn> {
  if (response.error !== undefined || response.access_token === undefined) {
    return failure("signInFailed");
  }
  // The consent screen lets the person untick either scope and still go on.
  const scopes = (response.scope ?? "").split(" ");
  if (!scopes.includes(READ_SCOPE)) return failure("accessNotGranted");
  // Google Identity Services types it as a string of seconds.
  const expiresInSeconds = Number(response.expires_in);
  if (!(expiresInSeconds > 0)) {
    return failure("unexpectedResponse");
  }
  return {
    ok: true,
    value: {
      token: response.access_token,
      expiresInSeconds,
      writeGranted: scopes.includes(WRITE_SCOPE),
    },
  };
}

function clientId(): string {
  // Inlined at build time by next.config.ts, which fails the build without it.
  const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (id === undefined) {
    throw new Error(
      "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set - build the app with next.config.ts, which reads it from google-client-id.env",
    );
  }
  return id;
}

function failure(kind: Exclude<GoogleHealthError["kind"], "failed">): {
  ok: false;
  error: GoogleHealthError;
} {
  return { ok: false, error: { kind } };
}

/** The part of Google Identity Services' token client this module uses. */
interface TokenResponse {
  access_token?: string;
  expires_in?: string;
  scope?: string;
  error?: string;
}

declare global {
  var google:
    | {
        accounts: {
          oauth2: {
            initTokenClient(config: {
              client_id: string;
              scope: string;
              callback: (response: TokenResponse) => void;
              error_callback: (error: { type: string }) => void;
            }): { requestAccessToken(): void };
            revoke(
              token: string,
              done: (response: { successful: boolean }) => void,
            ): void;
          };
        };
      }
    | undefined;
}
