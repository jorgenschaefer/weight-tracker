import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MantineProvider } from "@mantine/core";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type {
  GoogleHealthError,
  GoogleHealthResult,
} from "@/measurement/google-health";
import { deferred } from "@/test/open-page";
import { type EnterWeight, EntrySheet } from "./EntrySheet";
import classes from "./EntrySheet.module.css";
import sheetClasses from "./Sheet.module.css";
import { NEUTRAL, type SurfaceColours } from "./Verdict";

type Saved = GoogleHealthResult<null>;
const SAVED: Saved = { ok: true, value: null };

/**
 * Renders the sheet, saving with `onEnter`, after the Letzte Messung of
 * `latestKg`; by default every save succeeds and there is no measurement.
 */
function renderSheet(
  colours = NEUTRAL,
  onEnter: EnterWeight = async () => SAVED,
  latestKg: number | null = null,
) {
  render(
    <MantineProvider>
      <EntrySheet colours={colours} onEnter={onEnter} latestKg={latestKg} />
    </MantineProvider>,
  );
  return userEvent.setup();
}

const enterButton = () =>
  screen.getByRole("button", { name: "Gewicht eintragen" });

describe("the button to enter a weight", () => {
  it("is called „Gewicht eintragen“ for a screen reader", () => {
    renderSheet();

    expect(enterButton()).toBeInTheDocument();
  });

  it("stays 20 px above the bottom of the window and level with the content's right edge while the page scrolls", () => {
    renderSheet();

    expect(enterButton()).toHaveClass(classes.enter);
    const rule = cssRule("enter");
    expect(rule).toMatch(/position:\s*fixed/);
    // page.module.css: the content is at most 960 px wide, in the middle,
    // and at least 20 px from the window's edge.
    expect(rule).toMatch(
      /right:\s*max\(20px,\s*calc\(\(100% - 960px\) \/ 2\)\)/,
    );
    expect(rule).toMatch(/bottom:\s*20px/);
  });

  it("is a round button of 60 px in the surface's text colour, with its „+“ in the surface's colour", () => {
    renderSheet();

    const button = enterButton();
    expect(button.style.getPropertyValue("--ai-size")).toBe("60px");
    expect(button.style.getPropertyValue("--ai-radius")).toBe("50%");
    expect(button.style.getPropertyValue("--ai-bg")).toBe(NEUTRAL.ink);
    expect(button.style.getPropertyValue("--ai-color")).toBe(NEUTRAL.surface);
  });
});

/** Opens the page's sheet; returns the user to type and click with. */
async function openSheet(
  colours = NEUTRAL,
  onEnter?: EnterWeight,
  latestKg: number | null = null,
) {
  const user = renderSheet(colours, onEnter, latestKg);
  await user.click(enterButton());
  await screen.findByRole("dialog", { name: "Gewicht eintragen" });
  return user;
}

const sheet = () => screen.queryByRole("dialog", { name: "Gewicht eintragen" });
/** The darkened page around the sheet; Mantine names it in its class only. */
const overlay = () => {
  const element = document.querySelector(".mantine-Drawer-overlay");
  if (element === null) throw new Error("The sheet has no overlay around it.");
  return element;
};
const field = () => screen.getByRole("textbox", { name: "Gewicht heute" });

describe("the sheet", () => {
  it("opens on the button, with „Gewicht heute“, „Eintragen“ and an X", async () => {
    await openSheet();

    expect(sheet()).toBeInTheDocument();
    expect(field()).toBeInTheDocument();
    expect(screen.getByText("kg")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Eintragen" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Schließen" }),
    ).toBeInTheDocument();
  });

  it("puts the focus in the field, and asks the phone for its number keyboard", async () => {
    await openSheet();

    expect(field()).toHaveFocus();
    expect(field()).toHaveAttribute("inputmode", "decimal");
  });

  it("suggests the Letzte Messung in the empty field", async () => {
    await openSheet(NEUTRAL, undefined, 97.4);

    expect(field()).toHaveValue("");
    expect(field()).toHaveAttribute("placeholder", "97,4");
  });

  it("suggests 68,9 in the empty field without any measurement", async () => {
    await openSheet();

    expect(field()).toHaveAttribute("placeholder", "68,9");
  });

  it("is only as tall as its content, so the page shows above it", async () => {
    await openSheet();

    // Mantine sizes a bottom drawer by this variable, as its height and its
    // flex basis; jsdom lays nothing out, so the variable is read instead.
    expect(
      document
        .querySelector<HTMLElement>(".mantine-Drawer-root")
        ?.style.getPropertyValue("--drawer-size"),
    ).toBe("auto");
  });
});

