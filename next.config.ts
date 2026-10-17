import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Inlined into the page at build time. Read from a file of its own rather
  // than `.env`, which is local and kept out of git and the image; `next dev`,
  // `next build` and `next start` all run from the repository root.
  env: { NEXT_PUBLIC_GOOGLE_CLIENT_ID: googleClientId() },
  // The gateway's default `same-origin` cuts the page off from the Google
  // sign-in popup, so the token never arrives; the app sends its own.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

function googleClientId(): string {
  const file = "google-client-id.env";
  const id = parseEnv(readFileSync(file, "utf8")).NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!id) {
    throw new Error(
      `${file} does not set NEXT_PUBLIC_GOOGLE_CLIENT_ID - add the line NEXT_PUBLIC_GOOGLE_CLIENT_ID=<the OAuth client ID>`,
    );
  }
  return id;
}
