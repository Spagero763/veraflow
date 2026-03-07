import type { Metadata } from "next";
import "./globals.css";
import BgCanvas from "@/components/BgCanvas";
import CustomCursor from "@/components/CustomCursor";

export const metadata: Metadata = {
  title: "VeraFlow — Issuer Dashboard",
  description: "On-chain professional identity and credit for skilled workers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&f[]=cabinet-grotesk@400,500,700,800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <CustomCursor />
        <BgCanvas />
        {children}
      </body>
    </html>
  );
}
