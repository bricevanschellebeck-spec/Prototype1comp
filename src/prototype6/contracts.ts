import { z } from "zod";
import { circuitKnowledge, deriveValue, valueById } from "./knowledge";
import { availablePrimitiveCapabilities, normalizedCapabilities } from "./capabilities";
import type { CircuitKnowledgePackage, ExperienceStage, GroundedText, LearningExperienceBlueprint, P6DesignRequest, PrimitiveDesign } from "./types";

const id = z.string().min(1).max(120).regex(/^[a-z0-9][a-z0-9-]*$/);
const ids = z.array(id).max(16);
const grounded = (limit: number) => z.object({ text: z.string().min(1).max(limit), supportingFactIds: ids, supportingRelationshipIds: ids }).strict().refine((value) => value.supportingFactIds.length + value.supportingRelationshipIds.length > 0, "Grounded text needs a fact or relationship reference.");
const binding = z.object({ variableId: id, valueId: id }).strict();

const primitiveSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("explanation"), factIds: ids.min(1) }).strict(),
  z.object({ kind: z.literal("observation"), sceneId: z.literal("circuit-loop-v1"), highlightConceptIds: ids.min(1) }).strict(),
  z.object({ kind: z.literal("prediction"), relationshipId: id, scenarioValueIds: ids.min(2), answerStrategy: z.literal("derive-relationship-direction") }).strict(),
  z.object({ kind: z.literal("parameter-experiment"), sceneId: z.literal("circuit-loop-v1"), controlVariableId: id, observedVariableId: id, fixedBindings: z.array(binding).min(1).max(4), selectableValueIds: ids.min(2), derivationRuleId: id, minimumComparisons: z.number().int().min(2).max(6) }).strict(),
  z.object({ kind: z.literal("comparison"), caseBindings: z.array(z.object({ label: z.string().min(1).max(40), valueIds: ids.min(1) }).strict()).min(2).max(4), observedVariableIds: ids.min(1), derivationRuleId: id.optional() }).strict(),
  z.object({ kind: z.literal("data-plot"), xVariableId: id, yVariableId: id, fixedBindings: z.array(binding).min(1).max(4), xValueIds: ids.min(3), derivationRuleId: id }).strict(),
  z.object({ kind: z.literal("diagram"), sceneId: z.literal("circuit-loop-v1"), highlightConceptIds: ids.min(1) }).strict(),
  z.object({ kind: z.literal("evidence-reveal"), factIds: ids.min(1) }).strict(),
  z.object({ kind: z.literal("worked-example"), derivationRuleId: id, inputValueIds: ids.min(2), requestedPrecision: z.union([z.literal(0), z.literal(1), z.literal(2)]), revealOrder: z.literal("inputs-then-operation-then-result") }).strict(),
  z.object({ kind: z.literal("multiple-choice"), relationshipId: id, scenarioValueIds: ids.min(2), answerStrategy: z.literal("derive-relationship-direction") }).strict(),
  z.object({ kind: z.literal("target-challenge"), derivationRuleId: id, inputValueIds: ids.min(2), targetVariableId: id }).strict(),
  z.object({ kind: z.literal("transfer-challenge"), derivationRuleId: id, inputValueIds: ids.min(2), targetVariableId: id }).strict(),
]);

const stageSchema = z.object({
  stageId: id,
  objectiveIds: ids.min(1),
  role: z.enum(["orient", "evidence", "explore", "represent", "explain", "support", "apply", "transfer"]),
  availability: z.enum(["core", "support-only", "extension"]),
  prerequisiteStageIds: ids,
  addressesMisconceptionIds: ids,
  primitive: primitiveSchema,
  copy: z.object({ title: grounded(70), instruction: grounded(220), explanation: grounded(320).optional(), correctFeedback: grounded(220).optional(), incorrectFeedback: grounded(220).optional() }).strict(),
  sourceFactIds: ids.min(1),
  sourceRelationshipIds: ids,
  estimatedMinutes: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  representationReason: z.enum(["spatial-system-best-seen", "causal-change-best-manipulated", "existing-model-should-be-elicited", "numerical-trend-best-observed", "contrast-reduces-misconception", "formal-language-after-evidence", "application-confirms-understanding", "transfer-tests-generalization"]),
  transitionReason: z.enum(["introduce-system", "collect-prior-evidence", "test-prediction", "show-alternate-form", "name-observed-pattern", "respond-to-misconception", "increase-challenge", "confirm-transfer"]),
}).strict();

