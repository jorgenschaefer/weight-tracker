// The verdict is tested where the person sees it: on the page, opened with
// the measurements in its cache on the day under test.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Measurement } from "@/measurement/measurement";
import {
  leavePage,
  NOW,
  renderPage,
  standInForGoogle,
  steady,
  storeCache,
} from "@/test/open-page";
import { weightHistory } from "@/test/weight-history-fixture";

vi.mock("@/measurement/google-health", () => ({
  loadGoogleSignIn: vi.fn(),
  enterMeasurement: vi.fn(),
  signIn: vi.fn(),
  fetchMeasurements: vi.fn(),
  revokeAccess: vi.fn(),
}));

beforeEach(() => standInForGoogle(NOW));
afterEach(leavePage);

/** 18:00 in Berlin summer time on `day`. */
const evening = (day: string) => new Date(`${day}T18:00:00+02:00`);

/** Opens the page in the evening of `today`, with `measurements` in the cache. */
function openOn(today: string, measurements: Measurement[]) {
  vi.setSystemTime(evening(today));
  storeCache(evening(today), measurements);
  renderPage();
}

/** The 18.10.2026 the fixture lacks: 98.4 kg, the day after its last. */
const OCTOBER_18: Measurement = {
  time: new Date("2026-10-18T07:00:00+02:00"),
  kg: 98.4,
};

/** Opens the page in the evening of `today` with the fixture and 18.10. up to then. */
const openFixtureOn = (today: string) =>
  openOn(
    today,
    [...weightHistory(), OCTOBER_18].filter((m) => m.time <= evening(today)),
  );

const headline = () => screen.findByRole("heading", { level: 1 });

describe("the verdict", () => {
  it("is „Nimmt ab“ while the trend falls faster than 0.2 kg per week", async () => {
    openOn("2026-10-17", steady("2026-10-17", 35, -0.5));

    expect(await headline()).toHaveTextContent("Nimmt ab");
  });

  it("is „Seit N Tagen kein Abnehmen“ from the last day with a falling trend, and says until when it fell", async () => {
    openFixtureOn("2026-08-12");

    expect(await headline()).toHaveTextContent("Seit 10 Tagen kein Abnehmen");
    expect(screen.getByText("Zuletzt abgenommen bis 2.8.")).toBeInTheDocument();
  });

  it.each([
    ["2026-10-11", "Nimmt ab"],
    ["2026-10-12", "Nimmt ab"],
    ["2026-10-13", "Seit 3 Tagen kein Abnehmen"],
  ])(
    "never says 1 or 2 days without a decrease: on %s it says %s",
    async (today, text) => {
      openFixtureOn(today);

      expect(await headline()).toHaveTextContent(text);
    },
  );

  it("is „Seit mindestens N Tagen kein Abnehmen“ from the first measurement where no trend fell, with no day it fell until", async () => {
    openOn("2026-10-17", steady("2026-10-17", 17, 0.5));

    expect(await headline()).toHaveTextContent(
      "Seit mindestens 16 Tagen kein Abnehmen",
    );
    expect(screen.queryByText(/Zuletzt abgenommen/)).not.toBeInTheDocument();
  });

  it("stays „Nimmt ab“ in a fast loss whatever a single measurement says", async () => {
    const loss = steady("2026-10-17", 35, -0.7);
    const outlier = { ...loss[34], kg: loss[34].kg + 3 };
    openOn("2026-10-17", [...loss.slice(0, 34), outlier]);

    expect(await headline()).toHaveTextContent("Nimmt ab");
  });
});

describe("„Nimmt zu“", () => {
  it("says „Seit mindestens N Tagen kein Abnehmen“ where no trend fell", async () => {
    openOn("2026-10-17", steady("2026-10-17", 17, 2.0));

    expect(await headline()).toHaveTextContent(/^Nimmt zu$/);
    expect(
      screen.getByText("Seit mindestens 16 Tagen kein Abnehmen"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Zuletzt abgenommen/)).not.toBeInTheDocument();
  });
});

