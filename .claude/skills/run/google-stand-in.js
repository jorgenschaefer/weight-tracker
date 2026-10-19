// Browser snippet: puts a Google in memory in place of the real one, so the
// page signs in, fetches and enters weights without a Google account. Run it
// on http://localhost:3000 once the page has loaded; it waits for Google
// Identity Services to load and then replaces what the page uses of it, and
// of fetch for the Google Health API. Reloading the page undoes it. A token
// it has revoked is answered with 401, as by Google.
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
//   requests      every request to Google Health, in order
(async () => {
  const READ =
    "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly";
  const WRITE =
    "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.writeonly";
  const API = "https://health.googleapis.com/v4/";
  while (window.google?.accounts?.oauth2 === undefined) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const state = {
    measurements: [],
    scopes: "both",
    signIn: "grant",
    write: "accept",
    read: "answer",
    delayMs: 800,
    requests: [],
  };
  let issued = 0;
  const revoked = new Set();
  const grantedScopes = () =>
    ({ both: `${READ} ${WRITE}`, read: READ, write: WRITE, none: "openid" })[
      state.scopes
    ];
  const oauth2 = window.google.accounts.oauth2;
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

  const realFetch = window.fetch.bind(window);
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status });
  window.fetch = async (url, init = {}) => {
    if (!String(url).startsWith(API)) return realFetch(url, init);
    const method = init.method ?? "GET";
    state.requests.push({ method, url: String(url), body: init.body });
    const answer = method === "POST" ? state.write : state.read;
    if (answer === "hang") return new Promise(() => {});
    await new Promise((resolve) => setTimeout(resolve, state.delayMs));
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
      dataPoints: state.measurements.map(({ time, kg }) => ({
        weight: { sampleTime: { physicalTime: time }, weightGrams: kg * 1000 },
      })),
    });
  };
  window.standIn = state;
})();