export const designRequestSchema = z.object({ schemaVersion: z.literal("p6-design-request-1"), sourcePackageId: z.literal("circuits-resistance-approved-v1"), goal: z.enum(["explore", "understand", "revise", "test"]), depthMinutes: z.union([z.literal(5), z.literal(15), z.literal(30)]), learnerLevel: z.literal("intro-secondary") }).strict();

export const experienceBlueprintSchema = z.object({
  schemaVersion: z.literal("p6-experience-blueprint-1"), sourcePackageId: z.literal("circuits-resistance-approved-v1"),
  designProfile: z.object({ goal: z.enum(["explore", "understand", "revise", "test"]), depthMinutes: z.union([z.literal(5), z.literal(15), z.literal(30)]), learnerLevel: z.literal("intro-secondary") }).strict(),
  lessonTitle: grounded(70), objectiveIds: ids.min(1), assumedPrerequisiteConceptIds: ids, persistentSceneId: z.literal("circuit-loop-v1"),
  stages: z.array(stageSchema).min(3).max(12), initialSequenceStageIds: ids.min(2), finalApplicationStageId: id,
  representationGaps: z.array(z.object({ objectiveId: id, missingCapability: z.enum(normalizedCapabilities), reasonCode: z.literal("existing-primitives-cannot-show-mechanism") }).strict()).max(8),
  designSummary: z.object({ delayedFactIds: ids, omittedFactIds: ids, reasonCodes: z.array(z.string().min(1).max(80)).max(10) }).strict(),
}).strict();

