import type { Metadata } from "next";
import { PrototypeThreeLab } from "@/src/prototype3/PrototypeThreeLab";

export const metadata: Metadata = {
  title: "Prototype 3 · Constrained AI Composer",
  description:
    "A local-AI demonstration that composes a trusted circuits lesson from registered interactive learning blocks.",
};

export default function PrototypeThreePage() {
  return (
    <main>
      <PrototypeThreeLab />
    </main>
  );
}
