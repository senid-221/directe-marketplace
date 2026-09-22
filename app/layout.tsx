import type { Metadata } from "next";
import "./globals.css";
import "./mobile-polish.css";

export const metadata: Metadata = {
  title: "AkaziConnect — Rwanda Marketplace",
  description: "Rwanda-first marketplace connecting customers with trusted sellers and products.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
