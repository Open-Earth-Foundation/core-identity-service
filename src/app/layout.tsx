import type { ReactNode } from "react";
import "@oef/gds-tokens/css";
import "@oef/gds-react/styles.css";
import "./globals.css";

export const metadata = {
  title: "OpenEarth Identity",
  description: "Sign in to OpenEarth apps and the GCoM Data Service platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
