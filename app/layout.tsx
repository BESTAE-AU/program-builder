import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unit Builder",
  description: "Plan teaching programs, units and Compass lesson plans, and export them to Word.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU">
      <body>{children}</body>
    </html>
  );
}
