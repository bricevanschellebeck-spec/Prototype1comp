import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Circuit Composer Lab",
  description:
    "A constrained AI lesson composer using trusted interactive learning blocks.",
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
