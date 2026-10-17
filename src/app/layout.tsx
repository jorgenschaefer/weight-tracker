import type { Metadata } from "next";
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
