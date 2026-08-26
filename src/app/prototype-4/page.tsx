import type { Metadata } from "next";
import { PrototypeFourLab } from "@/src/prototype4/PrototypeFourLab";

export const metadata: Metadata = {
  title: "Prototype 4 · General Learning Recomposition",
  description: "One constrained learning composer operating across trusted physics and biology lessons.",
};

export default function PrototypeFourPage() {
  return <main><PrototypeFourLab /></main>;
}
