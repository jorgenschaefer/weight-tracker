import { ActionIcon, Button, Drawer, TextInput } from "@mantine/core";
import { useState } from "react";
import { parseEnteredKg } from "@/measurement/entered-measurement";
import classes from "./EntrySheet.module.css";
import type { SurfaceColours } from "./Verdict";

/**
 * The round button in the corner of the window, and the sheet it opens from
 * the bottom to enter today's weight.
 */
export function EntrySheet({ colours }: { colours: SurfaceColours }) {
  const [opened, setOpened] = useState(false);
  return (
    <>
      <ActionIcon
        className={classes.enter}
        aria-label="Gewicht eintragen"
        // Mantine sets the size and colours on the element itself, past the
        // class. The button is the surface turned around, as „Daten abrufen“.
        // page.module.css leaves room below the page for its 60 px.
        vars={() => ({
          root: {
            "--ai-size": "60px",
            "--ai-radius": "50%",
            "--ai-bg": colours.ink,
            "--ai-hover": colours.ink,
            "--ai-color": colours.surface,
          },
        })}
        onClick={() => setOpened(true)}
      >
        <Plus />
      </ActionIcon>
      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        position="bottom"
        // Only as tall as its content. Mantine's `size="auto"` would name a
        // variable `--drawer-size-auto` that Mantine never defines.
        vars={() => ({ root: { "--drawer-size": "auto" } })}
        overlayProps={{ color: "#20262c", backgroundOpacity: 0.35 }}
        title="Gewicht eintragen"
        closeButtonProps={{ "aria-label": "Schließen" }}
        classNames={{
          content: classes.sheet,
          header: classes.part,
          title: classes.title,
          body: classes.part,
        }}
      >
        <EntryForm colours={sheetColours(colours)} />
      </Drawer>
    </>
  );
}

/**
 * „Gewicht heute“ and „Eintragen“, which checks the weight and shows the hint
 * under the field for one it does not take.
 */
function EntryForm({ colours }: { colours: SurfaceColours }) {
  const [input, setInput] = useState("");
  const [refused, setRefused] = useState(false);
  return (
    <form
      className={classes.entry}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setRefused(parseEnteredKg(input) === null);
      }}
    >
      <TextInput
        className={classes.field}
        classNames={{
          label: classes.label,
          input: classes.input,
          section: classes.unit,
          error: classes.hint,
        }}
        label="Gewicht heute"
        placeholder="98,6"
        inputMode="decimal"
        autoComplete="off"
        rightSection="kg"
        data-autofocus
        value={input}
        onChange={(event) => setInput(event.currentTarget.value)}
        // Past Mantine's error state, which would turn the border and the
        // placeholder red: a red „98,6“ in an empty field reads as a refused
        // weight. The hint under the field says what is wrong.
        styles={{
          input: {
            "--input-bd": colours.ink,
            "--input-placeholder-color": "var(--mantine-color-placeholder)",
          },
        }}
        error={
          refused &&
          "Bitte ein Gewicht von 30 bis 250 kg eingeben, mit höchstens einer Nachkommastelle."
        }
      />
      <Button
        className={classes.submit}
        type="submit"
        vars={() => ({
          root: {
            "--button-bg": colours.ink,
            "--button-hover": colours.ink,
            "--button-color": colours.surface,
          },
        })}
      >
        Eintragen
      </Button>
    </form>
  );
}

/**
 * The colours of the page for the light sheet: its darker colour as the text
 * colour, which draws „Eintragen“ and the field's border, and its lighter one
 * as „Eintragen“'s text. The darkest levels write in a light colour on a dark
 * surface, which would not show on the sheet.
 */
function sheetColours(page: SurfaceColours): SurfaceColours {
  return lightness(page.ink) < lightness(page.surface)
    ? page
    : { surface: page.ink, ink: page.surface };
}

/** How light `hex`, a `#RRGGBB` colour, is: the sum of its channels. */
function lightness(hex: string): number {
  return [1, 3, 5]
    .map((start) => Number.parseInt(hex.slice(start, start + 2), 16))
    .reduce((sum, channel) => sum + channel);
}

function Plus() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}
