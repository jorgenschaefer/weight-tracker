import { ActionIcon, Button, Text, TextInput } from "@mantine/core";
import { useState } from "react";
import { parseEnteredKg } from "@/measurement/entered-measurement";
import type { GoogleHealthResult } from "@/measurement/google-health";
import classes from "./EntrySheet.module.css";
import { failureReason } from "./failure-reason";
import { formatKg } from "./format";
import { Sheet } from "./Sheet";
import type { SurfaceColours } from "./Verdict";

/** Enters a weight in kg; the sheet calls it straight from the tap. */
export type EnterWeight = (kg: number) => Promise<GoogleHealthResult<null>>;

/**
 * The round button in the corner of the window, and the sheet it opens from
 * the bottom to enter today's weight with `onEnter`; while that is `null`,
 * the sheet waits to open until it is not. The empty field suggests
 * `latestKg`, the Letzte Messung, where there is one. The sheet closes once
 * the weight is saved, and not while it is being saved.
 */
export function EntrySheet({
  colours,
  onEnter,
  latestKg,
}: {
  colours: SurfaceColours;
  onEnter: EnterWeight | null;
  latestKg: number | null;
}) {
  const [opened, setOpened] = useState(false);
  const [saving, setSaving] = useState(false);

  // onEnter runs before the first await, so a sign-in it starts still counts
  // as opened by the tap.
  async function save(kg: number, enter: EnterWeight) {
    setSaving(true);
    const saved = await enter(kg);
    setSaving(false);
    if (saved.ok) setOpened(false);
    return saved;
  }

  return (
    <>
      <ActionIcon
        className={classes.enter}
        aria-label="Gewicht eintragen"
        // Mantine sets the size and colours on the element itself, past the
        // class. The button is the surface turned around.
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
      {onEnter !== null && (
        <Sheet
          title="Gewicht eintragen"
          opened={opened}
          onClose={() => {
            if (!saving) setOpened(false);
          }}
        >
          <EntryForm
            colours={sheetColours(colours)}
            suggestion={latestKg === null ? "68,9" : formatKg(latestKg)}
            saving={saving}
            onSave={(kg) => save(kg, onEnter)}
          />
        </Sheet>
      )}
    </>
  );
}

/**
 * „Gewicht heute“, empty with `suggestion` in grey, and „Eintragen“, which
 * checks the weight and saves it with `onSave`: the hint under the field for
 * a weight it does not take, the failure under the form for one it could not
 * save.
 */
function EntryForm({
  colours,
  suggestion,
  saving,
  onSave,
}: {
  colours: SurfaceColours;
  suggestion: string;
  saving: boolean;
  onSave: EnterWeight;
}) {
  const [input, setInput] = useState("");
  const [refused, setRefused] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function submit() {
    const kg = parseEnteredKg(input);
    setRefused(kg === null);
    setFailure(null);
    if (kg === null) return;
    const saved = await onSave(kg);
    if (!saved.ok) setFailure(failureReason(saved.error));
  }

  return (
    <>
      <form
        className={classes.entry}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
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
          placeholder={suggestion}
          inputMode="decimal"
          autoComplete="off"
          rightSection="kg"
          data-autofocus
          value={input}
          onChange={(event) => setInput(event.currentTarget.value)}
          // Past Mantine's error state, which would turn the border and the
          // placeholder red: a red suggestion in an empty field reads as a
          // refused weight. The hint under the field says what is wrong.
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
          disabled={saving}
          vars={() => ({
            root: {
              "--button-bg": colours.ink,
              "--button-hover": colours.ink,
              "--button-color": colours.surface,
            },
          })}
        >
          {saving ? "Wird gespeichert …" : "Eintragen"}
        </Button>
      </form>
      {failure !== null && (
        <Text className={classes.failure} role="alert">
          {`Speichern fehlgeschlagen: ${failure}`}
        </Text>
      )}
    </>
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
