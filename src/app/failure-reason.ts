import type { GoogleHealthError } from "@/measurement/google-health";

/** Why talking to Google failed, as the page tells it after „… fehlgeschlagen:“. */
export function failureReason(error: GoogleHealthError): string {
  switch (error.kind) {
    case "signInUnavailable":
      return "Die Anmeldung bei Google ist nicht geladen.";
    case "signInFailed":
      return "Die Anmeldung bei Google wurde abgebrochen.";
    case "accessNotGranted":
      return "Der Zugriff auf die Gewichtsmessungen wurde nicht erlaubt.";
    case "writeNotGranted":
      return "Das Speichern in Google Health wurde nicht erlaubt.";
    case "tokenRejected":
      return "Die Anmeldung ist abgelaufen.";
    case "unreachable":
      return "Google antwortet nicht.";
    case "failed":
      return `Google meldet den Fehler ${error.status}.`;
    case "unexpectedResponse":
      return "Google antwortet unerwartet.";
    case "revokeFailed":
      return "Google hat den Zugriff nicht widerrufen.";
  }
}
