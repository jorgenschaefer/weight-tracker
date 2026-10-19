// The block is tested where the person sees it: on the page, opened with the
// measurements in its cache on the day under test.
import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  at,
  evening,
  leavePage,
  NOW,
  openOn,
  standInForGoogle,
  steady,
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

const HEADING = "Langfristig · 4 Wochen";
const CHARACTER = "Nah an der Wahrheit, reagiert langsam.";

/** Opens the page in the evening of `today` with the real history up to `lastDay`. */
const openHistoryOn = (today: string, lastDay = today) =>
  openOn(
    today,
    weightHistory().filter((m) => m.time <= evening(lastDay)),
  );

const headline = () => screen.findByRole("heading", { level: 1 });

/** The line of the 28-day pace, as it reads; `null` where there is none. */
async function paceLine(): Promise<string | null> {
  await headline();
  const heading = screen.queryByText(HEADING);
  return heading?.nextElementSibling?.textContent ?? null;
}

describe("„Langfristig · 4 Wochen“", () => {
  it("says the 28-day pace, its band and the deficit a day, and what the pace is like", async () => {
    openHistoryOn("2026-10-17");

    expect(await paceLine()).toBe(
      "Nimmt ab, −0,42 kg pro Woche (≈ 460 kcal Defizit pro Tag)",
    );
    expect(
      screen.getByText(HEADING).parentElement?.lastElementChild,
    ).toHaveTextContent(new RegExp(`^${CHARACTER}$`));
  });

  it("says a gain with the surplus a day", async () => {
    openOn("2026-10-17", steady("2026-10-17", 35, 0.5));

    expect(await paceLine()).toBe(
      "Nimmt zu, +0,50 kg pro Woche (≈ 550 kcal Überschuss pro Tag)",
    );
  });

  it("says „Stagniert“ without a bracket at a pace of 0,00", async () => {
    openOn("2026-10-17", steady("2026-10-17", 35, 0));

    expect(await paceLine()).toBe("Stagniert, ±0,00 kg pro Woche");
  });

  it.each([
    // The scatter 0.618 kg: the threshold 1.25 × 0.20 × 0.618 = 0.1545 kg per week, over +0,15.
    [
      "2026-08-15",
      "Stagniert, +0,15 kg pro Woche (≈ 160 kcal Überschuss pro Tag)",
    ],
    // The scatter 0.449 kg: the threshold 0.1123 kg per week, under +0,15.
    [
      "2026-08-23",
      "Nimmt zu, +0,15 kg pro Woche (≈ 160 kcal Überschuss pro Tag)",
    ],
    ["2026-08-02", "Stagniert, −0,02 kg pro Woche (≈ 20 kcal Defizit pro Tag)"],
  ])(
    "on %s sorts the pace by the threshold of the scatter of the day: %s",
    async (today, line) => {
      openHistoryOn(today);

      expect(await paceLine()).toBe(line);
    },
  );

  it("is not there without a pace", async () => {
    openOn("2026-10-17", steady("2026-10-17", 20, -0.5));

    await headline();
    expect(screen.queryByText(HEADING)).not.toBeInTheDocument();
    expect(screen.queryByText(CHARACTER)).not.toBeInTheDocument();
  });

  it("stands under the verdict and above the figures", async () => {
    openHistoryOn("2026-10-17");

    const inOrder = [
      await headline(),
      screen.getByText(HEADING),
      screen.getByText("Trend", { selector: "dt" }),
    ];
    for (const [earlier, later] of [inOrder.slice(0, 2), inOrder.slice(1)]) {
      expect(earlier.compareDocumentPosition(later)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    }
  });

  it("leaves the Ampel „4 Wochen: …“ off the page", async () => {
    openHistoryOn("2026-10-17");

    await headline();
    expect(screen.queryByText(/4 Wochen:/)).not.toBeInTheDocument();
  });
});

describe("„Langfristig“ in place of a verdict", () => {
  it("stands with the comparison after a gap", async () => {
    openHistoryOn("2026-10-03");

    expect(await headline()).toHaveTextContent(/^Nach 9 Tagen ohne Messung/);
    expect(await paceLine()).toBe(
      "Nimmt ab, −0,20 kg pro Woche (≈ 220 kcal Defizit pro Tag)",
    );
  });

  it("stands with „Letzte Messung vor N Tagen“", async () => {
    openHistoryOn("2026-10-21", "2026-10-17");

    expect(await headline()).toHaveTextContent("Letzte Messung vor 4 Tagen");
    expect(await paceLine()).toBe(
      "Nimmt ab, −0,42 kg pro Woche (≈ 460 kcal Defizit pro Tag)",
    );
  });

  it("stands with „Noch kein Urteil“ where the last day has a pace", async () => {
    // A trend from 5.9. on, none on 21.9. before the gap; 4.10. has one again.
    openOn("2026-10-04", [
      ...steady("2026-09-07", 7, 0, 99),
      at("2026-09-21T07:00:00+02:00", 98),
      ...steady("2026-10-04", 4, 0, 97),
    ]);

    expect(await headline()).toHaveTextContent("Noch kein Urteil");
    expect(await paceLine()).toBe(
      "Nimmt ab, −0,50 kg pro Woche (≈ 550 kcal Defizit pro Tag)",
    );
  });
});