const forbiddenText = /<\/?[a-z]|https?:\/\/|```|javascript:|on(?:click|load|error)\s*=/i;

function unknown(values: string[], allowed: Set<string>, label: string) { return values.filter((value) => !allowed.has(value)).map((value) => `Unknown ${label} ${value}.`); }
function duplicates(values: string[], label: string) { return new Set(values).size === values.length ? [] : [`Duplicate ${label}.`]; }

function allowedNumbers(pkg: CircuitKnowledgePackage) {
  const values = new Set(pkg.values.map((item) => String(item.value)));
  for (const voltage of pkg.values.filter((item) => item.variableId === "voltage")) for (const resistance of pkg.values.filter((item) => item.variableId === "resistance")) {
    values.add(String(Number((voltage.value / resistance.value).toFixed(2))));
  }
  for (const voltage of pkg.values.filter((item) => item.variableId === "voltage")) for (const current of pkg.values.filter((item) => item.variableId === "current")) {
    values.add(String(Number((voltage.value / current.value).toFixed(2))));
  }
  return values;
}

function validateText(value: GroundedText, stage: ExperienceStage | null, pkg: CircuitKnowledgePackage, label: string) {
  const errors: string[] = [];
  const facts = new Set(pkg.facts.map((item) => item.id)); const relationships = new Set(pkg.relationships.map((item) => item.id));
  errors.push(...unknown(value.supportingFactIds, facts, "text fact"), ...unknown(value.supportingRelationshipIds, relationships, "text relationship"));
  if (stage) {
    errors.push(...value.supportingFactIds.filter((item) => !stage.sourceFactIds.includes(item)).map((item) => `${label} uses fact ${item} outside its stage grounding.`));
    errors.push(...value.supportingRelationshipIds.filter((item) => !stage.sourceRelationshipIds.includes(item)).map((item) => `${label} uses relationship ${item} outside its stage grounding.`));
  }
  if (forbiddenText.test(value.text)) errors.push(`${label} contains markup, a URL, or executable-looking text.`);
  const allowed = allowedNumbers(pkg);
  for (const match of value.text.matchAll(/\b\d+(?:\.\d+)?\b/g)) if (!allowed.has(String(Number(match[0])))) errors.push(`${label} contains unsupported number ${match[0]}.`);
  return errors;
}

function validatePrimitive(primitive: PrimitiveDesign, pkg: CircuitKnowledgePackage) {
  const errors: string[] = [];
  const variables = new Set(pkg.variables.map((item) => item.id)); const values = new Set(pkg.values.map((item) => item.id)); const concepts = new Set(pkg.concepts.map((item) => item.id)); const facts = new Set(pkg.facts.map((item) => item.id)); const relationships = new Set(pkg.relationships.map((item) => item.id)); const derivations = new Set(pkg.derivations.map((item) => item.id));
  const checkValues = (items: string[]) => errors.push(...unknown(items, values, "value"));
  if (primitive.kind === "explanation" || primitive.kind === "evidence-reveal") errors.push(...unknown(primitive.factIds, facts, "fact"));
  if (primitive.kind === "observation" || primitive.kind === "diagram") errors.push(...unknown(primitive.highlightConceptIds, concepts, "concept"));
  if (primitive.kind === "prediction" || primitive.kind === "multiple-choice") { const relationship = pkg.relationships.find((item) => item.id === primitive.relationshipId); if (!relationships.has(primitive.relationshipId)) errors.push(`Unknown relationship ${primitive.relationshipId}.`); else if (!relationship || !["increases", "decreases"].includes(relationship.type)) errors.push("Directional assessment requires an increases/decreases relationship."); checkValues(primitive.scenarioValueIds); }
  if (primitive.kind === "parameter-experiment") {
    errors.push(...unknown([primitive.controlVariableId, primitive.observedVariableId], variables, "variable"), ...unknown([primitive.derivationRuleId], derivations, "derivation")); checkValues(primitive.selectableValueIds); checkValues(primitive.fixedBindings.map((item) => item.valueId));
    if (primitive.controlVariableId === primitive.observedVariableId) errors.push("An experiment control and observation must differ.");
    if (primitive.selectableValueIds.some((id) => valueById(id)?.variableId !== primitive.controlVariableId)) errors.push("Experiment choices must belong to the control variable.");
    if (primitive.fixedBindings.some((binding) => valueById(binding.valueId)?.variableId !== binding.variableId)) errors.push("Experiment fixed bindings must match their declared variables.");
    if (new Set(primitive.selectableValueIds).size < primitive.minimumComparisons) errors.push("The experiment cannot satisfy its comparison requirement.");
    const rule = pkg.derivations.find((item) => item.id === primitive.derivationRuleId);
    if (rule?.outputVariableId !== primitive.observedVariableId || !rule?.inputVariableIds.includes(primitive.controlVariableId)) errors.push("Experiment variables do not match the derivation.");
  }
  if (primitive.kind === "comparison") { primitive.caseBindings.forEach((item) => { checkValues(item.valueIds); if (primitive.derivationRuleId && deriveValue(primitive.derivationRuleId, item.valueIds) === undefined) errors.push(`Comparison case ${item.label} cannot be derived.`); }); errors.push(...unknown(primitive.observedVariableIds, variables, "variable")); if (primitive.derivationRuleId) errors.push(...unknown([primitive.derivationRuleId], derivations, "derivation")); }
  if (primitive.kind === "data-plot") {
    errors.push(...unknown([primitive.xVariableId, primitive.yVariableId], variables, "variable"), ...unknown([primitive.derivationRuleId], derivations, "derivation")); checkValues(primitive.xValueIds); checkValues(primitive.fixedBindings.map((item) => item.valueId));
    if (primitive.xValueIds.some((id) => valueById(id)?.variableId !== primitive.xVariableId)) errors.push("Plot values must belong to the x variable.");
    if (primitive.fixedBindings.some((binding) => valueById(binding.valueId)?.variableId !== binding.variableId)) errors.push("Plot fixed bindings must match their declared variables.");
    const rule = pkg.derivations.find((item) => item.id === primitive.derivationRuleId); if (rule?.outputVariableId !== primitive.yVariableId) errors.push("Plot y variable does not match the derivation.");
  }
  if (primitive.kind === "worked-example" || primitive.kind === "target-challenge" || primitive.kind === "transfer-challenge") {
    errors.push(...unknown([primitive.derivationRuleId], derivations, "derivation")); checkValues(primitive.inputValueIds); if (deriveValue(primitive.derivationRuleId, primitive.inputValueIds) === undefined) errors.push("Example/challenge inputs cannot be evaluated by the derivation.");
    if ((primitive.kind === "target-challenge" || primitive.kind === "transfer-challenge") && pkg.derivations.find((item) => item.id === primitive.derivationRuleId)?.outputVariableId !== primitive.targetVariableId) errors.push("Challenge target does not match the derivation output.");
  }
  return errors;
}

export function validateKnowledgePackage(pkg: CircuitKnowledgePackage = circuitKnowledge) {
  const errors: string[] = []; const sections = new Map(pkg.source.sections.map((item) => [item.id, item.text]));
  for (const fact of pkg.facts) { const text = sections.get(fact.sectionId); if (!text || !text.includes(fact.quote)) errors.push(`Fact ${fact.id} has invalid source provenance.`); }
  errors.push(...duplicates(pkg.concepts.map((item) => item.id), "concept IDs"), ...duplicates(pkg.facts.map((item) => item.id), "fact IDs"), ...duplicates(pkg.values.map((item) => item.id), "value IDs"));
  for (const rule of pkg.derivations) if (rule.inputVariableIds.length !== 2) errors.push(`Derivation ${rule.id} must have exactly two ordered inputs.`);
  return errors;
}

export function validateDesignRequest(candidate: unknown): { request?: P6DesignRequest; errors: string[] } {
  const parsed = designRequestSchema.safeParse(candidate); return parsed.success ? { request: parsed.data, errors: [] } : { errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) };
}

export function validateExperienceBlueprint(candidate: unknown, request: P6DesignRequest, pkg: CircuitKnowledgePackage = circuitKnowledge): { blueprint?: LearningExperienceBlueprint; errors: string[]; schemaValid: boolean } {
  const parsed = experienceBlueprintSchema.safeParse(candidate);
  if (!parsed.success) return { errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`), schemaValid: false };
  const blueprint = parsed.data as LearningExperienceBlueprint; const errors = validateKnowledgePackage(pkg);
  if (blueprint.sourcePackageId !== pkg.id) errors.push("Blueprint belongs to another source package.");
  if (JSON.stringify(blueprint.designProfile) !== JSON.stringify({ goal: request.goal, depthMinutes: request.depthMinutes, learnerLevel: request.learnerLevel })) errors.push("Blueprint design profile does not match the request.");
  const factIds = new Set(pkg.facts.map((item) => item.id)); const relationshipIds = new Set(pkg.relationships.map((item) => item.id)); const objectiveIds = new Set(pkg.objectives.map((item) => item.id)); const conceptIds = new Set(pkg.concepts.map((item) => item.id)); const misconceptionIds = new Set(pkg.misconceptions.map((item) => item.id));
  errors.push(...unknown(blueprint.objectiveIds, objectiveIds, "objective"), ...unknown(blueprint.assumedPrerequisiteConceptIds, conceptIds, "prerequisite concept"), ...validateText(blueprint.lessonTitle, null, pkg, "Lesson title"));
  const rawStageIds = blueprint.stages.map((item) => item.stageId);
  const stageIds = new Set(rawStageIds); errors.push(...duplicates(rawStageIds, "stage IDs"));
  const byId = new Map(blueprint.stages.map((stage) => [stage.stageId, stage]));
  const signatures = new Set<string>();
  for (const stage of blueprint.stages) {
    errors.push(...unknown(stage.objectiveIds, objectiveIds, "stage objective"), ...unknown(stage.sourceFactIds, factIds, "stage fact"), ...unknown(stage.sourceRelationshipIds, relationshipIds, "stage relationship"), ...unknown(stage.addressesMisconceptionIds, misconceptionIds, "misconception"), ...unknown(stage.prerequisiteStageIds, stageIds, "prerequisite stage"), ...validatePrimitive(stage.primitive, pkg));
    for (const [label, value] of Object.entries(stage.copy)) if (value) errors.push(...validateText(value, stage, pkg, `${stage.stageId}.${label}`));
    if (stage.availability === "support-only" && (!stage.addressesMisconceptionIds.length || stage.role !== "support")) errors.push(`${stage.stageId} support stages need a support role and misconception.`);
    if (stage.availability !== "support-only" && stage.role === "support") errors.push(`${stage.stageId} support role must be support-only.`);
    if (["evidence", "apply", "transfer"].includes(stage.role) && !["prediction", "multiple-choice", "target-challenge", "transfer-challenge"].includes(stage.primitive.kind)) errors.push(`${stage.stageId} needs a scored primitive for its role.`);
    const signature = `${stage.role}|${stage.availability}|${stage.primitive.kind}|${[...stage.objectiveIds].sort().join(",")}`; if (signatures.has(signature)) errors.push(`Redundant stage design ${signature}.`); signatures.add(signature);
  }
  errors.push(...unknown(blueprint.initialSequenceStageIds, stageIds, "initial sequence stage"), ...duplicates(blueprint.initialSequenceStageIds, "initial sequence stage IDs"));
  const initial = blueprint.initialSequenceStageIds.map((id) => byId.get(id)).filter(Boolean) as ExperienceStage[];
  if (initial.some((stage) => stage.availability === "support-only")) errors.push("Initial sequence cannot contain support-only stages.");
  for (const [index, stage] of initial.entries()) for (const dependency of stage.prerequisiteStageIds) {
    const dependencyIndex = blueprint.initialSequenceStageIds.indexOf(dependency);
    if (dependencyIndex < 0) errors.push(`${stage.stageId} has unmet prerequisite ${dependency} in the initial sequence.`);
    else if (dependencyIndex >= index) errors.push(`${stage.stageId} appears before prerequisite ${dependency}.`);
  }
  const visiting = new Set<string>(); const visited = new Set<string>(); const cycle = (idValue: string): boolean => { if (visiting.has(idValue)) return true; if (visited.has(idValue)) return false; visiting.add(idValue); const found = byId.get(idValue)?.prerequisiteStageIds.some(cycle) ?? false; visiting.delete(idValue); visited.add(idValue); return found; }; if ([...stageIds].some(cycle)) errors.push("Stage dependencies contain a cycle.");
  const covered = new Set(initial.flatMap((stage) => stage.objectiveIds));
  const gapObjectives = blueprint.representationGaps.map((gap) => gap.objectiveId);
  errors.push(...duplicates(gapObjectives, "representation-gap objectives"));
  for (const objective of blueprint.objectiveIds) {
    const stageCoverage = covered.has(objective);
    const gapCoverage = gapObjectives.includes(objective);
    if (!stageCoverage && !gapCoverage) errors.push(`Initial lesson does not cover ${objective} with a stage or representation gap.`);
    if (stageCoverage && gapCoverage) errors.push(`Representation gap duplicates stage coverage for ${objective}.`);
  }
  if (!initial.some((stage) => stage.role === "evidence")) errors.push("Initial lesson needs an evidence stage.");
  if (!initial.some((stage) => !["explanation", "evidence-reveal"].includes(stage.primitive.kind))) errors.push("Initial lesson needs a non-text representation.");
  if (!blueprint.stages.some((stage) => stage.availability === "support-only")) errors.push("The designed environment needs a support alternative.");
  const final = byId.get(blueprint.finalApplicationStageId); if (!final || !["apply", "transfer"].includes(final.role)) errors.push("Final application stage is missing or has the wrong role.");
  if (blueprint.initialSequenceStageIds.at(-1) !== blueprint.finalApplicationStageId) errors.push("Initial sequence must finish with the final application stage.");
  if (initial.reduce((sum, stage) => sum + stage.estimatedMinutes, 0) > request.depthMinutes) errors.push("Initial sequence exceeds the selected time budget.");
  errors.push(...unknown(blueprint.designSummary.delayedFactIds, factIds, "delayed fact"), ...unknown(blueprint.designSummary.omittedFactIds, factIds, "omitted fact"));
  if (blueprint.designSummary.delayedFactIds.some((idValue) => blueprint.designSummary.omittedFactIds.includes(idValue))) errors.push("A fact cannot be both delayed and omitted.");
  for (const gap of blueprint.representationGaps) {
    if (!objectiveIds.has(gap.objectiveId)) errors.push(`Unknown representation-gap objective ${gap.objectiveId}.`);
    else if (!blueprint.objectiveIds.includes(gap.objectiveId)) errors.push(`Representation gap ${gap.objectiveId} is not a selected lesson objective.`);
    if (availablePrimitiveCapabilities.has(gap.missingCapability)) errors.push(`Representation gap ${gap.objectiveId} claims available capability ${gap.missingCapability}.`);
  }
  return { blueprint, errors, schemaValid: true };
}
