// Browser snippet: puts a Google in memory in place of the real one, so the
// page signs in, fetches and enters weights without a Google account. Run it
// on http://walk.localhost:<port> once the page has loaded; on any other host
// it throws before it replaces anything. It waits for Google
// Identity Services to load and then replaces what the page uses of it, and
// of fetch for the Google Health API. A token it has revoked is answered with
// 401, as by Google.
//
// A reload removes the stand-in but not the token the page keeps from a
// sign-in (`gewicht:token:v1` in localStorage): the page opened again fetches
// with it at once, from the real Google, which rejects it. To see the page
// opened again with that token, call `await standInReopen()` instead of
// reloading: it opens the page anew in a same-origin frame (360×640, or
// `{ width, height }`) whose Google is this stand-in, put in place before the
// page fetches, and returns the frame. Remove the frame with `.remove()`.
//
// window.standIn appears once it is in place, and holds its state, to read
// and change between taps:
//   measurements  [{ time: ISO text, kg }] in Google Health
//   scopes        "both" | "read" | "write" | "none", granted on sign-in
//   signIn        "grant" | "decline"
//   write         "accept" | "lag" (accepted, left out of fetches) |
//                 "hang" (never answered) | a status such as 403 or 500
//   read          "answer" | "hang" | a status such as 401 or 503
//   delayMs       how long each answer from Google Health takes (800)
//   olderDelayMs  how long each answer to the fetch of the older
//                 measurements takes instead, the one that asks for
//                 everything since 1.1.2000 (800); make it long, but under
//                 the page's 20000, to see the page while they are fetched
//   requests      every request to Google Health, in order
if (location.hostname !== "walk.localhost") {
  throw new Error(
    `google-stand-in.js runs only on walk.localhost, to keep the localStorage of ${location.host} as it is - open http://walk.localhost${location.port ? `:${location.port}` : ":<port of the dev server, in .next/dev/lock>"} and run it there`,
  );
}
(async () => {
  const READ =
    "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly";
  const WRITE =
    "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.writeonly";
  const API = "https://health.googleapis.com/v4/";
  const OLDER_FROM = "2000-01-01T00:00:00.000Z";
  const state = {
    measurements: [],
    scopes: "both",
    signIn: "grant",
    write: "accept",
    read: "answer",
    delayMs: 800,
    olderDelayMs: 800,
    requests: [],
  };
  let issued = 0;
  const revoked = new Set();
  const grantedScopes = () =>
    ({ both: `${READ} ${WRITE}`, read: READ, write: WRITE, none: "openid" })[
      state.scopes
    ];

  // Replaces what the page in `win` uses of Google Identity Services, once
  // it has loaded there.
  async function standInForSignIn(win) {
    while (win.google?.accounts?.oauth2 === undefined) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const oauth2 = win.google.accounts.oauth2;
    oauth2.initTokenClient = (config) => ({
      requestAccessToken: () =>
        setTimeout(() =>
          state.signIn === "grant"
            ? config.callback({
                access_token: `stand-in-${++issued}`,
                expires_in: "3599",
                scope: grantedScopes(),
              })
            : config.error_callback({ type: "popup_closed" }),
        ),
    });
    oauth2.revoke = (token, done) => {
      revoked.add(token);
      setTimeout(() => done({ successful: true }));
    };
  }

  // Answers the page's requests to the Google Health API in `win`.
  function standInForHealthApi(win) {
    const realFetch = win.fetch.bind(win);
    const json = (body, status = 200) =>
      new win.Response(JSON.stringify(body), { status });
    win.fetch = async (url, init = {}) => {
      if (!String(url).startsWith(API)) return realFetch(url, init);
      const method = init.method ?? "GET";
      state.requests.push({ method, url: String(url), body: init.body });
      const answer = method === "POST" ? state.write : state.read;
      if (answer === "hang") return new Promise(() => {});
      // A fetch asks for the measurements since the time in its filter; an
      // entry has none.
      const from = /"([^"]+)"/.exec(
        new URL(url).searchParams.get("filter") ?? "",
      )?.[1];
      const delayMs = from === OLDER_FROM ? state.olderDelayMs : state.delayMs;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      const token = new Headers(init.headers).get("Authorization").slice(7);
      if (revoked.has(token)) return json({ error: {} }, 401);
      if (typeof answer === "number") return json({ error: {} }, answer);
      if (method === "POST") {
        const { weight } = JSON.parse(init.body);
        if (answer === "accept") {
          state.measurements.push({
            time: weight.sampleTime.physicalTime,
            kg: weight.weightGrams / 1000,
          });
        }
        return json({ name: "operations/stand-in", done: false });
      }
      return json({
        dataPoints: state.measurements
          .filter(({ time }) => new Date(time) >= new Date(from))
          .map(({ time, kg }) => ({
            weight: {
              sampleTime: { physicalTime: time },
              weightGrams: kg * 1000,
            },
          })),
      });
    };
  }

  window.standInReopen = async ({ width = 360, height = 640 } = {}) => {
    const frame = document.createElement("iframe");
    frame.style.cssText = `width:${width}px;height:${height}px;border:0;position:fixed;top:0;left:0;z-index:99999`;
    const loaded = new Promise((resolve) => {
      frame.onload = resolve;
    });
    frame.src = "/";
    document.body.appendChild(frame);
    // The frame starts on about:blank; its own window comes with the page.
    // The page fetches only once its scripts have hydrated it, long after
    // its document appears, so the stand-in is in place before.
    while (frame.contentWindow.location.href === "about:blank") {
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
    standInForHealthApi(frame.contentWindow);
    void standInForSignIn(frame.contentWindow);
    await loaded;
    return frame;
  };

  await standInForSignIn(window);
  standInForHealthApi(window);
  window.standIn = state;
})();
