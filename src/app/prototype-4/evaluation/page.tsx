import type { Metadata } from "next";
import { EvaluationLab } from "@/src/prototype4/EvaluationLab";

export const metadata: Metadata = { title: "Prototype 4 · Composer Evaluation" };
export default function PrototypeFourEvaluationPage() { return <main><EvaluationLab /></main>; }
