// The verdict is tested where the person sees it: on the page, opened with
// the measurements in its cache on the day under test.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { screen } from "@testing-library/react";
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

/** The Satz zum Morgen, or why there is none: the page's one headline. */
const headline = () => screen.findByRole("heading", { level: 1 });
/** The line above the Satz zum Morgen, its spaces as Testing Library reads them. */
const lineAbove = async () =>
  (await headline()).previousElementSibling?.textContent?.replace(
    /\s+/g,
    " ",
  ) ?? null;

const surface = () => screen.getByRole("main");
const COLOURS = {
  Grün: { backgroundColor: "#D3EAD0", color: "#163D1B" },
  Gelb: { backgroundColor: "#F3E2A2", color: "#3B3004" },
  Rot: { backgroundColor: "#F2C6B8", color: "#5A1A0B" },
  neutral: { backgroundColor: "#DDE1E5", color: "#20262C" },
};

describe("the Ampel, the line and the Satz zum Morgen on the user's weight (AC-7)", () => {
  it.each<[string, keyof typeof COLOURS, string, string]>([
    [
      "2026-07-13",
      "Rot",
      "92 % sicher, dass du nicht abnimmst",
      "Achtung, du nimmst wieder zu.",
    ],
    [
      "2026-07-14",
      "Rot",
      "90 % sicher, dass du nicht abnimmst",
      "Du nimmst seit 2 Tagen zu.",
    ],
    [
      "2026-10-01",
      "Rot",
      "95 % sicher, dass du nicht abnimmst",
      "Du nimmst seit Wochen zu.",
    ],
    [
      "2026-10-03",
      "Rot",
      "86 % sicher, dass du nicht abnimmst",
      "Leichter Morgen, aber ein Tag ändert den Trend noch nicht.",
    ],
    [
      "2026-10-04",
      "Gelb",
      "73 % sicher, dass du nicht abnimmst",
      "Die Zunahme ist gestoppt. Ob du abnimmst, ist noch offen.",
    ],
    [
      "2026-10-05",
      "Gelb",
      "54 % sicher, dass du nicht abnimmst",
      "Ob du abnimmst, ist noch offen.",
    ],
    [
      "2026-10-06",
      "Gelb",
      "64 % sicher, dass du abnimmst",
      "Es geht wahrscheinlich abwärts, noch nicht sicher.",
    ],
    [
      "2026-10-08",
      "Grün",
      "88 % sicher, dass du abnimmst",
      "Du nimmst wieder ab.",
    ],
    [
      "2026-10-09",
      "Grün",
      "91 % sicher, dass du abnimmst",
      "Du nimmst seit 2 Tagen ab.",
    ],
    [
      "2026-10-12",
      "Grün",
      "91 % sicher, dass du abnimmst",
      "Ausreißer, der Trend bleibt.",
    ],
    [
      "2026-10-13",
      "Grün",
      "89 % sicher, dass du abnimmst",
      "Du nimmst seit 6 Tagen ab.",
    ],
    [
      "2026-10-17",
      "Grün",
      "81 % sicher, dass du abnimmst",
      "Zwei schwerere Morgen: Du nimmst noch ab, aber langsamer.",
    ],
    [
      "2026-10-18",
      "Gelb",
      "74 % sicher, dass du abnimmst",
      "Achtung, die Abnahme wird langsamer.",
    ],
    [
      "2026-10-19",
      "Grün",
      "84 % sicher, dass du abnimmst",
      "Du nimmst wieder ab.",
    ],
    [
      "2026-10-20",
      "Grün",
      "90 % sicher, dass du abnimmst",
      "Du nimmst seit 2 Tagen ab.",
    ],
  ])("on %s is %s, „%s“ and „%s“", async (today, light, line, sentence) => {
    openHistoryOn(today);

    expect(await headline()).toHaveTextContent(new RegExp(`^${sentence}$`));
    expect(await lineAbove()).toBe(line);
    expect(surface()).toHaveStyle(COLOURS[light]);
  });
});

