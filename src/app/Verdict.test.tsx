// The verdict is tested where the person sees it: on the page, opened with
// the measurements in its cache on the day under test.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  at,
  leavePage,
  NOW,
  openHistoryOn,
  openOn,
  standInForGoogle,
  steady,
} from "@/test/open-page";

vi.mock("@/measurement/google-health", () => ({
  loadGoogleSignIn: vi.fn(),
  enterMeasurement: vi.fn(),
  signIn: vi.fn(),
  fetchMeasurements: vi.fn(),
  revokeAccess: vi.fn(),
}));

beforeEach(() => standInForGoogle(NOW));
afterEach(leavePage);

const headline = () => screen.findByRole("heading", { level: 1 });
const EARLY_WARNING = "Frühwarnung · letzte Tage";

describe("the Frühwarnung", () => {
  it.each([
    [-0.5, "Nimmt ab"],
    [0, "Stagniert"],
    [0.5, "Nimmt zu"],
  ])(
    "at a steady %d kg per week says „%s“ under „Frühwarnung · letzte Tage“",
    async (kgPerWeek, text) => {
      openOn("2026-10-17", steady("2026-10-17", 35, kgPerWeek));

      const shown = await headline();
      expect(shown).toHaveTextContent(new RegExp(`^${text}$`));
      expect(
        screen.getByText(EARLY_WARNING).compareDocumentPosition(shown) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    },
  );

  it("stays „Nimmt ab“ in a fast loss whatever a single measurement says", async () => {
    const loss = steady("2026-10-17", 35, -1.4);
    const outlier = { ...loss[34], kg: loss[34].kg + 3 };
    openOn("2026-10-17", [...loss.slice(0, 34), outlier]);

    expect(await headline()).toHaveTextContent("Nimmt ab");
  });
});

describe("the sentence of the Frühwarnung", () => {
  it.each([
    ["2026-10-15", "Der Trend fällt seit mindestens einem Tag."],
    ["2026-10-17", "Der Trend fällt seit mindestens 3 Tagen."],
    ["2026-08-01", "Der Trend fällt seit 4 Tagen."],
    ["2026-08-22", "Der Trend stagniert seit einem Tag."],
    ["2026-08-29", "Der Trend stagniert seit 8 Tagen."],
    ["2026-10-18", "Der Trend steigt seit einem Tag."],
    ["2026-07-22", "Der Trend steigt seit mindestens 4 Tagen."],
    ["2026-09-15", "Der Trend steigt seit 17 Tagen."],
  ])("on %s is „%s“", async (today, sentence) => {
    openHistoryOn(today);

    await headline();
    expect(screen.getByText(sentence)).toBeInTheDocument();
  });

  it("stands under the headline, the card under it", async () => {
    openHistoryOn("2026-10-19");

    const sentence = await screen.findByText("Der Trend steigt seit 2 Tagen.");
    const follows = (a: Element, b: Element) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING;
    expect(follows(await headline(), sentence)).toBeTruthy();
    expect(
      follows(sentence, screen.getByText("Heute · 1,3 kg unter dem Trend")),
    ).toBeTruthy();
  });
});

describe("the page with the user's weight, 18.10. and 19.10. (AC-6)", () => {
  it.each([
    [
      "2026-07-19",
      "Nimmt zu",
      "Der Trend steigt seit mindestens einem Tag.",
      null,
      null,
    ],
    ["2026-07-29", "Nimmt ab", "Der Trend fällt seit einem Tag.", null, null],
    ["2026-08-07", "Nimmt zu", "Der Trend steigt seit einem Tag.", null, null],
    [
      "2026-08-22",
      "Stagniert",
      "Der Trend stagniert seit einem Tag.",
      null,
      null,
    ],
    [
      "2026-08-30",
      "Nimmt zu",
      "Der Trend steigt seit einem Tag.",
      "Heute · 1,9 kg über dem Trend",
      null,
    ],
    [
      "2026-09-15",
      "Nimmt zu",
      "Der Trend steigt seit 17 Tagen.",
      "Heute · 1,0 kg unter dem Trend",
      null,
    ],
    [
      "2026-09-16",
      "Stagniert",
      "Der Trend stagniert seit einem Tag.",
      null,
      null,
    ],
    [
      "2026-09-20",
      "Nimmt ab",
      "Der Trend fällt seit einem Tag.",
      "Heute · 1,0 kg über dem Trend",
      null,
    ],
    [
      "2026-09-22",
      "Stagniert",
      "Der Trend stagniert seit einem Tag.",
      null,
      null,
    ],
    [
      "2026-10-15",
      "Nimmt ab",
      "Der Trend fällt seit mindestens einem Tag.",
      null,
      null,
    ],
    [
      "2026-10-17",
      "Nimmt ab",
      "Der Trend fällt seit mindestens 3 Tagen.",
      null,
      null,
    ],
    ["2026-10-18", "Nimmt zu", "Der Trend steigt seit einem Tag.", null, null],
    [
      "2026-10-19",
      "Nimmt zu",
      "Der Trend steigt seit 2 Tagen.",
      "Heute · 1,3 kg unter dem Trend",
      "Nimmt ab, −0,33 kg pro Woche (≈ 360 kcal Defizit pro Tag)",
    ],
  ])(
    "on %s is „%s“, „%s“, the card %s and „Langfristig“ %s",
    async (today, verdict, sentence, card, longTerm) => {
      openHistoryOn(today);

      expect(await headline()).toHaveTextContent(new RegExp(`^${verdict}$`));
      expect(screen.getByText(sentence)).toBeInTheDocument();
      const cards = screen.queryAllByText(/ kg (über|unter) dem Trend$/);
      expect(cards.map((shown) => shown.textContent)).toEqual(
        card === null ? [] : [card],
      );
      if (longTerm !== null) {
        expect(
          screen.getByText(
            (_, element) =>
              element?.tagName === "P" && element.textContent === longTerm,
          ),
        ).toBeInTheDocument();
      }
    },
  );

  it.each([
    ["2026-07-28", "Nimmt zu"],
    ["2026-08-06", "Nimmt ab"],
    ["2026-08-21", "Nimmt zu"],
    ["2026-08-29", "Stagniert"],
    ["2026-09-19", "Stagniert"],
    ["2026-09-21", "Nimmt ab"],
  ])(
    "on %s, the day before a change, is still „%s“",
    async (today, verdict) => {
      openHistoryOn(today);

      expect(await headline()).toHaveTextContent(new RegExp(`^${verdict}$`));
    },
  );

  it("on 18.7. is „Noch kein Urteil“", async () => {
    openHistoryOn("2026-07-18");

    expect(await headline()).toHaveTextContent(/^Noch kein Urteil$/);
  });

  it.each(["2026-10-01", "2026-10-14"])(
    "on %s is the comparison after the gap",
    async (today) => {
      openHistoryOn(today);

      expect(await headline()).toHaveTextContent(/^Nach 9 Tagen ohne Messung/);
    },
  );
});

describe("what the page no longer says", () => {
  it.each(["2026-10-12", "2026-10-13", "2026-08-26", "2026-09-05"])(
    "on %s neither „kein Abnehmen“, „Zuletzt abgenommen bis“ nor „4 Wochen: …“",
    async (today) => {
      openHistoryOn(today);

      await headline();
      expect(document.body).not.toHaveTextContent(/kein Abnehmen/);
      expect(document.body).not.toHaveTextContent(/Zuletzt abgenommen/);
      expect(document.body).not.toHaveTextContent(/4 Wochen:/);
    },
  );
});

describe("a last measurement too old", () => {
  it.each([
    ["2026-09-25", "Stagniert"],
    ["2026-09-26", "Letzte Messung vor 4 Tagen"],
  ])("on %s, after the last on 22.9., is %s", async (today, text) => {
    openHistoryOn(today);

    expect(await headline()).toHaveTextContent(text);
  });

  it("wins over „Nimmt zu“, without „Frühwarnung“", async () => {
    openHistoryOn("2026-10-23");

    expect(await headline()).toHaveTextContent("Letzte Messung vor 4 Tagen");
    expect(screen.queryByText(/Nimmt zu/)).not.toBeInTheDocument();
    expect(screen.queryByText(EARLY_WARNING)).not.toBeInTheDocument();
  });

  it("wins over „Noch kein Urteil“", async () => {
    openOn("2026-10-17", steady("2026-10-12", 3, 0));

    expect(await headline()).toHaveTextContent("Letzte Messung vor 5 Tagen");
  });
});

describe("after a gap", () => {
  const TWO_WEEKS_AFTER =
    "Ein Urteil gibt es wieder zwei Wochen nach der Lücke.";

  it("compares with the trend before it, clearly more than the normal variation", async () => {
    openHistoryOn("2026-10-03");

    expect(await headline()).toHaveTextContent(
      "Nach 9 Tagen ohne Messung: +1,0 kg gegenüber vorher",
    );
    expect(
      screen.getByText(
        `Deutlich mehr als die normale Schwankung. ${TWO_WEEKS_AFTER}`,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(EARLY_WARNING)).not.toBeInTheDocument();
  });

  it("compares with the trend before it, within the normal variation", async () => {
    openHistoryOn("2026-10-04");

    expect(await headline()).toHaveTextContent(
      "Nach 9 Tagen ohne Messung: +0,3 kg gegenüber vorher",
    );
    expect(
      screen.getByText(`Im Rahmen der normalen Schwankung. ${TWO_WEEKS_AFTER}`),
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
});

describe("„Noch kein Urteil“", () => {
  const IN_THREE_WEEKS =
    "Ein Urteil gibt es nach knapp drei Wochen mit Messungen.";

  it("stands where the measurements do not suffice for a trend", async () => {
    openOn("2026-10-17", steady("2026-10-17", 4, 0, 95.2));

    expect(await headline()).toHaveTextContent("Noch kein Urteil");
    expect(screen.getByText(IN_THREE_WEEKS)).toBeInTheDocument();
    expect(screen.queryByText(EARLY_WARNING)).not.toBeInTheDocument();
  });

  it("stands while the trend has no 14-day pace", async () => {
    openHistoryOn("2026-07-18");

    expect(await headline()).toHaveTextContent("Noch kein Urteil");
    expect(screen.getByText(IN_THREE_WEEKS)).toBeInTheDocument();
  });

  it("stands after a gap with no trend before it", async () => {
    openOn("2026-10-17", [
      ...steady("2026-10-03", 3, 0),
      ...steady("2026-10-17", 2, 0),
    ]);

    expect(await headline()).toHaveTextContent("Noch kein Urteil");
    expect(screen.getByText(IN_THREE_WEEKS)).toBeInTheDocument();
  });
});

/** The figure labelled `label`, value and unit, as it reads; `null` where there is none. */
function figure(label: string): string | null {
  const term = screen.queryByText(label, { selector: "dt" });
  return term?.nextElementSibling?.textContent ?? null;
}

describe("the figures", () => {
  it("are the trend and „Gemessen“, in German", async () => {
    openHistoryOn("2026-10-17");

    await headline();
    expect(figure("Trend")).toBe("97,8 kg");
    expect(figure("Gemessen")).toBe("98,6 kg");
  });

  it("hold no pace, which „Langfristig“ says alone", async () => {
    openHistoryOn("2026-10-17");

    await headline();
    expect(figure("Tempo 4 Wochen")).toBeNull();
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
    expect(
      screen.getByText(/^Nimmt ab, −0,70 kg pro Woche/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/^Letzte Messung 17\.10\. um 12:00 Uhr: 98,0 kg$/),
    ).toBeInTheDocument();
  });

  it("are only „Gemessen“ under „Noch kein Urteil“ without a trend, and the graph only the points", async () => {
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

  it("are the trend and „Gemessen“ under „Noch kein Urteil“ with a trend, and the graph draws the trend line", async () => {
    // No trend on 21.9. before the gap; 4.10. after it has one.
    openOn("2026-10-04", [
      ...steady("2026-09-07", 7, 0, 99),
      at("2026-09-21T07:00:00+02:00", 98),
      ...steady("2026-10-04", 4, 0, 97),
    ]);

    expect(await headline()).toHaveTextContent("Noch kein Urteil");
    expect(figure("Trend")).toBe("97,0 kg");
    expect(figure("Gemessen")).toBe("97,0 kg");
    const graph = await screen.findByRole("img", {
      name: "Messungen und Trend der letzten sechs Wochen",
    });
    expect(graph.querySelectorAll("polyline").length).toBeGreaterThan(0);
  });
});

describe("the colours of the surface", () => {
  it.each([
    ["2026-10-15", "„Nimmt ab“", "#D5E4F1", "#10355A"],
    ["2026-08-22", "„Stagniert“ on its first day", "#F5E1CB", "#5A2C06"],
    ["2026-08-23", "„Stagniert“ for 2 days", "#F5E1CB", "#5A2C06"],
    ["2026-08-28", "„Stagniert“ for 7 days", "#EDA562", "#3A1801"],
    ["2026-10-18", "„Nimmt zu“ on its first day", "#F5E1CB", "#5A2C06"],
    ["2026-09-04", "„Nimmt zu“ for 6 days", "#F5E1CB", "#5A2C06"],
    ["2026-09-05", "„Nimmt zu“ for 7 days", "#EDA562", "#3A1801"],
    ["2026-09-11", "„Nimmt zu“ for 13 days", "#EDA562", "#3A1801"],
    ["2026-09-12", "„Nimmt zu“ for 14 days", "#8A380A", "#FFF3E8"],
    ["2026-10-03", "a clear increase after a gap", "#EDA562", "#3A1801"],
    [
      "2026-10-04",
      "a change within the normal variation after a gap",
      "#DDE1E5",
      "#20262C",
    ],
    ["2026-09-26", "a last measurement too old", "#DDE1E5", "#20262C"],
  ])("on %s, %s, are %s with %s", async (today, _, surface, ink) => {
    openHistoryOn(today);

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

  it.each([
    ["2026-08-22", "„Stagniert“ on Warnstufe 1"],
    ["2026-08-28", "„Stagniert“ on Warnstufe 2"],
    ["2026-10-18", "„Nimmt zu“ on Warnstufe 1"],
    ["2026-09-05", "„Nimmt zu“ on Warnstufe 2"],
    ["2026-09-12", "„Nimmt zu“ on Warnstufe 3"],
  ])("is set on %s, %s, as „Nimmt ab“", async (today) => {
    openHistoryOn("2026-10-15");
    const losing = styleOf(await headline());
    cleanup();
    openHistoryOn(today);

    expect(styleOf(await headline())).toEqual(losing);
  });
});
