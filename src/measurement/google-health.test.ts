import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  enterMeasurement,
  fetchMeasurements,
  type GoogleHealthError,
  READ_SCOPE,
  revokeAccess,
  signIn,
  WRITE_SCOPE,
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
  include_granted_scopes?: boolean;
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
  config.callback({
    access_token: "token-1",
    scope: `${READ_SCOPE} ${WRITE_SCOPE}`,
    expires_in: "3599",
  });

describe("signIn", () => {
  it("yields the access token Google grants", async () => {
    stubGoogleSignIn(granted);

    expect(await signIn()).toEqual({
      ok: true,
      value: { token: "token-1", expiresInSeconds: 3599, writeGranted: true },
    });
  });

  it("asks the page at https://gewicht.jorgenschaefer.de to read and to write the health metrics and measurements, and nothing more", async () => {
    vi.stubGlobal("location", { origin: "https://gewicht.jorgenschaefer.de" });
    const { configs } = stubGoogleSignIn(granted);

    await signIn();

    expect(configs.map((c) => c.scope.split(" "))).toEqual([
      [
        "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
        "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.writeonly",
      ],
    ]);
  });

  it.each([
    ["the dev server", "http://localhost:3000"],
    ["another host", "http://127.0.0.1:3000"],
    ["another scheme", "http://gewicht.jorgenschaefer.de"],
  ])(
    "asks %s only to read, so no run of it writes into the real Google Health",
    async (_, origin) => {
      vi.stubGlobal("location", { origin });
      const { configs } = stubGoogleSignIn(granted);

      await signIn();

      expect(configs.map((c) => c.scope)).toEqual([READ_SCOPE]);
    },
  );

  it("asks only to read where there is no page", async () => {
    const { configs } = stubGoogleSignIn(granted);

    await signIn();

    expect(configs.map((c) => c.scope)).toEqual([READ_SCOPE]);
  });

  it("leaves out the scopes granted in earlier sign-ins, so a sign-in that asks only to read cannot write", async () => {
    const { configs } = stubGoogleSignIn(granted);

    await signIn();

    expect(configs.map((c) => c.include_granted_scopes)).toEqual([false]);
  });

  it("yields a token that only reads where the scope to write was left unticked", async () => {
    stubGoogleSignIn((config) =>
      config.callback({
        access_token: "token-1",
        scope: READ_SCOPE,
        expires_in: "3599",
      }),
    );

    expect(await signIn()).toEqual({
      ok: true,
      value: { token: "token-1", expiresInSeconds: 3599, writeGranted: false },
    });
  });

  it.each([
    ["leaves out how long the token lasts", {}],
    ["says the token lasts no number of seconds", { expires_in: "abc" }],
  ])("reports an unexpected response where Google %s", async (_, lifetime) => {
    stubGoogleSignIn((config) =>
      config.callback({
        access_token: "token-1",
        scope: READ_SCOPE,
        ...lifetime,
      }),
    );

    expect(await signIn()).toEqual(failed("unexpectedResponse"));
  });

  it.each([
    ["no scope of the two", "openid"],
    ["only the scope to write", WRITE_SCOPE],
  ])("reports access not granted where it grants %s", async (_, scope) => {
    stubGoogleSignIn((config) =>
      config.callback({ access_token: "token-1", scope, expires_in: "3599" }),
    );

    expect(await signIn()).toEqual(failed("accessNotGranted"));
  });

  it("reports a failed sign-in where the person declines", async () => {
    stubGoogleSignIn((config) => config.callback({ error: "access_denied" }));

    expect(await signIn()).toEqual(failed("signInFailed"));
  });

  it("reports a failed sign-in where the popup is closed", async () => {
    stubGoogleSignIn((config) =>
      config.error_callback({ type: "popup_closed" }),
    );

    expect(await signIn()).toEqual(failed("signInFailed"));
  });

  it("reports the sign-in unavailable where Google's script has not loaded", async () => {
    expect(await signIn()).toEqual(failed("signInUnavailable"));
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

  it.each([
    ["without a weight", { name: "x" }],
    [
      "without weightGrams",
      { weight: { sampleTime: { physicalTime: "2026-10-17T07:57:00Z" } } },
    ],
    ["with a time that is no time", dataPoint("yesterday", 98599)],
  ])("reports an unexpected response for a data point %s", async (_, point) => {
    stubFetch(json({ dataPoints: [point] }));

    expect(await fetchMeasurements("token-1", FROM)).toEqual(
      failed("unexpectedResponse"),
    );
  });
});

const ENTERED = { time: new Date("2026-10-17T07:57:00.000Z"), kg: 98.6 };

/** The long-running operation Google answers a written data point with. */
const operation = { name: "operations/1", done: false };

/** The weight data point the one request sent to Google. */
const sentWeight = (requests: { init?: RequestInit }[]) =>
  JSON.parse(String(requests[0].init?.body)).weight;

describe("enterMeasurement", () => {
  it("writes the weight in grams, at its instant, to the weight data points with the access token", async () => {
    vi.stubEnv("TZ", "Europe/Berlin");
    const requests = stubFetch(json(operation));

    expect(await enterMeasurement("token-1", ENTERED)).toEqual({
      ok: true,
      value: null,
    });
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe(
      "https://health.googleapis.com/v4/users/me/dataTypes/weight/dataPoints",
    );
    expect(requests[0].init?.method).toBe("POST");
    const headers = new Headers(requests[0].init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer token-1");
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(sentWeight(requests)).toEqual({
      sampleTime: {
        physicalTime: "2026-10-17T07:57:00.000Z",
        utcOffset: "7200s",
      },
      weightGrams: 98600,
    });
  });

  it("gives the offset from UTC where the browser is, west of it too", async () => {
    vi.stubEnv("TZ", "America/New_York");
    const requests = stubFetch(json(operation));

    await enterMeasurement("token-1", ENTERED);

    expect(sentWeight(requests).sampleTime.utcOffset).toBe("-14400s");
  });

  it("writes whole grams, where the weight in kg is no exact binary fraction", async () => {
    const requests = stubFetch(json(operation));

    await enterMeasurement("token-1", { ...ENTERED, kg: 100.3 });

    expect(sentWeight(requests).weightGrams).toBe(100300);
  });

  it("succeeds on an operation that is done", async () => {
    stubFetch(json({ ...operation, done: true, response: {} }));

    expect(await enterMeasurement("token-1", ENTERED)).toEqual({
      ok: true,
      value: null,
    });
  });

  it("reports writing not granted where Google answers 403", async () => {
    stubFetch(json({ error: { code: 403 } }, 403));

    expect(await enterMeasurement("token-1", ENTERED)).toEqual(
      failed("writeNotGranted"),
    );
  });

  it.each([
    [
      "an operation that failed",
      { ...operation, done: true, error: { code: 3 } },
    ],
    ["no operation", ["operations/1"]],
  ])(
    "reports an unexpected response where Google answers %s",
    async (_, body) => {
      stubFetch(json(body));

      expect(await enterMeasurement("token-1", ENTERED)).toEqual(
        failed("unexpectedResponse"),
      );
    },
  );
});

describe("revokeAccess", () => {
  it("revokes the page's access at Google", async () => {
    const { revokedTokens } = stubGoogleSignIn(granted);

    expect(await revokeAccess("token-1")).toEqual({ ok: true, value: null });
    expect(revokedTokens).toEqual(["token-1"]);
  });

  it("reports where Google does not revoke", async () => {
    stubGoogleSignIn(granted, { successful: false });

    expect(await revokeAccess("token-1")).toEqual(failed("revokeFailed"));
  });

  it("reports the sign-in unavailable where Google's script has not loaded", async () => {
    expect(await revokeAccess("token-1")).toEqual(failed("signInUnavailable"));
  });
});

/** Each call that asks Google for an answer, with the answer it takes. */
const calls: Record<string, () => Promise<unknown>> = {
  fetchMeasurements: () => fetchMeasurements("token-1", FROM),
  enterMeasurement: () => enterMeasurement("token-1", ENTERED),
};

describe.each(Object.entries(calls))("%s", (_, call) => {
  it("reports the token rejected where Google answers 401", async () => {
    stubFetch(json({ error: { code: 401 } }, 401));

    expect(await call()).toEqual(failed("tokenRejected"));
  });

  it("reports the status of any other answer that is no success", async () => {
    stubFetch(json({ error: { code: 503 } }, 503));

    expect(await call()).toEqual({
      ok: false,
      error: { kind: "failed", status: 503 },
    });
  });

  it("reports an unexpected response where the answer is no JSON", async () => {
    stubFetch(() => new Response("<html>", { status: 200 }));

    expect(await call()).toEqual(failed("unexpectedResponse"));
  });

  it("reports Google unreachable where the request does not get through", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("Failed to fetch");
    });

    expect(await call()).toEqual(failed("unreachable"));
  });
});

describe.each(
  Object.entries({ ...calls, revokeAccess: () => revokeAccess("token-1") }),
)("%s, where Google never answers", (_, call) => {
  it("reports Google unreachable after 20 seconds", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", () => new Promise(() => {}));
    stubGoogleSignIn(granted, "never");

    const result = settled(call());
    await vi.advanceTimersByTimeAsync(19_999);
    expect(result.value).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);

    expect(result.value).toEqual(failed("unreachable"));
  });
});

const failed = (kind: GoogleHealthError["kind"]) => ({
  ok: false,
  error: { kind },
});

/** The value `promise` has settled with so far, read without awaiting it. */
function settled<T>(promise: Promise<T>): { value: T | undefined } {
  const result: { value: T | undefined } = { value: undefined };
  promise.then((value) => {
    result.value = value;
  });
  return result;
}
