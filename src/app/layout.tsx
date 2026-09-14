import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Curiosity Lab · Project Hub",
    template: "%s · Curiosity Lab",
  },
  description:
    "The source of truth for Curiosity Lab's core course and learning builder.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
