// Browser snippet: defines walkOn(day, opts), which opens the page in a
// same-origin iframe as it is on `day` (Berlin), with the test data up to
// that day as the cache, and returns what the page says. Run it once on
// http://walk.localhost:<port> after fixture-snippet.mjs's snippet; on any
// other host it throws before it defines anything.
//
// opts: time ("08:00:00+02:00"), only (rows { day, kg } instead of the test
// data), width/height of the frame (360×640), keep (leave the frame open as
// window.walkFrame, to look at or screenshot it).
//
// One call takes a few seconds under `next dev`; for a sweep over many days,
// start a loop without awaiting it and read its results afterwards, since a
// browser-tool call times out after about 45 s.
if (location.hostname !== "walk.localhost") {
  throw new Error(
    `walk-on.js runs only on walk.localhost, to keep the localStorage of ${location.host} as it is - open http://walk.localhost${location.port ? `:${location.port}` : ":<port of the dev server, in .next/dev/lock>"} and run it there`,
  );
}
window.walkOn = async (day, opts = {}) => {
  const {
    time = "08:00:00+02:00",
    only = null,
    width = 360,
    height = 640,
    keep = false,
  } = opts;
  const rows =
    only ??
    JSON.parse(localStorage.getItem("walk:fixture")).filter(
      (r) => r.day <= day,
    );
  const measurements = rows.map((r) => ({
    time: new Date(`${r.day}T07:00:00+02:00`).toISOString(),
    kg: r.kg,
  }));
  const now = new Date(`${day}T${time}`).getTime();
  // Without a kept token the page does not fetch on opening: neither from the
  // real Google nor with a token of the stand-in.
  localStorage.removeItem("gewicht:token:v1");
  localStorage.setItem(
    "gewicht:v1",
    JSON.stringify({ fetchedAt: new Date(now).toISOString(), measurements }),
  );
  const frame = document.createElement("iframe");
  frame.style.cssText = `width:${width}px;height:${height}px;border:0;position:fixed;top:0;left:0;z-index:99999`;
  frame.src = "/";
  document.body.appendChild(frame);
  await new Promise((r) => {
    frame.onload = r;
  });
  await new Promise((r) => setTimeout(r, 400));
  // The page reads the clock again on `visibilitychange` (useToday in
  // src/app/page.tsx), so a fake Date and that event set its day.
  const Real = frame.contentWindow.Date;
  frame.contentWindow.Date = class extends Real {
    constructor(...args) {
      if (args.length === 0) super(now);
      else super(...args);
    }
    static now() {
      return now;
    }
  };
  frame.contentDocument.dispatchEvent(new Event("visibilitychange"));
  await new Promise((r) => setTimeout(r, 300));
  const doc = frame.contentDocument;
  const result = {
    day,
    surface: frame.contentWindow.getComputedStyle(doc.querySelector("main"))
      .backgroundColor,
    text: doc.body.innerText.replace(/\n+/g, " | "),
  };
  if (keep) window.walkFrame = frame;
  else frame.remove();
  return result;
};