describe("the line above the Satz (AC-3)", () => {
  it("says at most 99 % for a loss as good as certain", async () => {
    openOn("2026-10-17", steady("2026-10-17", 35, -1.4));

    expect(await lineAbove()).toBe("99 % sicher, dass du abnimmst");
  });

  it("says at most 99 % for no loss as good as certain", async () => {
    openOn("2026-10-17", steady("2026-10-17", 35, 1));

    expect(await lineAbove()).toBe("99 % sicher, dass du nicht abnimmst");
  });

  it("keeps N with its „%“ by a no-break space", async () => {
    openHistoryOn("2026-10-20");

    expect((await headline()).previousElementSibling?.textContent).toBe(
      "90\u00a0% sicher, dass du abnimmst",
    );
  });
});

describe("the Satz zum Morgen (AC-4)", () => {
  it("says „seit Wochen“ of a loss from its 14th day on", async () => {
    openOn("2026-10-17", steady("2026-10-17", 35, -1.4));

    expect(await headline()).toHaveTextContent(/^Du nimmst seit Wochen ab\.$/);
  });
});

describe("a day without a measurement (AC-8)", () => {
  it.each<[string, string, keyof typeof COLOURS, string, string]>([
    [
      "2026-10-22",
      "2026-10-19",
      "Grün",
      "84 % sicher, dass du abnimmst",
      "Du nimmst wieder ab.",
    ],
    [
      "2026-10-16",
      "2026-10-13",
      "Grün",
      "89 % sicher, dass du abnimmst",
      "Du nimmst seit 6 Tagen ab.",
    ],
    [
      "2026-10-07",
      "2026-10-04",
      "Gelb",
      "73 % sicher, dass du nicht abnimmst",
      "Die Zunahme ist gestoppt. Ob du abnimmst, ist noch offen.",
    ],
  ])(
    "on %s, the last on %s, shows its day: %s, „%s“, „%s“",
    async (today, lastDay, light, line, sentence) => {
      openHistoryOn(today, lastDay);

      expect(await headline()).toHaveTextContent(new RegExp(`^${sentence}$`));
      expect(await lineAbove()).toBe(line);
      expect(surface()).toHaveStyle(COLOURS[light]);
    },
  );

  it("shows „Letzte Messung vor 4 Tagen“ further back, neutral, without line or sentence", async () => {
    openHistoryOn("2026-10-24", "2026-10-20");

    expect(await headline()).toHaveTextContent(/^Letzte Messung vor 4 Tagen$/);
    expect(document.body).not.toHaveTextContent(/sicher, dass/);
    expect(document.body).not.toHaveTextContent(/Du nimmst/);
    expect(surface()).toHaveStyle(COLOURS.neutral);
  });

  it("shows „Letzte Messung vor 5 Tagen“ after only three days of measurements", async () => {
    openOn("2026-10-17", steady("2026-10-12", 3, 0));

    expect(await headline()).toHaveTextContent(/^Letzte Messung vor 5 Tagen$/);
  });

  it("shows „Noch kein Urteil“ without any counting measurement, neutral, without line or sentence", async () => {
    openOn("2026-10-17", []);

    expect(await headline()).toHaveTextContent(/^Noch kein Urteil$/);
    expect((await headline()).previousElementSibling).toBeNull();
    expect(document.body).not.toHaveTextContent(/Ein Urteil gibt es/);
    expect(surface()).toHaveStyle(COLOURS.neutral);
  });

  it("shows Ampel, line and sentence from the first counting measurement on", async () => {
    openOn("2026-10-17", steady("2026-10-17", 1, 0));

    expect(await headline()).toHaveTextContent(
      /^Ob du abnimmst, ist noch offen\.$/,
    );
    expect(await lineAbove()).toBe("58 % sicher, dass du nicht abnimmst");
    expect(surface()).toHaveStyle(COLOURS.Gelb);
  });
});

