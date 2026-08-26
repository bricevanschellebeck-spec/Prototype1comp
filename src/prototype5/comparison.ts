import type { ApprovedLearningSpec, ComparisonGroup, ModelProfile, ReviewCandidate, ReviewKind, SourceAnalysisDraft, SourceCitation } from "./types";

function normalize(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function tokens(value: string) { return new Set(normalize(value).split(" ").filter((token) => token.length > 2)); }
function similarity(left: string, right: string) {
  const a = tokens(left); const b = tokens(right); if (!a.size || !b.size) return 0;
  const overlap = [...a].filter((token) => b.has(token)).length;
  return overlap / Math.max(a.size, b.size);
}
function citationKey(citations: SourceCitation[]) {
  return citations.map((citation) => citation.kind === "text" ? `t:${citation.sectionId}:${normalize(citation.quote)}` : `b:${citation.tableId}:${[...citation.rowIds].sort().join(",")}:${[...citation.columnIds].sort().join(",")}`).sort().join("|");
}
function candidate(profile: ModelProfile, modelId: string, kind: ReviewKind, item: Record<string, unknown>, label: string, citations: SourceCitation[] = []): ReviewCandidate {
  return { id: `${profile}:${kind}:${String(item.tempId ?? item.objectiveId ?? label)}`, model: profile, modelId, kind, label, citations, payload: item };
}
function flatten(draft: SourceAnalysisDraft, profile: ModelProfile): ReviewCandidate[] {
  const model = draft.modelId;
  return [
    ...draft.sourceDerived.concepts.map((item) => candidate(profile, model, "concept", item, item.name, item.citations)),
    ...draft.sourceDerived.facts.map((item) => candidate(profile, model, "fact", item, item.statement, item.citations)),
    ...draft.sourceDerived.relationships.map((item) => candidate(profile, model, "relationship", item, `${item.fromConceptId} ${item.type} ${item.toConceptId}`, item.citations)),
    ...draft.pedagogical.objectives.map((item) => candidate(profile, model, "objective", item, item.statement)),
    ...draft.pedagogical.proposedPrerequisites.map((item, index) => candidate(profile, model, "prerequisite", { ...item, tempId: `prerequisite-${index}` }, `${item.prerequisiteConceptId} before ${item.objectiveId}`)),
    ...draft.pedagogical.suggestedMisconceptions.map((item) => candidate(profile, model, "misconception", item, item.description)),
  ];
}

function isMatch(left: ReviewCandidate, right: ReviewCandidate) {
  if (left.kind !== right.kind) return false;
  const citationsMatch = left.citations.length > 0 && citationKey(left.citations) === citationKey(right.citations);
  if (left.kind === "relationship") {
    const a = left.payload as SourceAnalysisDraft["sourceDerived"]["relationships"][number];
    const b = right.payload as typeof a;
    return citationsMatch || (a.type === b.type && similarity(left.label, right.label) >= 0.5);
  }
  return citationsMatch || normalize(left.label) === normalize(right.label) || similarity(left.label, right.label) >= 0.72;
}

export function compareAnalysisDrafts(fast: SourceAnalysisDraft, quality: SourceAnalysisDraft): ComparisonGroup[] {
  const fastItems = flatten(fast, "fast"); const qualityItems = flatten(quality, "quality"); const used = new Set<string>(); const groups: ComparisonGroup[] = [];
  for (const left of fastItems) {
    const right = qualityItems.filter((item) => !used.has(item.id) && isMatch(left, item)).sort((a, b) => similarity(left.label, b.label) - similarity(left.label, a.label))[0];
    if (!right) { groups.push({ id: `group-${groups.length + 1}`, kind: left.kind, status: "fast-only", candidates: [left] }); continue; }
    used.add(right.id);
    const agreement = normalize(left.label) === normalize(right.label) || similarity(left.label, right.label) >= 0.72;
    groups.push({ id: `group-${groups.length + 1}`, kind: left.kind, status: agreement ? "agreement" : "conflict", candidates: [left, right] });
  }
  for (const right of qualityItems.filter((item) => !used.has(item.id))) groups.push({ id: `group-${groups.length + 1}`, kind: right.kind, status: "quality-only", candidates: [right] });
  return groups;
}

export function groupsFromSingleDraft(draft: SourceAnalysisDraft, profile: ModelProfile): ComparisonGroup[] {
  return flatten(draft, profile).map((item, index) => ({ id: `group-${index + 1}`, kind: item.kind, status: profile === "fast" ? "fast-only" : "quality-only", candidates: [item] }));
}

function slug(prefix: string, index: number) { return `${prefix}-${String(index + 1).padStart(2, "0")}`; }

export function buildApprovedSpec(sourceDocumentId: string, groups: ComparisonGroup[], selections: Record<string, string | "reject">): { spec?: ApprovedLearningSpec; errors: string[] } {
  const selected = groups.flatMap((group) => {
    const selectedId = selections[group.id];
    const item = selectedId && selectedId !== "reject" ? group.candidates.find((candidate) => candidate.id === selectedId) : undefined;
    return item ? [{ group, item }] : [];
  });
  const errors: string[] = [];
  const concepts = selected.filter(({ item }) => item.kind === "concept"); const facts = selected.filter(({ item }) => item.kind === "fact"); const objectives = selected.filter(({ item }) => item.kind === "objective");
  if (!concepts.length) errors.push("Approve at least one source concept.");
  if (!facts.length) errors.push("Approve at least one source fact.");
  if (!objectives.length) errors.push("Approve at least one learning objective.");
  if (errors.length) return { errors };

  const conceptAliases = new Map<string, string>(); const factAliases = new Map<string, string>(); const objectiveAliases = new Map<string, string>();
  const canonicalConcepts = concepts.map(({ group, item }, index) => {
    const id = slug("concept", index); group.candidates.forEach((entry) => conceptAliases.set(`${entry.model}:${String((entry.payload as { tempId: string }).tempId)}`, id));
    const payload = item.payload as SourceAnalysisDraft["sourceDerived"]["concepts"][number]; return { id, name: payload.name, citations: payload.citations };
  });
  const canonicalFacts = facts.map(({ group, item }, index) => {
    const id = slug("fact", index); group.candidates.forEach((entry) => factAliases.set(`${entry.model}:${String((entry.payload as { tempId: string }).tempId)}`, id));
    const payload = item.payload as SourceAnalysisDraft["sourceDerived"]["facts"][number]; return { id, statement: payload.statement, citations: payload.citations };
  });
  const canonicalObjectives = objectives.flatMap(({ group, item }, index) => {
    const payload = item.payload as SourceAnalysisDraft["pedagogical"]["objectives"][number]; const mapped = payload.supportingFactIds.map((id) => factAliases.get(`${item.model}:${id}`)).filter(Boolean) as string[];
    if (!mapped.length) { errors.push(`Approved objective “${item.label}” needs one of its supporting facts to be approved.`); return []; }
    const id = slug("objective", index); group.candidates.forEach((entry) => objectiveAliases.set(`${entry.model}:${String((entry.payload as { tempId: string }).tempId)}`, id));
    return [{ id, statement: payload.statement, supportingFactIds: [...new Set(mapped)] }];
  });
  if (!canonicalObjectives.length) return { errors: ["Approved objectives need at least one approved supporting fact from the same compared item group."] };

  const relationships = selected.filter(({ item }) => item.kind === "relationship").flatMap(({ item }, index) => {
    const payload = item.payload as SourceAnalysisDraft["sourceDerived"]["relationships"][number];
    const from = conceptAliases.get(`${item.model}:${payload.fromConceptId}`); const to = conceptAliases.get(`${item.model}:${payload.toConceptId}`); const supporting = payload.supportingFactIds.map((id) => factAliases.get(`${item.model}:${id}`)).filter(Boolean) as string[];
    if (!from || !to || !supporting.length) { errors.push(`Approved relationship “${item.label}” needs both endpoint concepts and a supporting fact to be approved.`); return []; }
    return [{ id: slug("relationship", index), fromConceptId: from, type: payload.type, toConceptId: to, supportingFactIds: [...new Set(supporting)], citations: payload.citations }];
  });
  const prerequisites = selected.filter(({ item }) => item.kind === "prerequisite").flatMap(({ item }) => {
    const payload = item.payload as SourceAnalysisDraft["pedagogical"]["proposedPrerequisites"][number]; const objectiveId = objectiveAliases.get(`${item.model}:${payload.objectiveId}`); const conceptId = conceptAliases.get(`${item.model}:${payload.prerequisiteConceptId}`);
    if (!objectiveId || !conceptId) { errors.push(`Approved prerequisite “${item.label}” needs its objective and concept to be approved.`); return []; }
    return [{ objectiveId, prerequisiteConceptId: conceptId, confidence: payload.confidence, rationale: payload.rationale }];
  });
  const misconceptions = selected.filter(({ item }) => item.kind === "misconception").flatMap(({ item }, index) => {
    const payload = item.payload as SourceAnalysisDraft["pedagogical"]["suggestedMisconceptions"][number]; const related = payload.relatedObjectiveIds.map((id) => objectiveAliases.get(`${item.model}:${id}`)).filter(Boolean) as string[];
    if (!related.length) { errors.push(`Approved misconception “${item.label}” needs its related objective to be approved.`); return []; }
    return [{ id: slug("misconception", index), description: payload.description, relatedObjectiveIds: [...new Set(related)] }];
  });
  if (errors.length) return { errors };
  return { errors: [], spec: {
    schemaVersion: "p5-approved-spec-1", sourceDocumentId, concepts: canonicalConcepts, facts: canonicalFacts, relationships,
    objectives: canonicalObjectives, prerequisites, misconceptions,
    approvalReceipt: selected.map(({ group, item }) => ({ comparisonGroupId: group.id, candidateId: item.id })),
  } };
}