describe("closing the sheet", () => {
  it("closes on the X", async () => {
    const user = await openSheet();

    await user.click(screen.getByRole("button", { name: "Schließen" }));

    await waitFor(() => expect(sheet()).not.toBeInTheDocument());
  });

  it("closes on Escape", async () => {
    const user = await openSheet();

    await user.keyboard("{Escape}");

    await waitFor(() => expect(sheet()).not.toBeInTheDocument());
  });

  it("closes on a tap beside the sheet", async () => {
    const user = await openSheet();

    await user.click(overlay());

    await waitFor(() => expect(sheet()).not.toBeInTheDocument());
  });

  it("opens again with an empty field", async () => {
    const user = await openSheet();
    await user.type(field(), "98,6");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(sheet()).not.toBeInTheDocument());

    await user.click(enterButton());

    expect(
      await screen.findByRole("textbox", { name: "Gewicht heute" }),
    ).toHaveValue("");
  });
});

const HINT =
  "Bitte ein Gewicht von 30 bis 250 kg eingeben, mit höchstens einer Nachkommastelle.";

const submitButton = () =>
  screen.getByRole("button", { name: /Eintragen|Wird gespeichert/ });

/**
 * Types `input` into the open sheet's field and clicks „Eintragen“, saving
 * with `onEnter`.
 */
async function enter(input: string, onEnter?: EnterWeight) {
  const user = await openSheet(NEUTRAL, onEnter);
  if (input !== "") await user.type(field(), input);
  await user.click(submitButton());
  return user;
}

describe("„Eintragen“", () => {
  it.each(["", "29,9", "98,65", "abc"])(
    "shows the hint under the field for %j, keeps the sheet open and saves nothing",
    async (input) => {
      const onEnter = vi.fn(async (_kg: number) => SAVED);
      await enter(input, onEnter);

      expect(field()).toHaveAccessibleDescription(HINT);
      expect(field()).toBeInvalid();
      expect(sheet()).toBeInTheDocument();
      expect(onEnter).not.toHaveBeenCalled();
    },
  );

  it("keeps the placeholder in its own colour on an empty field, so it does not read as a refused weight", async () => {
    await enter("");

    expect(field().style.getPropertyValue("--input-placeholder-color")).toBe(
      "var(--mantine-color-placeholder)",
    );
  });

  it("saves a weight it takes, and closes the sheet once it is saved", async () => {
    const onEnter = vi.fn(async (_kg: number) => SAVED);
    await enter("98,6", onEnter);

    expect(onEnter.mock.calls).toEqual([[98.6]]);
    await waitFor(() => expect(sheet()).not.toBeInTheDocument());
  });

  it("takes the hint away once the weight is right", async () => {
    const answer = deferred<Saved>();
    const user = await enter("9", async () => answer.promise);

    await user.type(field(), "8.6");
    await user.click(submitButton());

    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
    expect(field()).toBeValid();
  });

  it("checks on the Enter key as well", async () => {
    const user = await openSheet();

    await user.type(field(), "300{Enter}");

    expect(field()).toHaveAccessibleDescription(HINT);
  });
});

/** Longer than the sheet takes to slide away, 200 ms by Mantine's default. */
const SLID_AWAY_MS = 500;

