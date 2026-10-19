import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MantineProvider } from "@mantine/core";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { EntrySheet } from "./EntrySheet";
import classes from "./EntrySheet.module.css";
import { NEUTRAL, type SurfaceColours } from "./Verdict";

function renderSheet(colours = NEUTRAL) {
  render(
    <MantineProvider>
      <EntrySheet colours={colours} />
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

  it("stays 20 px from the bottom right corner of the window while the page scrolls", () => {
    renderSheet();

    expect(enterButton()).toHaveClass(classes.enter);
    const rule = cssRule("enter");
    expect(rule).toMatch(/position:\s*fixed/);
    expect(rule).toMatch(/right:\s*20px/);
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
async function openSheet(colours = NEUTRAL) {
  const user = renderSheet(colours);
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

/** Types `input` into the open sheet's field and clicks „Eintragen“. */
async function enter(input: string) {
  const user = await openSheet();
  if (input !== "") await user.type(field(), input);
  await user.click(screen.getByRole("button", { name: "Eintragen" }));
  return user;
}

describe("„Eintragen“", () => {
  it.each(["", "29,9", "98,65", "abc"])(
    "shows the hint under the field for %j, and keeps the sheet open",
    async (input) => {
      await enter(input);

      expect(field()).toHaveAccessibleDescription(HINT);
      expect(field()).toBeInvalid();
      expect(sheet()).toBeInTheDocument();
    },
  );

  it("keeps the placeholder in its own colour on an empty field, so it does not read as a refused weight", async () => {
    await enter("");

    expect(field().style.getPropertyValue("--input-placeholder-color")).toBe(
      "var(--mantine-color-placeholder)",
    );
  });

  it("shows no hint for a weight it takes, and keeps the sheet open", async () => {
    await enter("98,6");

    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
    expect(field()).toBeValid();
    expect(sheet()).toBeInTheDocument();
  });

  it("takes the hint away once the weight is right", async () => {
    const user = await enter("9");

    await user.type(field(), "8.6");
    await user.click(screen.getByRole("button", { name: "Eintragen" }));

    expect(screen.queryByText(HINT)).not.toBeInTheDocument();
  });

  it("checks on the Enter key as well", async () => {
    const user = await openSheet();

    await user.type(field(), "300{Enter}");

    expect(field()).toHaveAccessibleDescription(HINT);
  });
});

describe("the colours of the sheet", () => {
  const submitButton = async (colours: SurfaceColours) => {
    await openSheet(colours);
    return screen.getByRole("button", { name: "Eintragen" });
  };

  it("draws „Eintragen“ and the field's border in the surface's text colour, as the design does", async () => {
    const button = await submitButton({ surface: "#F5E1CB", ink: "#5A2C06" });

    expect(button.style.getPropertyValue("--button-bg")).toBe("#5A2C06");
    expect(button.style.getPropertyValue("--button-color")).toBe("#F5E1CB");
    expect(field().style.getPropertyValue("--input-bd")).toBe("#5A2C06");
  });

  it("draws them in the surface's colour where its text is the lighter one, so they stand out on the light sheet", async () => {
    const button = await submitButton({ surface: "#8A380A", ink: "#FFF3E8" });

    expect(button.style.getPropertyValue("--button-bg")).toBe("#8A380A");
    expect(button.style.getPropertyValue("--button-color")).toBe("#FFF3E8");
    expect(field().style.getPropertyValue("--input-bd")).toBe("#8A380A");
  });
});

describe("the sheet on a wide screen", () => {
  it("keeps its content as wide as the page's at most, 960 px, in the middle", async () => {
    await openSheet();

    for (const part of [
      screen.getByRole("heading", { name: "Gewicht eintragen" }).parentElement,
      field().closest("form")?.parentElement,
    ]) {
      expect(part).toHaveClass(classes.part);
    }
    expect(cssRule("part")).toMatch(/max-width:\s*960px/);
    expect(cssRule("part")).toMatch(/margin-inline:\s*auto/);
  });

  it("sets nothing wider than a 360 px screen, but the limit", () => {
    const lengths = [
      ...stylesheet
        .replace(/max-width:\s*960px/, "")
        .matchAll(/(\d+(?:\.\d+)?)px/g),
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