describe("what the page no longer says (AC-10)", () => {
  it.each(["2026-08-22", "2026-09-12", "2026-10-15", "2026-10-19"])(
    "on %s, no Frühwarnung, its headlines or its sentence",
    async (today) => {
      openHistoryOn(today);

      expect(await headline()).not.toHaveTextContent(
        /^(Nimmt ab|Stagniert|Nimmt zu)$/,
      );
      expect(document.body).not.toHaveTextContent(/Frühwarnung/);
      expect(document.body).not.toHaveTextContent(
        /Der Trend (fällt|stagniert|steigt)/,
      );
    },
  );

  it.each([
    ["2026-10-17", "2026-10-17"],
    ["2026-10-21", "2026-10-17"],
  ])(
    "on %s, the last on %s, no „Langfristig · 4 Wochen“",
    async (today, lastDay) => {
      openHistoryOn(today, lastDay);

      await headline();
      expect(document.body).not.toHaveTextContent(/Langfristig/);
      expect(document.body).not.toHaveTextContent(/pro Woche/);
    },
  );

  it.each(["2026-08-22", "2026-08-28", "2026-09-12"])(
    "on %s, a former Warnstufe, the surface is red",
    async (today) => {
      openHistoryOn(today);

      await headline();
      expect(surface()).toHaveStyle(COLOURS.Rot);
    },
  );

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

  it.each(["2026-08-30", "2026-09-15", "2026-09-20", "2026-10-19"])(
    "on %s, a morning beyond the threshold, no card of the morning",
    async (today) => {
      openHistoryOn(today);

      await headline();
      expect(document.body).not.toHaveTextContent(/dem Trend/);
      expect(document.body).not.toHaveTextContent(/Ausreißer/);
    },
  );

  it.each(["2026-10-01", "2026-10-03", "2026-10-04", "2026-10-14"])(
    "on %s, after the gap, no comparison",
    async (today) => {
      openHistoryOn(today);

      await headline();
      expect(document.body).not.toHaveTextContent(/ohne Messung/);
      expect(document.body).not.toHaveTextContent(/normalen Schwankung/);
    },
  );
});

/** The figure labelled `label`, value and unit, as it reads; `null` where there is none. */
function figure(label: string): string | null {
  const term = screen.queryByText(label, { selector: "dt" });
  return term?.nextElementSibling?.textContent ?? null;
}

