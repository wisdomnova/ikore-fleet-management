import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TracTrac & Ikore — Fleet Manager",
  description: "Shared motorpool fleet management system for TracTrac and Ikore.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
