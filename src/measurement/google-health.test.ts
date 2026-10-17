import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchMeasurements,
  HEALTH_SCOPE,
  revokeAccess,
  signIn,
} from "./google-health";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID", "client-1");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

type TokenClientConfig = {
  scope: string;
  callback: (response: Record<string, string>) => void;
  error_callback: (error: { type: string }) => void;
};

/**
 * Stands in for Google Identity Services: the sign-in answers with `answer`,
 * and revoking reports `revoked`, or never answers. Returns the configs the
 * page asked for and the tokens it revoked.
 */
function stubGoogleSignIn(
  answer: (config: TokenClientConfig) => void,
  revoked: { successful: boolean } | "never" = { successful: true },
) {
  const configs: TokenClientConfig[] = [];
  const revokedTokens: string[] = [];
  vi.stubGlobal("google", {
    accounts: {
      oauth2: {
        initTokenClient: (config: TokenClientConfig) => {
          configs.push(config);
          return { requestAccessToken: () => answer(config) };
        },
        revoke: (token: string, done: (r: { successful: boolean }) => void) => {
          revokedTokens.push(token);
          if (revoked !== "never") done(revoked);
        },
      },
    },
  });
  return { configs, revokedTokens };
}

const granted = (config: TokenClientConfig) =>
  config.callback({ access_token: "token-1", scope: HEALTH_SCOPE });

describe("signIn", () => {
  it("yields the access token Google grants", async () => {
    stubGoogleSignIn(granted);

    expect(await signIn()).toEqual({ ok: true, value: "token-1" });
  });

  it("asks only to read the health metrics and measurements", async () => {
    const { configs } = stubGoogleSignIn(granted);

    await signIn();

    expect(configs.map((c) => c.scope)).toEqual([
      "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
    ]);
  });

  it("reports access not granted where the scope was left unticked", async () => {
    stubGoogleSignIn((config) =>
      config.callback({ access_token: "token-1", scope: "openid" }),
    );

    expect(await signIn()).toEqual({
      ok: false,
      error: { kind: "accessNotGranted" },
    });
  });

  it("reports a failed sign-in where the person declines", async () => {
    stubGoogleSignIn((config) => config.callback({ error: "access_denied" }));

    expect(await signIn()).toEqual({
      ok: false,
      error: { kind: "signInFailed" },
    });
  });

  it("reports a failed sign-in where the popup is closed", async () => {
    stubGoogleSignIn((config) =>
      config.error_callback({ type: "popup_closed" }),
    );

    expect(await signIn()).toEqual({
      ok: false,
      error: { kind: "signInFailed" },
    });
  });

  it("reports the sign-in unavailable where Google's script has not loaded", async () => {
    expect(await signIn()).toEqual({
      ok: false,
      error: { kind: "signInUnavailable" },
    });
  });
});

const FROM = new Date("2026-10-03T08:00:00.000Z");

/** A data point as Google Health returns it. */
const dataPoint = (physicalTime: string, weightGrams: number) => ({
  name: "users/1/dataTypes/weight/dataPoints/1",
  dataSource: { recordingMethod: "MANUAL", platform: "HEALTH_CONNECT" },
  weight: {
    sampleTime: {
      physicalTime,
      utcOffset: "7200s",
      civilTime: {
        date: { year: 2026, month: 10, day: 17 },
        time: { hours: 9, minutes: 57 },
      },
    },
    weightGrams,
  },
});

/** Stands in for `fetch`, answering each request with the next of `pages`. */
function stubFetch(...pages: (() => Response)[]) {
  const requests: { url: string; init?: RequestInit }[] = [];
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    requests.push({ url, init });
    const page = pages.shift();
    if (page === undefined) throw new Error(`unexpected request ${url}`);
    return page();
  });
  return requests;
}

const json =
  (body: unknown, status = 200) =>
  () =>
    new Response(JSON.stringify(body), { status });