describe("the four figures (AC-5)", () => {
  it.each([
    [
      "2026-10-19",
      "97,7 ± 0,3 kg",
      "97,0 kg",
      "−0,39 ± 0,29 kg/Wo",
      "Defizit",
      "430 ± 320 kcal/Tag",
    ],
    [
      "2026-10-20",
      "97,4 ± 0,3 kg",
      "96,9 kg",
      "−0,47 ± 0,29 kg/Wo",
      "Defizit",
      "510 ± 320 kcal/Tag",
    ],
  ])(
    "on %s (AC-7) are „Gewicht, geschätzt“ %s, „Gemessen“ %s, „Tempo“ %s and „%s“ %s",
    async (today, estimated, measured, pace, balance, kcal) => {
      openHistoryOn(today);

      await headline();
      expect(figure("Gewicht, geschätzt")).toBe(estimated);
      expect(figure("Gemessen")).toBe(measured);
      expect(figure("Tempo")).toBe(pace);
      expect(figure(balance)).toBe(kcal);
    },
  );

  it("say „Bilanz“ at a pace of 0, after the first counting measurement (AC-4)", async () => {
    openOn("2026-10-17", steady("2026-10-17", 1, 0, 95.2));

    await headline();
    expect(figure("Gewicht, geschätzt")).toBe("95,2 ± 1,0 kg");
    expect(figure("Gemessen")).toBe("95,2 kg");
    expect(figure("Tempo")).toBe("±0,00 ± 0,50 kg/Wo");
    expect(figure("Bilanz")).toBe("0 ± 550 kcal/Tag");
    expect(figure("Defizit")).toBeNull();
    expect(figure("Überschuss")).toBeNull();
  });

  it("say „Bilanz 0“ where „Tempo“ shows ±0,00, on 3.7. (AC-4)", async () => {
    openHistoryOn("2026-07-03");

    await headline();
    expect(figure("Tempo")).toMatch(/^±0,00 /);
    expect(figure("Bilanz")).toBe("0 ± 560 kcal/Tag");
    expect(figure("Defizit")).toBeNull();
    expect(figure("Überschuss")).toBeNull();
  });

  // A second morning 180 g off the first gives a pace of about ±0,0049 kg
  // per week: ±0,00 on the page, though 10 kcal a day unrounded.
  it.each([
    ["under", -0.18],
    ["over", 0.18],
  ])(
    "say „Bilanz 0“ at a pace just %s 0 that „Tempo“ shows as ±0,00 (AC-4)",
    async (_, kgOff) => {
      openOn("2026-10-17", [
        at("2026-10-16T07:00:00+02:00", 95),
        at("2026-10-17T07:00:00+02:00", 95 + kgOff),
      ]);

      await headline();
      expect(figure("Tempo")).toBe("±0,00 ± 0,50 kg/Wo");
      expect(figure("Bilanz")).toBe("0 ± 550 kcal/Tag");
      expect(figure("Defizit")).toBeNull();
      expect(figure("Überschuss")).toBeNull();
    },
  );

  // 190 g off gives about ±0,0052 kg per week, the least that shows a sign.
  it.each([
    ["−0,01", "Defizit", -0.19, "Überschuss"],
    ["+0,01", "Überschuss", 0.19, "Defizit"],
  ])(
    "say the least pace „Tempo“ shows with a sign, %s, as „%s“ (AC-5)",
    async (pace, shown, kgOff, absent) => {
      openOn("2026-10-17", [
        at("2026-10-16T07:00:00+02:00", 95),
        at("2026-10-17T07:00:00+02:00", 95 + kgOff),
      ]);

      await headline();
      expect(figure("Tempo")).toBe(`${pace} ± 0,50 kg/Wo`);
      expect(figure(shown)).toBe("10 ± 550 kcal/Tag");
      expect(figure(absent)).toBeNull();
      expect(figure("Bilanz")).toBeNull();
    },
  );

  it("say a gain with its sign and „Überschuss“", async () => {
    openOn("2026-10-17", steady("2026-10-17", 35, 0.5));

    await headline();
    expect(figure("Tempo")).toBe("+0,47 ± 0,29 kg/Wo");
    expect(figure("Überschuss")).toBe("520 ± 320 kcal/Tag");
    expect(figure("Defizit")).toBeNull();
  });

  it("stand with „Letzte Messung vor N Tagen“, those of the last day with a measurement", async () => {
    openHistoryOn("2026-10-24", "2026-10-20");

    expect(await headline()).toHaveTextContent(/^Letzte Messung vor 4 Tagen$/);
    expect(figure("Gewicht, geschätzt")).toBe("97,4 ± 0,3 kg");
    expect(figure("Gemessen")).toBe("96,9 kg");
    expect(figure("Tempo")).toBe("−0,47 ± 0,29 kg/Wo");
    expect(figure("Defizit")).toBe("510 ± 320 kcal/Tag");
  });

  it("stay those of the last day with a measurement up to 3 days after it", async () => {
    openHistoryOn("2026-10-22", "2026-10-19");

    await headline();
    expect(figure("Gewicht, geschätzt")).toBe("97,7 ± 0,3 kg");
    expect(figure("Gemessen")).toBe("97,0 kg");
    expect(figure("Tempo")).toBe("−0,39 ± 0,29 kg/Wo");
    expect(figure("Defizit")).toBe("430 ± 320 kcal/Tag");
  });

  it("are not there without any counting measurement", async () => {
    openOn("2026-10-17", []);

    expect(await headline()).toHaveTextContent(/^Noch kein Urteil$/);
    expect(document.querySelector("dl")).toBeNull();
  });
});

