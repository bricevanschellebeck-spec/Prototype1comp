import type { Metadata } from "next";
import { PrototypeTwoLab } from "@/src/prototype2/PrototypeTwoLab";

export const metadata: Metadata = {
  title: "Prototype 2 · Adaptive Circuit Path",
  description:
    "A browser-only demonstration of learner evidence selecting the next trusted circuit-learning block.",
};

export default function PrototypeTwoPage() {
  return (
    <main>
      <PrototypeTwoLab />
    </main>
  );
}
