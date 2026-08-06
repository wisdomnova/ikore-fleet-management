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
    <html lang="en" className="light" style={{ colorScheme: "light" }}>
      <head>
        <meta name="color-scheme" content="light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@8..144,100..1000&display=swap" rel="stylesheet" />
      </head>
      <body className="light" style={{ colorScheme: "light" }}>{children}</body>
    </html>
  );
}
