import type { ReactNode } from "react";

export const metadata = {
  title: "CityCatalyst Identity",
  description: "Sign in to CityCatalyst and the GCoM Data Service platform",
};

// Root layout. The login and consent pages will be added under this layout
// when the protocol code is extracted from CityCatalyst.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
