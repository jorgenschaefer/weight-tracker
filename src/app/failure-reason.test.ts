import { describe, expect, it } from "vitest";
import type { GoogleHealthError } from "@/measurement/google-health";
import { failureReason } from "./failure-reason";

describe("failureReason", () => {
  it.each<[GoogleHealthError, string]>([
    [
      { kind: "signInUnavailable" },
      "Die Anmeldung bei Google ist nicht geladen.",
    ],
    [{ kind: "signInFailed" }, "Die Anmeldung bei Google wurde abgebrochen."],
    [
      { kind: "accessNotGranted" },
      "Der Zugriff auf die Gewichtsmessungen wurde nicht erlaubt.",
    ],
    [
      { kind: "writeNotGranted" },
      "Das Speichern in Google Health wurde nicht erlaubt.",
    ],
    [{ kind: "tokenRejected" }, "Die Anmeldung ist abgelaufen."],
    [{ kind: "unreachable" }, "Google antwortet nicht."],
    [{ kind: "failed", status: 503 }, "Google meldet den Fehler 503."],
    [{ kind: "unexpectedResponse" }, "Google antwortet unerwartet."],
    [{ kind: "revokeFailed" }, "Google hat den Zugriff nicht widerrufen."],
  ])("explains %o: %s", (error, reason) => {
    expect(failureReason(error)).toBe(reason);
  });
});
