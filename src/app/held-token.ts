import type {
  AccessToken,
  GoogleHealthResult,
  SignedIn,
} from "@/measurement/google-health";

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
