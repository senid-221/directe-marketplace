import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AkaziConnect — Rwanda Marketplace",
  description: "Connect with products, services and trusted sellers across Rwanda.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><header style={{padding:"12px 20px",borderBottom:"1px solid #eee",background:"#fff"}}><nav style={{maxWidth:1280,margin:"0 auto"}}><a href="/categories" style={{fontWeight:700}}>All Categories</a></nav></header>{children}</body>
    </html>
  );
}
