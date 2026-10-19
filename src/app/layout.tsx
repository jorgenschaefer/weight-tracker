import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "@mantine/core/styles.css";
import {
  ColorSchemeScript,
  createTheme,
  MantineProvider,
  mantineHtmlProps,
} from "@mantine/core";

export const metadata: Metadata = {
  title: "Gewicht",
  description: "Gewichtstrend aus Google Health",
  robots: { index: false, follow: false },
};

// Chrome on Android lays the page out above the keyboard instead of behind
// it, so the bottom sheet's field and „Eintragen“ stay in sight while typing.
export const viewport: Viewport = { interactiveWidget: "resizes-content" };

// Downloaded at build time and served with the app, so the browser never
// asks Google Fonts. Variable in weight and width.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"] });

const theme = createTheme({ fontFamily: archivo.style.fontFamily });

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={archivo.className} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="light">
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
