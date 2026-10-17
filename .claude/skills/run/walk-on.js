// Browser snippet: defines walkOn(day, opts), which opens the page in a
// same-origin iframe as it is on `day` (Berlin), with the test data up to
// that day as the cache, and returns what the page says. Run it once on
// http://localhost:3000 after fixture-snippet.mjs's snippet.
//
// opts: time ("08:00:00+02:00"), only (rows { day, kg } instead of the test
// data), width/height of the frame (360×640), keep (leave the frame open as
// window.walkFrame, to look at or screenshot it).
//
// One call takes a few seconds under `next dev`; for a sweep over many days,
// start a loop without awaiting it and read its results afterwards, since a
// browser-tool call times out after about 45 s.
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
    emphasis: doc.querySelector("[data-emphasis]")?.dataset.emphasis,
    text: doc.body.innerText.replace(/\n+/g, " | "),
  };
  if (keep) window.walkFrame = frame;
  else frame.remove();
  return result;
};
