import type { MetadataRoute } from "next";
import { NEUTRAL } from "./Verdict";

/**
 * Makes the page installable on Android as the app „Gewicht“. Chrome offers
 * the installation itself; there is no service worker.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    // Android knows the installed app by these two: changed, the installed
    // app becomes a stranger's.
    id: "/",
    start_url: "/",
    name: "Gewicht",
    short_name: "Gewicht",
    description: "Gewichtstrend aus Google Health",
    lang: "de",
    display: "standalone",
    background_color: NEUTRAL.surface,
    theme_color: NEUTRAL.surface,
    // Made by bin/render-icons from src/app/app-icon.svg.
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