describe("fetchMeasurements", () => {
  it("yields the weight measurements in kg, at the instant they were taken", async () => {
    stubFetch(
      json({
        dataPoints: [
          dataPoint("2026-10-17T07:57:00Z", 98599),
          dataPoint("2026-10-16T05:10:00Z", 98300),
        ],
      }),
    );

    expect(await fetchMeasurements("token-1", FROM)).toEqual({
      ok: true,
      value: [
        { time: new Date("2026-10-17T07:57:00Z"), kg: 98.599 },
        { time: new Date("2026-10-16T05:10:00Z"), kg: 98.3 },
      ],
    });
  });

  it("reads, with the access token, the weights taken since the start of the period", async () => {
    const requests = stubFetch(json({ dataPoints: [] }));

    await fetchMeasurements("token-1", FROM);

    expect(requests).toHaveLength(1);
    const url = new URL(requests[0].url);
    expect(url.origin + url.pathname).toBe(
      "https://health.googleapis.com/v4/users/me/dataTypes/weight/dataPoints",
    );
    expect(url.searchParams.get("filter")).toBe(
      'weight.sample_time.physical_time >= "2026-10-03T08:00:00.000Z"',
    );
    expect(requests[0].init?.method).toBe("GET");
    expect(new Headers(requests[0].init?.headers).get("Authorization")).toBe(
      "Bearer token-1",
    );
  });

  it("reads every page Google splits the answer into", async () => {
    const requests = stubFetch(
      json({
        dataPoints: [dataPoint("2026-10-17T07:57:00Z", 98599)],
        nextPageToken: "page-2",
      }),
      json({ dataPoints: [dataPoint("2026-10-16T05:10:00Z", 98300)] }),
    );

    const result = await fetchMeasurements("token-1", FROM);

    expect(result.ok && result.value.map((m) => m.kg)).toEqual([98.599, 98.3]);
    expect(new URL(requests[1].url).searchParams.get("pageToken")).toBe(
      "page-2",
    );
    expect(new URL(requests[1].url).searchParams.get("filter")).toBe(
      'weight.sample_time.physical_time >= "2026-10-03T08:00:00.000Z"',
    );
  });

  it("yields no measurements where Google leaves out the empty list", async () => {
    stubFetch(json({}));

    expect(await fetchMeasurements("token-1", FROM)).toEqual({
      ok: true,
      value: [],
    });
  });

  it("reports the token rejected where Google answers 401", async () => {
    stubFetch(json({ error: { code: 401 } }, 401));

    expect(await fetchMeasurements("token-1", FROM)).toEqual({
      ok: false,
      error: { kind: "tokenRejected" },
    });
  });

  it("reports the status of any other answer that is not a success", async () => {
    stubFetch(json({ error: { code: 503 } }, 503));

    expect(await fetchMeasurements("token-1", FROM)).toEqual({
      ok: false,
      error: { kind: "failed", status: 503 },
    });
  });

  it("reports Google unreachable where the request does not get through", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("Failed to fetch");
    });

    expect(await fetchMeasurements("token-1", FROM)).toEqual({
      ok: false,
      error: { kind: "unreachable" },
    });
  });

  it("reports Google unreachable where it does not answer within 20 seconds", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", () => new Promise(() => {}));

    const result = settled(fetchMeasurements("token-1", FROM));
    await vi.advanceTimersByTimeAsync(19_999);
    expect(result.value).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);

    expect(result.value).toEqual({ ok: false, error: { kind: "unreachable" } });
  });

  it("reports an unexpected response where the answer is no JSON", async () => {
    stubFetch(() => new Response("<html>", { status: 200 }));

    expect(await fetchMeasurements("token-1", FROM)).toEqual({
      ok: false,
      error: { kind: "unexpectedResponse" },
    });
  });

  it.each([
    ["without a weight", { name: "x" }],
    [
      "without weightGrams",
      { weight: { sampleTime: { physicalTime: "2026-10-17T07:57:00Z" } } },
    ],
    ["with a time that is no time", dataPoint("yesterday", 98599)],
  ])("reports an unexpected response for a data point %s", async (_, point) => {
    stubFetch(json({ dataPoints: [point] }));

    expect(await fetchMeasurements("token-1", FROM)).toEqual({
      ok: false,
      error: { kind: "unexpectedResponse" },
    });
  });
});

describe("revokeAccess", () => {
  it("revokes the page's access at Google", async () => {
    const { revokedTokens } = stubGoogleSignIn(granted);

    expect(await revokeAccess("token-1")).toEqual({ ok: true, value: null });
    expect(revokedTokens).toEqual(["token-1"]);
  });

  it("reports where Google does not revoke", async () => {
    stubGoogleSignIn(granted, { successful: false });

    expect(await revokeAccess("token-1")).toEqual({
      ok: false,
      error: { kind: "revokeFailed" },
    });
  });

  it("reports Google unreachable where it does not answer within 20 seconds", async () => {
    vi.useFakeTimers();
    stubGoogleSignIn(granted, "never");

    const result = settled(revokeAccess("token-1"));
    await vi.advanceTimersByTimeAsync(19_999);
    expect(result.value).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);

    expect(result.value).toEqual({ ok: false, error: { kind: "unreachable" } });
  });

  it("reports the sign-in unavailable where Google's script has not loaded", async () => {
    expect(await revokeAccess("token-1")).toEqual({
      ok: false,
      error: { kind: "signInUnavailable" },
    });
  });
});

/** The value `promise` has settled with so far, read without awaiting it. */
function settled<T>(promise: Promise<T>): { value: T | undefined } {
  const result: { value: T | undefined } = { value: undefined };
  promise.then((value) => {
    result.value = value;
  });
  return result;
}