describe("the figures", () => {
  it("count only the first measurement of a day, though „Letzte Messung“ is the newest", async () => {
    const loss = steady("2026-10-17", 35, -0.7);
    const laterTheSameDay = loss.slice(-5).map((m) => ({
      time: new Date(m.time.getTime() + 5 * 3600_000),
      kg: m.kg + 3,
    }));
    openOn("2026-10-17", [...loss, ...laterTheSameDay]);

    expect(await headline()).toHaveTextContent(/^Du nimmst seit Wochen ab\.$/);
    expect(figure("Gemessen")).toBe("95,0 kg");
    // 3 kg heavier, the later measurements would pull the trend up.
    expect(figure("Gewicht, geschätzt")).toBe("95,0 ± 0,3 kg");
    expect(figure("Tempo")).toBe("−0,66 ± 0,29 kg/Wo");
    expect(figure("Defizit")).toBe("720 ± 320 kcal/Tag");
    expect(
      screen.getByText(/^Letzte Messung 17\.10\. um 12:00 Uhr: 98,0 kg$/),
    ).toBeInTheDocument();
  });

  it("are all four from the first measurements on, and the graph draws the line and band from them", async () => {
    openOn("2026-10-17", steady("2026-10-17", 4, 0, 95.2));

    await headline();
    expect(screen.getByText(/^Letzte Messung 17\.10\./)).toBeInTheDocument();
    expect(figure("Gemessen")).toBe("95,2 kg");
    expect(figure("Gewicht, geschätzt")).toMatch(/^95,2 ± /);
    expect(figure("Tempo")).toMatch(/^±0,00 ± /);
    const graph = await screen.findByRole("img", {
      name: "Messungen und Trend, 6 Wochen, Bis heute",
    });
    expect(graph.querySelectorAll("circle")).toHaveLength(4);
    expect(graph.querySelectorAll("polyline")).toHaveLength(1);
    expect(graph.querySelectorAll("polygon")).toHaveLength(1);
  });

  it("are those of the last day after a gap, and the graph breaks its line and band there", async () => {
    openOn("2026-10-04", [
      ...steady("2026-09-07", 7, 0, 99),
      at("2026-09-21T07:00:00+02:00", 98),
      ...steady("2026-10-04", 4, 0, 97),
    ]);

    await headline();
    expect(figure("Gemessen")).toBe("97,0 kg");
    expect(figure("Gewicht, geschätzt")).not.toBeNull();
    const graph = await screen.findByRole("img", {
      name: "Messungen und Trend, 6 Wochen, Bis heute",
    });
    // 21.9. alone between two gaps.
    expect(graph.querySelectorAll("polyline")).toHaveLength(3);
    expect(graph.querySelectorAll("polygon")).toHaveLength(3);
  });
});

describe("the Satz zum Morgen as it is set", () => {
  // jsdom lays nothing out, so the stylesheet is read instead: the phone's
  // rules, outside the media queries.
  const phoneRules = readFileSync(
    join(import.meta.dirname, "Verdict.module.css"),
    "utf8",
  ).replace(/@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "");

  it("is 28px bold on the phone, under the line in small capitals", async () => {
    openHistoryOn("2026-10-20");

    // Vitest names a CSS module's class `_<name>_<hash>`.
    const ruleOf = (element: Element | null) => {
      const name = /^_(\w+)_/.exec(element?.className ?? "")?.[1];
      return new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`).exec(phoneRules)?.[1];
    };
    const sentence = await headline();
    expect(ruleOf(sentence)).toMatch(/font-size:\s*28px/);
    expect(ruleOf(sentence)).toMatch(/font-weight:\s*700/);
    expect(ruleOf(sentence.previousElementSibling)).toMatch(
      /text-transform:\s*uppercase/,
    );
  });
});
