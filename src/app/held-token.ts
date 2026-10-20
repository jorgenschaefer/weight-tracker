import { parseTime } from "@/measurement/cache";
import type {
  AccessToken,
  GoogleHealthResult,
  SignedIn,
} from "@/measurement/google-health";
import { isRecord, parseJson } from "@/measurement/json";

/**
 * The `localStorage` key of the token the page holds. The format's version is
 * part of the key, so an entry of another version is never read as this one.
 */
export const TOKEN_KEY = "gewicht:token:v1";

/**
 * The access token the page holds, when Google stops accepting it, and
 * whether it may enter measurements.
 */
export interface HeldToken {
  token: AccessToken;
  expiresAt: Date;
  writeGranted: boolean;
}

/** The token of a sign-in at `now`, held from then on. */
export function held(
  signedIn: GoogleHealthResult<SignedIn>,
  now: Date,
): GoogleHealthResult<HeldToken> {
  if (!signedIn.ok) return signedIn;
  const { token, expiresInSeconds, writeGranted } = signedIn.value;
  return {
    ok: true,
    value: {
      token,
      expiresAt: new Date(now.getTime() + expiresInSeconds * 1000),
      writeGranted,
    },
  };
}

/** Whether `token` is held, not expired at `now` and may enter measurements. */
export function maySave(
  token: HeldToken | null,
  now: Date,
): token is HeldToken {
  return token?.writeGranted === true && !hasExpired(token, now);
}

/** Whether Google no longer accepts `token` at `now`. */
export function hasExpired(token: HeldToken, now: Date): boolean {
  return now >= token.expiresAt;
}

/** The stored form of `token`, as kept under {@link TOKEN_KEY}. */
export function serializeHeldToken(token: HeldToken): string {
  return JSON.stringify({
    token: token.token,
    expiresAt: token.expiresAt.toISOString(),
    writeGranted: token.writeGranted,
  });
}

/**
 * The token stored as `stored`, or `null` where there is no valid one: the
 * entry is missing or not the stored form of a token.
 */
export function parseHeldToken(stored: string | null): HeldToken | null {
  if (stored === null) return null;
  const entry = parseJson(stored);
  if (!isRecord(entry)) return null;
  const { token, writeGranted } = entry;
  const expiresAt = parseTime(entry.expiresAt);
  if (
    typeof token !== "string" ||
    token === "" ||
    typeof writeGranted !== "boolean" ||
    expiresAt === null
  ) {
    return null;
  }
  return { token, expiresAt, writeGranted };
}
