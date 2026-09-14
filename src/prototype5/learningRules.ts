import type { BlockOutcome, CompiledBlock, CompiledLessonManifest, SourceDocument } from "./types";

export function reservedRows(manifest: CompiledLessonManifest, tableId: string) {
  return new Set(manifest.blocks.flatMap((block) => block.render.kind === "target-challenge" && block.render.tableId === tableId ? [block.render.heldOutRowId] : []));
}
export function explorationRows(source: SourceDocument, manifest: CompiledLessonManifest, tableId: string) {
  const reserved = reservedRows(manifest, tableId);
  return source.tables.find((table) => table.id === tableId)?.rows.filter((row) => !reserved.has(row.id)) ?? [];
}
export function predictionModel(manifest: CompiledLessonManifest, block: CompiledBlock) {
  const id = block.render.kind === "prediction" ? block.render.relationshipId : undefined;
  const relation = manifest.relationships.find((item) => item.id === id);
  if (!relation || !["increases", "decreases"].includes(relation.type)) return null;
  const from = manifest.concepts.find((item) => item.id === relation.fromConceptId)?.name;
  const to = manifest.concepts.find((item) => item.id === relation.toConceptId)?.name;
  return from && to ? { question: `As ${from.toLowerCase()} increases, what happens to ${to.toLowerCase()}?`, explanation: `${to} ${relation.type} as ${from.toLowerCase()} increases.`, correct: relation.type } : null;
}
export function validateEvidence(manifest: CompiledLessonManifest, evidence: BlockOutcome[]) {
  const seen = new Set<string>(); const errors: string[] = [];
  for (const outcome of evidence) {
    const block = manifest.blocks.find((item) => item.id === outcome.blockId);
    if (!block) { errors.push(`Unknown evidence block ${outcome.blockId}.`); continue; }
    if (seen.has(outcome.blockId)) errors.push(`Duplicate evidence for ${outcome.blockId}.`);
    seen.add(outcome.blockId);
    if (outcome.misconceptionIds.some((id) => !block.possibleMisconceptionIds.includes(id))) errors.push("Evidence references an unregistered misconception.");
    if (outcome.result !== "incorrect" && outcome.misconceptionIds.length) errors.push("Only incorrect evidence can introduce a misconception.");
    const assessed = ["prediction", "target-challenge", "step-sequence"].includes(block.primitiveId);
    if (assessed === (outcome.result === "completed")) errors.push(`Invalid result type for ${block.primitiveId}.`);
  }
  return errors;
}

export function supportNeeded(evidence: BlockOutcome[]) {
  const latest = evidence.at(-1);
  return !!latest && (latest.result === "incorrect" || latest.hintUsed || latest.attempts > 1);
}

export function supportBlock(block: CompiledBlock) {
  return block.role === "support" || block.primitiveId === "comparison" || block.primitiveId === "evidence-reveal" || block.primitiveId === "parameter-experiment";
}
