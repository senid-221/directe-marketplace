import type { Metadata } from "next";
import "./globals.css";
import "./mobile-polish.css";

export const metadata: Metadata = {
  title: "AkaziConnect — Rwanda Marketplace",
  description: "Connect with products, services and trusted sellers across Rwanda.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
