import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Sheet } from "./Sheet";
import classes from "./Sheet.module.css";

function renderSheet() {
  render(
    <MantineProvider>
      <Sheet title="Google Health" opened onClose={() => {}}>
        <p>Inhalt</p>
      </Sheet>
    </MantineProvider>,
  );
}

describe("the sheet on a wide screen", () => {
  it("keeps its content as wide as the page's at most, 960 px, in the middle", async () => {
    renderSheet();

    await screen.findByRole("dialog", { name: "Google Health" });
    for (const part of [
      screen.getByRole("heading", { name: "Google Health" }).parentElement,
      screen.getByText("Inhalt").parentElement,
    ]) {
      expect(part).toHaveClass(classes.part);
    }
    expect(cssRule("part")).toMatch(/max-width:\s*960px/);
    expect(cssRule("part")).toMatch(/margin-inline:\s*auto/);
  });

  it("sets nothing wider than a 360 px screen, but the content's width", () => {
    const lengths = [
      ...stylesheet.replaceAll("960px", "").matchAll(/(\d+(?:\.\d+)?)px/g),
    ].map((match) => Number(match[1]));

    expect(lengths.filter((px) => px > 360)).toEqual([]);
  });
});

// jsdom lays nothing out, so the stylesheet is read instead.
const stylesheet = readFileSync(
  join(import.meta.dirname, "Sheet.module.css"),
  "utf8",
);

/** The declarations of the stylesheet's rule for `.name`. */
const cssRule = (name: string) =>
  new RegExp(`\\.${name}\\s*\\{([^}]*)\\}`).exec(stylesheet)?.[1];
