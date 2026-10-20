// The hook is tested where the person uses it: on the page.
import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ENTERED_KEY,
  parseEnteredMeasurements,
  serializeEnteredMeasurements,
} from "@/measurement/entered-measurement";
import {
  enterMeasurement,
  fetchMeasurements,
} from "@/measurement/google-health";
import type { Measurement } from "@/measurement/measurement";
import {
  at,
  comeIntoView,
  ENTERED_SHOWN,
  enterWeight,
  FIRST_VISIT,
  failure,
  fetchButton,
  google,
  holdFetch,
  isNotShown,
  isShown,
  leavePage,
  logoutButton,
  NOT_YET_FETCHED,
  NOW,
  openAndClick,
  renderPage,
  standInForGoogle,
  storeMorning,
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

const ENTERED = at(NOW, 98.6);

const storeEntered = (entered: Measurement[]) =>
  localStorage.setItem(ENTERED_KEY, serializeEnteredMeasurements(entered));
const storedEntered = () =>
  parseEnteredMeasurements(localStorage.getItem(ENTERED_KEY));

/** Sets the clock `minutes` after {@link NOW}. */
const minutesLater = (minutes: number) =>
  vi.setSystemTime(NOW.getTime() + minutes * 60_000);

/** Google takes the weight, but leaves it out of fetches for now. */
const googleLags = () =>
  vi.mocked(enterMeasurement).mockResolvedValue({ ok: true, value: null });

describe("an entered weight", () => {
  it("stays on the page after a fetch that does not hold it yet, and shows once when one does", async () => {
    googleLags();
    const user = renderPage();
    await enterWeight(user);
    await waitFor(() => expect(fetchMeasurements).toHaveBeenCalledTimes(1));
    await isShown(ENTERED_SHOWN + NOT_YET_FETCHED);

    google.measurements = [at(new Date(NOW.getTime() + 30_000), 98.64)];
    vi.setSystemTime(NOW.getTime() + 10 * 60_000);
    await comeIntoView();

    await isShown(ENTERED_SHOWN);
    isNotShown(/noch nicht/);
  });

  it("stays on the page where only the fetch after it fails", async () => {
    vi.mocked(fetchMeasurements).mockResolvedValueOnce(
      failure({ kind: "unreachable" }),
    );
    const user = renderPage();

    await enterWeight(user);

    await isShown("Abruf fehlgeschlagen: Google antwortet nicht.");
    await isShown(ENTERED_SHOWN + NOT_YET_FETCHED);
  });

  it("is kept in this browser until a fetch holds it", async () => {
    const answer = holdFetch();
    const user = renderPage();
    await enterWeight(user);
    await waitFor(() => expect(storedEntered()).toEqual([ENTERED]));

    answer.resolve({ ok: true, value: [ENTERED] });

    await isShown(ENTERED_SHOWN);
    expect(localStorage.getItem(ENTERED_KEY)).toBeNull();
  });

  it("is on the page again after a reload, in the full view where nothing was fetched", async () => {
    storeEntered([ENTERED]);

    renderPage();

    await isShown(ENTERED_SHOWN + NOT_YET_FETCHED);
    await isShown("Ob du abnimmst, ist noch offen.");
    isNotShown(FIRST_VISIT);
    await fetchButton();
  });

  it("is on the page again after a reload, beside the cached measurements", async () => {
    storeMorning();
    storeEntered([ENTERED]);

    renderPage();

    await isShown(ENTERED_SHOWN + NOT_YET_FETCHED);
  });

  it.each<[string, number, number, Measurement[]]>([
    [
      "stays after a fetch starting just under an hour after it",
      59,
      59,
      [ENTERED],
    ],
    [
      "stays where the fetch started within the hour and ends after it",
      59,
      61,
      [ENTERED],
    ],
    ["is gone after a fetch starting an hour after it", 60, 60, []],
  ])(
    "that Google does not return %s",
    async (_, startsAfter, endsAfter, left) => {
      storeEntered([ENTERED]);
      minutesLater(startsAfter);
      const answer = holdFetch();
      await openAndClick(fetchButton);
      minutesLater(endsAfter);

      answer.resolve({ ok: true, value: [] });

      await waitFor(() => isNotShown(/wird aktualisiert/i));
      expect(storedEntered()).toEqual(left);
      if (left.length > 0) await isShown(ENTERED_SHOWN + NOT_YET_FETCHED);
      else isNotShown(/Letzte Messung 17.10./);
    },
  );

  it("stays in this browser where another tab entered it after this one opened, and this one fetches", async () => {
    const user = renderPage();
    await fetchButton();
    storeEntered([ENTERED]);

    await user.click(await fetchButton());

    await waitFor(() => isNotShown(/wird aktualisiert/i));
    expect(storedEntered()).toEqual([ENTERED]);
  });

  it("stays in this browser where another tab entered it after this one opened, and this one enters too", async () => {
    vi.mocked(fetchMeasurements).mockResolvedValue({ ok: true, value: [] });
    const user = renderPage();
    await fetchButton();
    const other = at(new Date(NOW.getTime() - 60_000), 98.2);
    storeEntered([other]);

    await enterWeight(user);

    await waitFor(() => expect(storedEntered()).toEqual([other, ENTERED]));
  });

  it("is discarded by „Abmelden“", async () => {
    vi.mocked(fetchMeasurements).mockResolvedValue({ ok: true, value: [] });
    const user = renderPage();
    await enterWeight(user);
    await isShown(ENTERED_SHOWN + NOT_YET_FETCHED);

    await user.click(await logoutButton());

    await isShown(FIRST_VISIT);
    isNotShown(/Letzte Messung/);
    expect(localStorage.getItem(ENTERED_KEY)).toBeNull();
    await waitFor(() => expect(google.grants).toEqual([]));
  });

  it("is discarded by „Abmelden“ after a reload too", async () => {
    storeEntered([ENTERED]);

    await openAndClick(logoutButton);

    await isShown(FIRST_VISIT);
    expect(localStorage.getItem(ENTERED_KEY)).toBeNull();
  });
});