describe("the verdict with the user's weight and 18.10.", () => {
  it.each([
    ["2026-10-12", "Nimmt ab", null],
    [
      "2026-10-13",
      "Seit 3 Tagen kein Abnehmen",
      "Zuletzt abgenommen bis 10.10.",
    ],
    [
      "2026-10-17",
      "Nimmt zu",
      "Seit 7 Tagen kein Abnehmen, zuletzt abgenommen bis 10.10.",
    ],
    [
      "2026-10-18",
      "Nimmt zu",
      "Seit 8 Tagen kein Abnehmen, zuletzt abgenommen bis 10.10.",
    ],
    ["2026-07-13", "Nimmt zu", "Zuletzt abgenommen bis 11.7."],
    ["2026-08-04", "Nimmt zu", "Zuletzt abgenommen bis 2.8."],
  ])("on %s is „%s“, then „%s“", async (today, verdict, sentence) => {
    openFixtureOn(today);

    expect(await headline()).toHaveTextContent(new RegExp(`^${verdict}$`));
    if (sentence !== null) {
      expect(screen.getByText(sentence)).toBeInTheDocument();
    }
  });

  it("shows on 18.10. the 4 weeks still a loss", async () => {
    openFixtureOn("2026-10-18");

    await headline();
    expect(screen.getByText("4 Wochen: nimmt ab")).toBeInTheDocument();
  });

  it("counts on 8.8. up to the last measurement on 7.8.", async () => {
    openFixtureOn("2026-08-08");

    expect(await headline()).toHaveTextContent(/^Nimmt zu$/);
    expect(
      screen.getByText(
        "Seit 5 Tagen kein Abnehmen, zuletzt abgenommen bis 2.8.",
      ),
    ).toBeInTheDocument();
  });
});

describe("a last measurement too old", () => {
  it.each([
    ["2026-09-25", "Seit 4 Tagen kein Abnehmen"],
    ["2026-09-26", "Letzte Messung vor 4 Tagen"],
  ])("on %s, after the last on 22.9., is %s", async (today, text) => {
    openFixtureOn(today);

    expect(await headline()).toHaveTextContent(text);
  });

  it("wins over „Nimmt zu“", async () => {
    openFixtureOn("2026-10-22");

    expect(await headline()).toHaveTextContent("Letzte Messung vor 4 Tagen");
    expect(screen.queryByText(/Nimmt zu/)).not.toBeInTheDocument();
  });

  it("wins over „Noch kein Urteil“", async () => {
    openOn("2026-10-17", steady("2026-10-12", 3, 0));

    expect(await headline()).toHaveTextContent("Letzte Messung vor 5 Tagen");
  });
});

describe("after a gap", () => {
  const ALL_BUT_A_VERDICT =
    "Ein Urteil gibt es wieder ab der 5. Messung nach der Lücke.";

  it("compares with the trend before it, clearly more than the normal variation", async () => {
    openFixtureOn("2026-10-03");

    expect(await headline()).toHaveTextContent(
      "Nach 9 Tagen ohne Messung: +1,0 kg gegenüber vorher",
    );
    expect(
      screen.getByText(
        `Deutlich mehr als die normale Schwankung. ${ALL_BUT_A_VERDICT}`,
      ),
    ).toBeInTheDocument();
  });

  it("compares with the trend before it, within the normal variation", async () => {
    openFixtureOn("2026-10-04");

    expect(await headline()).toHaveTextContent(
      "Nach 9 Tagen ohne Messung: +0,3 kg gegenüber vorher",
    );
    expect(
      screen.getByText(
        `Im Rahmen der normalen Schwankung. ${ALL_BUT_A_VERDICT}`,
      ),
    ).toBeInTheDocument();
  });

  it("writes a decrease with a minus sign", async () => {
    openOn("2026-10-17", [
      ...steady("2026-10-01", 30, 0, 95),
      ...steady("2026-10-17", 2, 0, 92),
    ]);

    expect(await headline()).toHaveTextContent(
      "Nach 15 Tagen ohne Messung: −3,0 kg gegenüber vorher",
    );
    expect(
      screen.getByText(/^Deutlich mehr als die normale Schwankung\./),
    ).toBeInTheDocument();
  });

  it("gives the verdict again from the 5th measurement after it", async () => {
    openFixtureOn("2026-10-05");

    expect(await headline()).toHaveTextContent("Nimmt ab");
  });
});

