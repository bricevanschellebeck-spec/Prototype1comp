import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Curiosity Lab · Project Hub",
  description: "The living source of truth for the Curiosity Lab learning environment.",
};

export default function HubLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