describe("saving", () => {
  /** Enters 98,6 with a save that has not yet been answered. */
  async function enterWhileSaving() {
    const answer = deferred<Saved>();
    // Saves after the first are never answered.
    const onEnter = vi
      .fn((_kg: number) => new Promise<Saved>(() => {}))
      .mockReturnValueOnce(answer.promise);
    const user = await enter("98,6", onEnter);
    return { user, onEnter, answer };
  }

  it("shows „Wird gespeichert …“ on the button, which takes no further tap, and saves once", async () => {
    const { user, onEnter } = await enterWhileSaving();

    expect(submitButton()).toHaveTextContent("Wird gespeichert …");
    expect(submitButton()).toBeDisabled();
    await user.click(submitButton());
    await user.type(field(), "{Enter}");

    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  it("keeps the button in its colours while saving, past Mantine's grey for a disabled one", () => {
    const rule = cssRule("submit:disabled");

    expect(rule).toMatch(/background(-color)?:\s*var\(--button-bg\)/);
    expect(rule).toMatch(/color:\s*var\(--button-color\)/);
  });

  it("does not close on the X, Escape or a tap beside the sheet", async () => {
    const { user } = await enterWhileSaving();

    await user.click(screen.getByRole("button", { name: "Schließen" }));
    await user.keyboard("{Escape}");
    await user.click(overlay());

    // Closing would leave the sheet in place until it has slid away.
    await new Promise((done) => setTimeout(done, SLID_AWAY_MS));
    expect(sheet()).toBeInTheDocument();
  });

  it.each<[GoogleHealthError, string]>([
    [{ kind: "unreachable" }, "Google antwortet nicht."],
    [
      { kind: "writeNotGranted" },
      "Das Speichern in Google Health wurde nicht erlaubt.",
    ],
  ])(
    "keeps the sheet open with the weight where saving fails with %o, and says why",
    async (error, reason) => {
      const { answer } = await enterWhileSaving();

      answer.resolve({ ok: false, error });

      expect(await screen.findByRole("alert")).toHaveTextContent(
        `Speichern fehlgeschlagen: ${reason}`,
      );
      expect(field()).toHaveValue("98,6");
      expect(submitButton()).toHaveTextContent("Eintragen");
      expect(submitButton()).toBeEnabled();
      expect(sheet()).toBeInTheDocument();
    },
  );

  it("saves again on the next tap after a failure, and takes the failure away", async () => {
    const { user, onEnter, answer } = await enterWhileSaving();
    answer.resolve({ ok: false, error: { kind: "unreachable" } });
    await screen.findByRole("alert");

    await user.click(submitButton());

    expect(onEnter).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("the colours of the sheet", () => {
  const coloured = async (colours: SurfaceColours) => {
    await openSheet(colours);
    return submitButton();
  };

  it("draws „Eintragen“ and the field's border in the surface's text colour, as the design does", async () => {
    const button = await coloured({ surface: "#F5E1CB", ink: "#5A2C06" });

    expect(button.style.getPropertyValue("--button-bg")).toBe("#5A2C06");
    expect(button.style.getPropertyValue("--button-color")).toBe("#F5E1CB");
    expect(field().style.getPropertyValue("--input-bd")).toBe("#5A2C06");
  });

  it("draws them in the surface's colour where its text is the lighter one, so they stand out on the light sheet", async () => {
    const button = await coloured({ surface: "#8A380A", ink: "#FFF3E8" });

    expect(button.style.getPropertyValue("--button-bg")).toBe("#8A380A");
    expect(button.style.getPropertyValue("--button-color")).toBe("#FFF3E8");
    expect(field().style.getPropertyValue("--input-bd")).toBe("#8A380A");
  });
});

describe("the sheet's look", () => {
  it("is the light sheet, its content as wide as the page's at most", async () => {
    await openSheet();

    expect(sheet()).toHaveClass(sheetClasses.sheet);
    expect(
      screen.getByRole("heading", { name: "Gewicht eintragen" }).parentElement,
    ).toHaveClass(sheetClasses.part);
    expect(field().closest("form")?.parentElement).toHaveClass(
      sheetClasses.part,
    );
  });
});

describe("the stylesheet", () => {
  it("sets nothing wider than a 360 px screen, but the content's width", () => {
    const lengths = [
      ...stylesheet.replaceAll("960px", "").matchAll(/(\d+(?:\.\d+)?)px/g),
    ].map((match) => Number(match[1]));

    expect(lengths.filter((px) => px > 360)).toEqual([]);
  });
});

// jsdom lays nothing out, so the stylesheet is read instead.
const stylesheet = readFileSync(
  join(import.meta.dirname, "EntrySheet.module.css"),
  "utf8",
);

/** The declarations of the stylesheet's rule for `.name`. */
const cssRule = (name: string) =>
  new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`).exec(stylesheet)?.[1];
