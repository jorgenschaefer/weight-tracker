import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Page from "./page";

describe("the start page", () => {
  it("names the app", () => {
    render(
      <MantineProvider>
        <Page />
      </MantineProvider>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Gewicht" }),
    ).toBeInTheDocument();
  });
});
