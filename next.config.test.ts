import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

describe("next.config", () => {
  it("builds the app with the public Google OAuth client ID from google-client-id.env", () => {
    expect(nextConfig.env?.NEXT_PUBLIC_GOOGLE_CLIENT_ID).toBe(
      "828353772168-3lujju230hd46nvq86hrjb5sqpjh0jtc.apps.googleusercontent.com",
    );
  });

  it("lets the Google sign-in popup report back to every page", async () => {
    const headers = (await nextConfig.headers?.()) ?? [];

    expect(headers).toEqual([
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ]);
  });
});
