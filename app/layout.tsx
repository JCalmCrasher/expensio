import type { Metadata } from "next";
// Self-hosted via @fontsource — no network request at build time, works offline
import "@fontsource/source-code-pro/400.css";
import "@fontsource/source-code-pro/500.css";
import "@fontsource/source-code-pro/600.css";
import "@fontsource/source-code-pro/700.css";
import "@fontsource/source-code-pro/800.css";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "Expensio",
  description:
    "Local-first personal expense tracker. Add expenses in seconds, track payments, roll over unpaid items.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