describe("„Noch kein Urteil“", () => {
  const FROM_THE_5TH = "Ein Urteil gibt es ab der 5. Messung.";

  it("stands where the measurements do not suffice for a trend", async () => {
    openOn("2026-10-17", steady("2026-10-17", 4, 0, 95.2));

    expect(await headline()).toHaveTextContent("Noch kein Urteil");
    expect(screen.getByText(FROM_THE_5TH)).toBeInTheDocument();
  });

  it("stands after a gap with no trend before it", async () => {
    openOn("2026-10-17", [
      ...steady("2026-10-03", 3, 0),
      ...steady("2026-10-17", 2, 0),
    ]);

    expect(await headline()).toHaveTextContent("Noch kein Urteil");
    expect(screen.getByText(FROM_THE_5TH)).toBeInTheDocument();
  });
});

/** The figure labelled `label`, value and unit, as it reads; `null` where there is none. */
function figure(label: string): string | null {
  const term = screen.queryByText(label, { selector: "dt" });
  return term?.nextElementSibling?.textContent ?? null;
}

describe("the pace band", () => {
  it.each([
    [0.3, "4 Wochen: nimmt zu"],
    [0, "4 Wochen: stagniert"],
    [-0.3, "4 Wochen: nimmt ab"],
  ])(
    "at %d kg per week is „%s“, under the verdict",
    async (kgPerWeek, band) => {
      openOn("2026-10-17", steady("2026-10-17", 35, kgPerWeek));

      const verdict = await headline();
      const shown = screen.getByText(band);
      expect(verdict.compareDocumentPosition(shown)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    },
  );
});

describe("the figures", () => {
  it("are the trend, „Gemessen“ and the 4-week pace, in German", async () => {
    openFixtureOn("2026-10-17");

    await headline();
    expect(figure("Trend")).toBe("97,8 kg");
    expect(figure("Gemessen")).toBe("98,6 kg");
    expect(figure("Tempo 4 Wochen")).toBe("−0,42 kg pro Woche");
  });

  it("hold no other pace", async () => {
    openFixtureOn("2026-10-17");

    await headline();
    expect(screen.getAllByText(/kg pro Woche/)).toHaveLength(1);
    expect(screen.getAllByText(/−0,42/)).toHaveLength(1);
  });

  it("count only the first measurement of a day, though „Letzte Messung“ is the newest", async () => {
    const loss = steady("2026-10-17", 35, -0.7);
    const laterTheSameDay = loss.slice(-5).map((m) => ({
      time: new Date(m.time.getTime() + 5 * 3600_000),
      kg: m.kg + 3,
    }));
    openOn("2026-10-17", [...loss, ...laterTheSameDay]);

    expect(await headline()).toHaveTextContent("Nimmt ab");
    expect(figure("Trend")).toBe("95,0 kg");
    expect(figure("Gemessen")).toBe("95,0 kg");
    expect(figure("Tempo 4 Wochen")).toBe("−0,70 kg pro Woche");
    expect(
      screen.getByText(/^Letzte Messung 17\.10\. um 12:00 Uhr: 98,0 kg$/),
    ).toBeInTheDocument();
  });

  it("are only „Gemessen“ under „Noch kein Urteil“, and the graph only the points", async () => {
    openOn("2026-10-17", steady("2026-10-17", 4, 0, 95.2));

    await headline();
    expect(screen.getByText(/^Letzte Messung 17\.10\./)).toBeInTheDocument();
    expect(figure("Gemessen")).toBe("95,2 kg");
    expect(figure("Trend")).toBeNull();
    expect(figure("Tempo 4 Wochen")).toBeNull();
    expect(screen.queryByText(/4 Wochen:/)).not.toBeInTheDocument();
    const graph = await screen.findByRole("img", {
      name: "Messungen und Trend der letzten sechs Wochen",
    });
    expect(graph.querySelectorAll("circle")).toHaveLength(4);
    expect(graph.querySelectorAll("polyline")).toHaveLength(0);
  });
});

describe("the colours of the surface", () => {
  it.each([
    ["2026-10-12", "„Nimmt ab“", "#D5E4F1", "#10355A"],
    ["2026-10-14", "3–6 days without a decrease", "#F5E1CB", "#5A2C06"],
    ["2026-08-12", "7–13 days without a decrease", "#EDA562", "#3A1801"],
    ["2026-08-20", "14 and more days without a decrease", "#8A380A", "#FFF3E8"],
    [
      "2026-07-13",
      "„Nimmt zu“ under 3 days without a decrease",
      "#F5E1CB",
      "#5A2C06",
    ],
    [
      "2026-10-17",
      "„Nimmt zu“ 7 days without a decrease",
      "#EDA562",
      "#3A1801",
    ],
    [
      "2026-08-30",
      "„Nimmt zu“ 28 days without a decrease",
      "#8A380A",
      "#FFF3E8",
    ],
    ["2026-10-03", "a clear increase after a gap", "#EDA562", "#3A1801"],
    [
      "2026-10-04",
      "a change within the normal variation after a gap",
      "#DDE1E5",
      "#20262C",
    ],
    ["2026-09-26", "a last measurement too old", "#DDE1E5", "#20262C"],
  ])("on %s, %s, are %s with %s", async (today, _, surface, ink) => {
    openFixtureOn(today);

    await headline();
    expect(screen.getByRole("main")).toHaveStyle({
      backgroundColor: surface,
      color: ink,
    });
  });

  it("are neutral after a clear decrease after a gap", async () => {
    openOn("2026-10-17", [
      ...steady("2026-10-01", 30, 0, 95),
      ...steady("2026-10-17", 2, 0, 92),
    ]);

    await headline();
    expect(screen.getByRole("main")).toHaveStyle({
      backgroundColor: "#DDE1E5",
    });
  });

  it("are neutral under „Noch kein Urteil“", async () => {
    openOn("2026-10-17", steady("2026-10-17", 4, 0));

    await headline();
    expect(screen.getByRole("main")).toHaveStyle({
      backgroundColor: "#DDE1E5",
    });
  });
});

describe("the headline", () => {
  // jsdom lays nothing out, so the stylesheet is read instead: the phone's
  // rules, outside the wide screen's media query.
  const phoneRules = readFileSync(
    join(import.meta.dirname, "Verdict.module.css"),
    "utf8",
  ).replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "");

  function declarations(selector: string): Record<string, string> {
    const escaped = selector.replace(/[.[\]"]/g, "\\$&");
    const body = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(phoneRules);
    return Object.fromEntries(
      (body?.[1] ?? "")
        .split(";")
        .map((declaration) => declaration.split(":").map((part) => part.trim()))
        .filter(([property]) => property),
    );
  }

  /** How the stylesheet sets `heading`: its own rule over the headline's. */
  const styleOf = (heading: HTMLElement) => ({
    ...declarations(".headline"),
    ...declarations(`.headline[data-emphasis="${heading.dataset.emphasis}"]`),
  });

  it("grows heavier and no narrower with each level, wider at the highest", async () => {
    const styles = [];
    for (const today of [
      "2026-10-12",
      "2026-10-14",
      "2026-08-12",
      "2026-08-20",
    ]) {
      openFixtureOn(today);
      styles.push(styleOf(await headline()));
      cleanup();
    }

    const weights = styles.map((style) => Number(style["font-weight"]));
    const widths = styles.map((style) =>
      Number.parseFloat(style["font-stretch"]),
    );
    for (let i = 1; i < styles.length; i++) {
      expect(weights[i]).toBeGreaterThan(weights[i - 1]);
      expect(widths[i]).toBeGreaterThanOrEqual(widths[i - 1]);
    }
    expect(widths[3]).toBeGreaterThan(widths[0]);
  });

  it("is set for „Nimmt zu“ as for „Nimmt ab“", async () => {
    openFixtureOn("2026-10-12");
    const losing = styleOf(await headline());
    cleanup();
    openFixtureOn("2026-08-30");

    expect(styleOf(await headline())).toEqual(losing);
  });
});
