// The card is tested where the person sees it: on the page, opened with the
// measurements in its cache on the day under test.
import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Measurement } from "@/measurement/measurement";
import {
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

const ABOVE = "Hoffentlich ein Ausreißer – gestern viel gegessen? Vorsicht!";
const BELOW = "Vielleicht ein Ausreißer, vielleicht die Wende. Weiter so!";

const headline = () => screen.findByRole("heading", { level: 1 });
const card = () => screen.queryByText(/ kg (über|unter) dem Trend$/);

describe("the card of the morning", () => {
  it("says how far over the trend a measurement beyond the threshold lies, rounded to one decimal", async () => {
    // 99.7 kg on a trend of 97.1 kg; the threshold 1.25 × 0.58 kg.
    openHistoryOn("2026-10-12");

    expect(
      await screen.findByText("Heute · 2,6 kg über dem Trend"),
    ).toBeInTheDocument();
    expect(screen.getByText(ABOVE)).toBeInTheDocument();
  });

  it("says how far under the trend a measurement beyond the threshold lies", async () => {
    // 98.8 kg on a trend of 99.82 kg; the threshold 1.25 × 0.69 kg.
    openHistoryOn("2026-09-15");

    expect(
      await screen.findByText("Heute · 1,0 kg unter dem Trend"),
    ).toBeInTheDocument();
    expect(screen.getByText(BELOW)).toBeInTheDocument();
  });

  it("is not there for a measurement within the threshold", async () => {
    // 0.97 kg over a trend of 97.33 kg; the threshold 1.25 × 0.81 kg.
    openHistoryOn("2026-10-16");

    await headline();
    expect(card()).not.toBeInTheDocument();
    expect(screen.queryByText(ABOVE)).not.toBeInTheDocument();
  });

  it.each([
    ["2026-10-13", "Gestern"],
    ["2026-10-14", "Am 12.10."],
    ["2026-10-15", "Am 12.10."],
  ])(
    "on %s names the day of a measurement not from today: %s",
    async (today, day) => {
      openHistoryOn(today, "2026-10-12");

      expect(
        await screen.findByText(`${day} · 2,6 kg über dem Trend`),
      ).toBeInTheDocument();
    },
  );

  it("stands under the headline, before „Langfristig“", async () => {
    openHistoryOn("2026-10-12");

    const shown = await screen.findByText("Heute · 2,6 kg über dem Trend");
    expect(
      (await headline()).compareDocumentPosition(shown) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      shown.compareDocumentPosition(
        screen.getByText("Langfristig · 4 Wochen"),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("is in the inverted colours of the surface", async () => {
    openHistoryOn("2026-10-12");

    const shown = await screen.findByText("Heute · 2,6 kg über dem Trend");
    const main = screen.getByRole("main");
    expect(shown.parentElement).toHaveStyle({
      backgroundColor: main.style.color,
      color: main.style.backgroundColor,
    });
  });
});

describe("no card", () => {
  /** 3 kg over a trend that a gap separates from the trend before it. */
  const overTheTrendAfterAGap: Measurement[] = [
    ...steady("2026-09-22", 20, 0, 95),
    { time: new Date("2026-10-01T07:00:00+02:00"), kg: 98 },
  ];

  it("with the comparison after a gap", async () => {
    openOn("2026-10-01", overTheTrendAfterAGap);

    expect(await headline()).toHaveTextContent(/^Nach 9 Tagen ohne Messung/);
    expect(card()).not.toBeInTheDocument();
  });

  it("with „Letzte Messung vor N Tagen“", async () => {
    openHistoryOn("2026-10-16", "2026-10-12");

    expect(await headline()).toHaveTextContent("Letzte Messung vor 4 Tagen");
    expect(card()).not.toBeInTheDocument();
  });

  it("with „Noch kein Urteil“", async () => {
    // A trend on 1.10., 3 kg under it, but none on 22.9. before the gap.
    openOn("2026-10-01", [
      ...steady("2026-09-22", 4, 0, 95),
      { time: new Date("2026-10-01T07:00:00+02:00"), kg: 92 },
    ]);

    expect(await headline()).toHaveTextContent("Noch kein Urteil");
    expect(card()).not.toBeInTheDocument();
  });
});
