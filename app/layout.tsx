import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DIRECTE — Rwanda Marketplace",
  description: "Shop products from trusted sellers across Rwanda.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
