import { isRecord, parseJson } from "./json";
import type { Measurement } from "./measurement";

/**
 * The one module that talks to Google: it loads Google Identity Services,
 * signs in for an access token, reads weight measurements from the Google
 * Health API and revokes the page's access. It only ever reads health data.
 * The token it hands out is the caller's to keep, in memory only.
 */

/** Read access to Health Metrics & Measurements, and nothing more. */
export const HEALTH_SCOPE =
  "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly";

/** What went wrong in talking to Google, for the page to tell in its words. */
export type GoogleHealthError =
  /** Google Identity Services has not loaded, so no sign-in can start. */
  | { kind: "signInUnavailable" }
  /** The person closed or declined the sign-in. */
  | { kind: "signInFailed" }
  /** The sign-in went through, but without read access to the weights. */
  | { kind: "accessNotGranted" }
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
 * Signs in with Google for an access token that reads the weights. Call it
 * straight from the click, before anything is awaited, or the browser blocks
 * the popup.
 */
export function signIn(): Promise<GoogleHealthResult<AccessToken>> {
  const oauth2 = globalThis.google?.accounts.oauth2;
  if (oauth2 === undefined)
    return Promise.resolve(failure("signInUnavailable"));

  return new Promise((resolve) => {
    oauth2
      .initTokenClient({
        client_id: clientId(),
        scope: HEALTH_SCOPE,
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
    const page = await fetchPage(token, from, pageToken);
    if (!page.ok) return page;
    measurements.push(...page.value.measurements);
    pageToken = page.value.nextPageToken;
  } while (pageToken !== undefined);
  return { ok: true, value: measurements };
}

/** Revokes the page's access at Google, which `token` was granted. */
export function revokeAccess(
  token: AccessToken,
): Promise<GoogleHealthResult<null>> {
  const oauth2 = globalThis.google?.accounts.oauth2;
  if (oauth2 === undefined)
    return Promise.resolve(failure("signInUnavailable"));

  return new Promise((resolve) => {
    oauth2.revoke(token, ({ successful }) =>
      resolve(successful ? { ok: true, value: null } : failure("revokeFailed")),
    );
  });
}

/** An OAuth access token for the Google Health API. */
export type AccessToken = string;

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

function grantedToken(
  response: TokenResponse,
): GoogleHealthResult<AccessToken> {
  if (response.error !== undefined || response.access_token === undefined) {
    return failure("signInFailed");
  }
  // The consent screen lets the person untick the scope and still go on.
  const scopes = (response.scope ?? "").split(" ");
  if (!scopes.includes(HEALTH_SCOPE)) return failure("accessNotGranted");
  return { ok: true, value: response.access_token };
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
