import type { ActivityEvidenceContract, GoldLesson, P65Activity, P65Depth, P65Goal } from "./types";

const allGoals: P65Goal[] = ["curious", "understand", "revise", "test"];
const learningGoals: P65Goal[] = ["curious", "understand"];
const assessedGoals: P65Goal[] = ["understand", "revise", "test"];
type ActivityDefinition = Omit<P65Activity, "evidenceContract"> & { evidenceContract?: ActivityEvidenceContract };
const defineActivity = (activity: ActivityDefinition): P65Activity => ({
  ...activity,
  evidenceContract: activity.evidenceContract ?? {
    concept: activity.conceptIds.join(", "),
    learnerAction: activity.prompt,
    evidenceProduced: `A ${activity.evidenceChannel} observation from the learner action.`,
    reasonableInference: "The action contributes limited evidence about the named concept.",
    excludedInference: "One action does not prove mastery or a permanent learner trait.",
    adaptationResponse: "Respond with the smallest relevant cue or representation change.",
  },
});

export const circuitLesson: GoldLesson = {
  id: "circuits", subject: "Physics", title: "Resistance and current", question: "How does resistance change current?", sceneId: "circuit-continuum", palette: "electric",
  sceneObjects: ["battery", "switch", "resistor", "current-path", "lamp", "measurement-graph"], initialObjectIds: ["battery", "switch", "lamp"],
  objectDetails: [
    { id: "battery", label: "Battery", definition: "The energy source that provides voltage to the circuit.", unit: "Voltage is measured in volts (V).", mechanism: "Chemical energy separates charge inside the battery, creating an electrical push.", advanced: "This lesson treats the battery voltage as fixed unless a transfer activity changes it." },
    { id: "switch", label: "Switch", definition: "A control that opens or closes the conducting path.", mechanism: "Closing the contacts removes the gap so charge can move around the whole loop." },
    { id: "lamp", label: "Lamp", definition: "A component that changes electrical energy into light and heat.", mechanism: "The lamp responds only when a complete path lets current pass through it." },
    { id: "current-path", label: "Current", definition: "The movement of electric charge around a complete circuit.", unit: "Current is measured in amperes (A).", mechanism: "A larger current means more charge passes a point each second." },
    { id: "resistor", label: "Resistor", definition: "A component that provides resistance and opposes current.", unit: "Resistance is measured in ohms (Ω).", mechanism: "With the battery unchanged, greater resistance produces less current.", advanced: "Resistance changes energy transfer in the circuit; it is not the source of the electrical push." },
    { id: "measurement-graph", label: "Evidence graph", definition: "A plot made from the circuit states you tested.", mechanism: "Each point connects one resistance value with the current produced at the same fixed voltage." },
  ],
  concepts: [{ id: "closed-path", label: "Closed path" }, { id: "resistance-current", label: "Resistance and current" }, { id: "ohms-law", label: "Ohm's law" }, { id: "transfer", label: "New circuit conditions" }],
  referenceStructure: [
    { id: "complete-circuit", conceptId: "closed-path", title: "Complete circuits", order: 1 },
    { id: "current", conceptId: "resistance-current", title: "Current", order: 2 },
    { id: "voltage", conceptId: "resistance-current", title: "Voltage", order: 3 },
    { id: "resistance", conceptId: "resistance-current", title: "Resistance", order: 4 },
    { id: "relationships", conceptId: "resistance-current", title: "Circuit relationships", order: 5 },
    { id: "ohms-law", conceptId: "ohms-law", title: "Ohm's law", order: 6 },
    { id: "applications", conceptId: "transfer", title: "Applications", order: 7 },
  ],
  trustedKnowledge: {
    factIds: ["fact-complete-path", "fact-current-flow", "fact-voltage-push", "fact-resistance-opposes", "fact-ohms-law", "fact-circuit-application"],
    relationshipIds: ["rel-closed-path-current", "rel-voltage-current", "rel-resistance-current", "rel-ohms-law"],
  },
  initialReference: [],
  sideBranches: [{ id: "battery-voltage", label: "Why does the battery matter?", question: "Why does a battery create voltage?", answer: "The battery separates charge using stored chemical energy. That creates the electrical push we call voltage. In this lesson the battery stays fixed so resistance is the only changing cause.", conceptId: "resistance-current" }],
  activities: [
    defineActivity({
      id: "c-close", title: "Wake the circuit", prompt: "Close the gap and watch the whole loop respond.", goalPrompts: { understand: "See why a circuit needs a complete path. Close the gap and watch the loop respond." }, family: "discover", purpose: "casual", freedom: "guided-learning", stageRole: "foundation", technicalLevel: 1, prerequisiteActivityIds: [], interaction: "close-circuit", representation: "live-system", sceneTransition: "reveal", adaptationOptions: ["highlight", "cue"], conceptIds: ["closed-path"], evidenceChannel: "natural",
      information: { activeObjectIds: ["switch"], introducedObjectIds: [], revealedAfterActionObjectIds: ["current-path"], contextualTargetObjectId: "current-path", contextualExplanation: "Current — electrical charge is flowing around the complete circuit. The moving dots are a visual model of changes in current.", contextualReveal: "after-action" }, eligibleGoals: learningGoals, minimumDepth: "quick",
      referenceContributions: [
        { id: "ref-closed", sectionId: "complete-circuit", kind: "definition", title: "Closed circuit", body: "A complete conducting path allows current to flow.", status: "explored", relationships: ["Closed path → current can flow"], representations: [{ kind: "diagram", label: "Circuit after the switch was closed" }], supportingFactIds: ["fact-complete-path"], supportingRelationshipIds: ["rel-closed-path-current"] },
        { id: "ref-current", sectionId: "current", kind: "definition", title: "Current", body: "Current is the flow of electric charge around a complete circuit.", status: "introduced", representations: [{ kind: "diagram", label: "Moving lime markers represent current in the scene" }], supportingFactIds: ["fact-current-flow"], supportingRelationshipIds: ["rel-closed-path-current"] },
      ],
    }),
    defineActivity({
      id: "c-voltage", title: "Find the push", prompt: "Keep resistance fixed. Compare two battery voltages and watch current.", goalPrompts: { understand: "See how voltage changes current. Keep resistance fixed so only the battery voltage changes." }, family: "manipulate-build", purpose: "casual", freedom: "guided-learning", stageRole: "explore", technicalLevel: 2, prerequisiteActivityIds: ["c-close"], interaction: "observe-voltage", representation: "comparison", sceneTransition: "attach", adaptationOptions: ["highlight", "cue"], conceptIds: ["resistance-current"], evidenceChannel: "natural",
      circuitRuntime: { fixed: { closed: true, resistance: 4 }, selectableVoltages: [9, 12] },
      information: { activeObjectIds: ["battery", "current-path"], introducedObjectIds: ["current-path"], contextualTargetObjectId: "battery", contextualExplanation: "Voltage is the electrical push that drives current through the circuit.", contextualReveal: "after-action", contextualRevealByGoal: { understand: "immediate" } }, eligibleGoals: learningGoals, minimumDepth: "learn",
      referenceContributions: [{ id: "ref-voltage", sectionId: "voltage", kind: "definition", title: "Voltage", body: "Voltage is the electrical push supplied by the battery and is measured in volts (V).", status: "explored", relationships: ["Higher voltage → greater current when resistance stays fixed"], representations: [{ kind: "measurement", label: "Your 9 V and 12 V comparison" }], supportingFactIds: ["fact-voltage-push", "fact-current-flow"], supportingRelationshipIds: ["rel-voltage-current"] }],
    }),
    defineActivity({
      id: "c-predict", title: "Before you touch it", prompt: "The battery will stay fixed. Predict what current will do when resistance increases.", family: "predict-test", purpose: "casual", freedom: "guided-learning", stageRole: "diagnostic", technicalLevel: 1, prerequisiteActivityIds: [], interaction: "predict-current", representation: "live-system", sceneTransition: "preserve", adaptationOptions: ["comparison", "highlight"], conceptIds: ["resistance-current"], evidenceChannel: "diagnostic",
      circuitRuntime: { initial: { resistance: 4 }, fixed: { closed: true, voltage: 9 }, selectableResistances: [4, 9] },
      information: { activeObjectIds: ["resistor", "current-path"], introducedObjectIds: ["resistor", "current-path"], contextualTargetObjectId: "resistor", contextualExplanation: "Compare resistance with current while the battery stays unchanged.", contextualReveal: "after-struggle", evidenceVisibility: "withhold-until-commit" }, eligibleGoals: allGoals, minimumDepth: "quick", referenceContributions: [],
    }),
    defineActivity({
      id: "c-lab", title: "Build the pattern", prompt: "Change the resistor, collect several circuit states, then use your evidence to complete the relationship.", family: "manipulate-build", purpose: "casual", freedom: "guided-learning", stageRole: "representation", technicalLevel: 1, prerequisiteActivityIds: [], interaction: "resistance-lab", representation: "learner-data", sceneTransition: "attach", adaptationOptions: ["constrain-controls", "cue"], conceptIds: ["resistance-current", "ohms-law"], evidenceChannel: "natural",
      evidenceContract: { concept: "Resistance and current", learnerAction: "Generate several fixed-voltage measurements, then select the relationship they show.", evidenceProduced: "The tested values and whether the learner correctly reads the pattern in their own data.", reasonableInference: "Supports whether the learner can connect increased resistance with decreased current in observed cases.", excludedInference: "Does not alone prove mastery of Ohm's law or transfer to every circuit.", adaptationResponse: "Keep the measurements visible; cue the unchanged voltage or offer a two-state comparison." },
      information: { activeObjectIds: ["resistor", "current-path"], introducedObjectIds: ["resistor", "current-path", "measurement-graph"], contextualTargetObjectId: "resistor", contextualExplanation: "Resistance opposes current. Change it and watch the current value respond.", contextualReveal: "after-action" }, eligibleGoals: allGoals, minimumDepth: "quick",
      referenceContributions: [
        { id: "ref-resistance", sectionId: "resistance", kind: "definition", title: "Resistance", body: "Resistance opposes current and is measured in ohms (Ω).", status: "explored", supportingFactIds: ["fact-resistance-opposes"], supportingRelationshipIds: ["rel-resistance-current"] },
        { id: "ref-pattern", sectionId: "relationships", kind: "relationship", title: "Resistance and current", body: "With voltage fixed: more resistance → less current.", status: "demonstrated", relationships: ["Higher resistance → lower current when voltage stays fixed"], representations: [{ kind: "graph", label: "Graph generated from your circuit measurements" }], supportingFactIds: ["fact-resistance-opposes", "fact-current-flow"], supportingRelationshipIds: ["rel-resistance-current"] },
        { id: "ref-evidence", sectionId: "relationships", kind: "evidence", title: "Evidence pattern", body: "At fixed voltage, greater resistance produces a lower current.", status: "demonstrated", representations: [{ kind: "measurement", label: "Resistance and current measurements" }], supportingFactIds: ["fact-current-flow"], supportingRelationshipIds: ["rel-resistance-current"] },
      ],
    }),
    defineActivity({
      id: "c-compare", title: "Compare two paths", prompt: "Both circuits use 9 V. Inspect the two states and identify the change that explains their different currents.", family: "compare-connect", purpose: "casual", freedom: "guided-learning", stageRole: "representation", technicalLevel: 1, prerequisiteActivityIds: ["c-predict"], interaction: "compare-resistance", representation: "comparison", sceneTransition: "compare", adaptationOptions: ["highlight", "cue"], conceptIds: ["resistance-current"], evidenceChannel: "natural",
      circuitRuntime: { fixed: { closed: true, voltage: 9 } },
      evidenceContract: { concept: "Resistance and current", learnerAction: "Inspect two same-voltage circuit states and identify the changed quantity.", evidenceProduced: "Whether the learner isolates resistance as the cause of the current difference.", reasonableInference: "Supports causal comparison while voltage is controlled.", excludedInference: "Does not prove that the learner can calculate current or explain every circuit difference.", adaptationResponse: "Highlight the shared 9 V first, then the unequal resistor values." },
      information: { activeObjectIds: ["battery", "resistor", "current-path"], introducedObjectIds: ["resistor", "current-path"], contextualTargetObjectId: "resistor", contextualExplanation: "The battery is identical in both states. Compare the resistor values with the currents.", contextualReveal: "after-struggle" }, eligibleGoals: [], minimumDepth: "quick", referenceContributions: [],
    }),
    defineActivity({
      id: "c-target", title: "Make 1.50 A", prompt: "Keep the 9 V battery. Choose a resistor that makes the current exactly 1.50 A.", family: "apply-solve", purpose: "focus", freedom: "guided-challenge", stageRole: "application", technicalLevel: 2, prerequisiteActivityIds: [], interaction: "target-current", representation: "live-system", sceneTransition: "constrain", adaptationOptions: ["cue", "highlight", "comparison"], conceptIds: ["ohms-law"], evidenceChannel: "natural",
      evidenceContract: { concept: "Applying resistance-current relationships", learnerAction: "Configure the resistor to reach a target current while voltage remains fixed.", evidenceProduced: "The selected resistor, attempts, and guidance needed to reach 1.50 A.", reasonableInference: "Supports the ability to use the relationship toward a concrete circuit goal.", excludedInference: "One successful target does not establish general mastery or unaided transfer.", adaptationResponse: "Describe whether current is too high or low before revealing a formula cue." },
      circuitRuntime: { fixed: { closed: true, voltage: 9 }, selectableResistances: [3, 6, 9], targetCurrent: 1.5 },
      information: { activeObjectIds: ["battery", "resistor", "current-path"], introducedObjectIds: ["resistor", "current-path"], contextualTargetObjectId: "current-path", contextualExplanation: "Use the relationship you produced: current equals voltage divided by resistance.", contextualReveal: "immediate" }, eligibleGoals: assessedGoals, minimumDepth: "learn",
      referenceContributions: [
        { id: "ref-formula", sectionId: "ohms-law", kind: "formula", title: "Ohm's law", body: "Current = voltage ÷ resistance · I = V ÷ R", status: "practised", representations: [{ kind: "formula", label: "I = V ÷ R" }], supportingFactIds: ["fact-ohms-law"], supportingRelationshipIds: ["rel-ohms-law"] },
        { id: "ref-example", sectionId: "applications", kind: "example", title: "A result you produced", body: "9 V ÷ 6 Ω = 1.50 A", status: "demonstrated", representations: [{ kind: "measurement", label: "Target-current result" }], supportingFactIds: ["fact-ohms-law", "fact-circuit-application"], supportingRelationshipIds: ["rel-ohms-law"] },
      ],
    }),
    defineActivity({
      id: "c-repair", title: "Repair the dark circuit", prompt: "The lamp should be on, but the path is broken. Inspect the circuit and repair only the fault.", family: "repair-debug", purpose: "focus", freedom: "guided-challenge", stageRole: "application", technicalLevel: 2, prerequisiteActivityIds: [], interaction: "repair-circuit", representation: "live-system", sceneTransition: "constrain", adaptationOptions: ["highlight", "cue"], conceptIds: ["closed-path"], evidenceChannel: "diagnostic",
      evidenceContract: { concept: "Closed path", learnerAction: "Diagnose a dark circuit and choose the change that restores the conducting path.", evidenceProduced: "The attempted repair and whether the learner identifies the open switch rather than changing an unrelated component.", reasonableInference: "Supports applying the complete-path concept to a fault.", excludedInference: "Does not prove broad electrical troubleshooting skill.", adaptationResponse: "Highlight the discontinuity without naming the repair; then identify the switch if needed." },
      information: { activeObjectIds: ["switch", "lamp"], introducedObjectIds: ["current-path"], contextualTargetObjectId: "switch", contextualExplanation: "Trace the path around the loop and find where it stops.", contextualReveal: "after-struggle" }, eligibleGoals: ["revise", "test"], minimumDepth: "learn", referenceContributions: [{ id: "ref-repair", sectionId: "complete-circuit", kind: "application", title: "Circuit repair", body: "A break anywhere in the conducting path prevents current from flowing around the loop.", status: "demonstrated", representations: [{ kind: "diagram", label: "The open path you repaired" }], supportingFactIds: ["fact-complete-path"], supportingRelationshipIds: ["rel-closed-path-current"] }],
    }),
    defineActivity({
      id: "c-transfer", title: "A new battery", prompt: "The battery is now 12 V and resistance is 6 Ω. Find the resulting current.", family: "apply-solve", purpose: "focus", freedom: "guided-challenge", stageRole: "transfer", technicalLevel: 3, prerequisiteActivityIds: [], interaction: "transfer-current", representation: "live-system", sceneTransition: "constrain", adaptationOptions: ["cue", "highlight"], conceptIds: ["ohms-law", "transfer"], evidenceChannel: "diagnostic",
      information: { activeObjectIds: ["battery", "resistor", "current-path"], introducedObjectIds: ["resistor", "current-path"], contextualTargetObjectId: "battery", contextualExplanation: "The voltage has changed. Reuse the same relationship with the new value.", contextualReveal: "immediate" }, eligibleGoals: ["understand", "revise", "test"], minimumDepth: "deep",
      referenceContributions: [{ id: "ref-transfer", sectionId: "applications", kind: "application", title: "A new circuit", body: "The same relationship can determine current when the circuit values change.", status: "demonstrated", representations: [{ kind: "measurement", label: "12 V and 6 Ω transfer result" }], supportingFactIds: ["fact-ohms-law", "fact-circuit-application"], supportingRelationshipIds: ["rel-ohms-law"] }],
    }),
    defineActivity({
      id: "c-play", title: "Ask the circuit", prompt: "Choose a battery and resistor, then investigate your own combinations.", family: "create-demonstrate", purpose: "casual", freedom: "playground", stageRole: "extension", technicalLevel: 3, prerequisiteActivityIds: [], interaction: "circuit-playground", representation: "live-system", sceneTransition: "expand", adaptationOptions: ["highlight"], conceptIds: ["resistance-current", "ohms-law"], evidenceChannel: "natural",
      information: { activeObjectIds: ["battery", "resistor", "current-path"], introducedObjectIds: ["resistor", "current-path", "measurement-graph"], contextualTargetObjectId: "measurement-graph", contextualExplanation: "Choose a combination, then use the current as evidence for your own question.", contextualReveal: "immediate" }, eligibleGoals: ["curious", "understand"], minimumDepth: "deep", referenceContributions: [],
    }),
  ],
};

export const historyLesson: GoldLesson = {
  id: "history", subject: "History", title: "The road to the Moon", question: "Why did humans reach the Moon in 1969?", sceneId: "history-continuum", palette: "archive",
  sceneObjects: ["timeline", "event-markers", "cause-network", "source-fragments", "cause-chain"], initialObjectIds: ["timeline"],
  objectDetails: [
    { id: "timeline", label: "Timeline", definition: "A chronological view of events from 1957 to 1969.", mechanism: "Spacing and order help distinguish what happened before a later decision or outcome." },
    { id: "event-markers", label: "Turning points", definition: "Four events that changed the direction or intensity of the space race.", mechanism: "The events become meaningful as a sequence rather than as isolated dates." },
    { id: "cause-network", label: "Cause connection", definition: "A supported link between pressure, decision and consequence.", mechanism: "Historical causes are defended with chronology and evidence, not simply placed beside outcomes." },
    { id: "source-fragments", label: "Source evidence", definition: "Words produced during the historical period that can support or weaken an explanation.", advanced: "A source can show ambition without directly proving international competition; precise wording matters." },
    { id: "cause-chain", label: "Causal explanation", definition: "A sequence that connects a cause to a decision and then to an outcome.", mechanism: "A defensible chain preserves chronological order and names the link between each step." },
  ],
  concepts: [{ id: "chronology", label: "Chronology" }, { id: "cold-war-cause", label: "Cold War competition" }, { id: "evidence", label: "Historical evidence" }, { id: "causal-explanation", label: "Causal explanation" }],
  referenceStructure: [
    { id: "chronology", conceptId: "chronology", title: "Turning points", order: 1 },
    { id: "competition", conceptId: "cold-war-cause", title: "Cold War competition", order: 2 },
    { id: "historical-evidence", conceptId: "evidence", title: "Historical evidence", order: 3 },
    { id: "causal-explanation", conceptId: "causal-explanation", title: "Causal explanation", order: 4 },
  ],
  trustedKnowledge: {
    factIds: ["fact-space-timeline", "fact-cold-war-competition", "fact-kennedy-source", "fact-apollo-outcome"],
    relationshipIds: ["rel-chronology", "rel-competition-investment", "rel-source-support", "rel-pressure-decision-outcome"],
  },
  initialReference: [],
  sideBranches: [{ id: "why-sputnik", label: "Why did Sputnik matter?", question: "Why did one satellite change the space race?", answer: "Sputnik demonstrated that the Soviet Union could place technology in orbit. It intensified American concern and made space achievement a visible measure of scientific and political power.", conceptId: "cold-war-cause" }],
  activities: [
    defineActivity({ id: "h-timeline", title: "Read the distance between events", prompt: "Reveal the four moments. Notice how quickly the race accelerated.", family: "discover", purpose: "casual", freedom: "guided-learning", stageRole: "foundation", technicalLevel: 1, prerequisiteActivityIds: [], interaction: "inspect-timeline", representation: "timeline", sceneTransition: "reveal", adaptationOptions: ["highlight", "cue"], conceptIds: ["chronology"], evidenceChannel: "natural", information: { activeObjectIds: ["timeline", "event-markers"], introducedObjectIds: ["event-markers"], contextualTargetObjectId: "event-markers", contextualExplanation: "Each new marker changes what the sequence can explain.", contextualReveal: "after-action" }, eligibleGoals: learningGoals, minimumDepth: "quick", referenceContributions: [{ id: "ref-timeline", sectionId: "chronology", kind: "evidence", title: "Four turning points", body: "1957 Sputnik · 1961 Gagarin · 1961 Kennedy's Moon goal · 1969 Apollo 11", status: "explored", representations: [{ kind: "timeline", label: "The four moments you revealed" }], supportingFactIds: ["fact-space-timeline", "fact-apollo-outcome"], supportingRelationshipIds: ["rel-chronology"] }] }),
    defineActivity({ id: "h-causes", title: "Connect cause to consequence", prompt: "Choose the connection that best explains why investment accelerated.", family: "compare-connect", purpose: "casual", freedom: "guided-learning", stageRole: "diagnostic", technicalLevel: 1, prerequisiteActivityIds: [], interaction: "connect-causes", representation: "cause-network", sceneTransition: "attach", adaptationOptions: ["change-activity", "highlight"], conceptIds: ["cold-war-cause", "causal-explanation"], evidenceChannel: "diagnostic", information: { activeObjectIds: ["cause-network"], introducedObjectIds: ["event-markers", "cause-network"], contextualTargetObjectId: "cause-network", contextualExplanation: "A cause needs a supported link to the later decision and outcome.", contextualReveal: "after-struggle" }, eligibleGoals: allGoals, minimumDepth: "quick", referenceContributions: [{ id: "ref-cause", sectionId: "competition", kind: "relationship", title: "A major cause", body: "Cold War competition made space achievement a demonstration of technological and political strength.", status: "practised", relationships: ["Competition → pressure to demonstrate capability"], supportingFactIds: ["fact-cold-war-competition"], supportingRelationshipIds: ["rel-competition-investment"] }] }),
    defineActivity({ id: "h-source", title: "Use evidence, not hindsight", prompt: "Inspect two short sources. Choose which one more directly supports the competition explanation.", family: "evidence-reason", purpose: "focus", freedom: "guided-challenge", stageRole: "representation", technicalLevel: 2, prerequisiteActivityIds: [], interaction: "source-evidence", representation: "source-evidence", sceneTransition: "attach", adaptationOptions: ["cue", "highlight"], conceptIds: ["evidence", "cold-war-cause"], evidenceChannel: "natural", information: { activeObjectIds: ["source-fragments"], introducedObjectIds: ["event-markers", "source-fragments"], contextualTargetObjectId: "source-fragments", contextualExplanation: "Read the wording: direct evidence should name the competition or challenge.", contextualReveal: "after-struggle" }, eligibleGoals: assessedGoals, minimumDepth: "learn", referenceContributions: [{ id: "ref-source", sectionId: "historical-evidence", kind: "evidence", title: "Evidence you selected", body: "Kennedy framed the Moon goal as a challenge the United States should win, directly linking the programme to competition.", status: "demonstrated", representations: [{ kind: "timeline", label: "Source evidence attached to its historical moment" }], supportingFactIds: ["fact-kennedy-source"], supportingRelationshipIds: ["rel-source-support"] }] }),
    defineActivity({ id: "h-chain", title: "Build a defensible explanation", prompt: "Construct a three-part chain from pressure to decision to outcome.", family: "create-demonstrate", purpose: "focus", freedom: "guided-challenge", stageRole: "application", technicalLevel: 3, prerequisiteActivityIds: [], interaction: "build-cause-chain", representation: "cause-network", sceneTransition: "constrain", adaptationOptions: ["cue", "highlight"], conceptIds: ["causal-explanation", "chronology", "evidence"], evidenceChannel: "diagnostic", information: { activeObjectIds: ["cause-chain"], introducedObjectIds: ["event-markers", "cause-network", "source-fragments", "cause-chain"], contextualTargetObjectId: "cause-chain", contextualExplanation: "Keep cause before decision, and decision before outcome.", contextualReveal: "immediate" }, eligibleGoals: ["understand", "revise", "test"], minimumDepth: "deep", referenceContributions: [{ id: "ref-explanation", sectionId: "causal-explanation", kind: "application", title: "Explanation you constructed", body: "Cold War competition increased pressure; the United States committed resources to a Moon goal; Apollo 11 achieved that goal in 1969.", status: "demonstrated", relationships: ["Pressure → commitment → Apollo 11"], supportingFactIds: ["fact-cold-war-competition", "fact-apollo-outcome"], supportingRelationshipIds: ["rel-pressure-decision-outcome"] }] }),
    defineActivity({ id: "h-play", title: "Explore another connection", prompt: "Open the timeline and follow any cause, person, or consequence that interests you.", family: "discover", purpose: "casual", freedom: "playground", stageRole: "extension", technicalLevel: 3, prerequisiteActivityIds: [], interaction: "history-playground", representation: "timeline", sceneTransition: "expand", adaptationOptions: ["highlight"], conceptIds: ["chronology", "causal-explanation"], evidenceChannel: "natural", information: { activeObjectIds: ["timeline", "event-markers", "cause-network"], introducedObjectIds: ["event-markers", "cause-network"], contextualTargetObjectId: "timeline", contextualExplanation: "Choose the thread that interests you; the archive will keep its context visible.", contextualReveal: "immediate" }, eligibleGoals: ["curious", "understand"], minimumDepth: "deep", referenceContributions: [] }),
  ],
};

export const goldLessons: GoldLesson[] = [circuitLesson, historyLesson];

const depthRank: Record<P65Depth, number> = { quick: 1, learn: 2, deep: 3 };
const activityLimit: Record<P65Depth, number> = { quick: 3, learn: 5, deep: 7 };
const roleOrder: Record<P65Goal, P65Activity["stageRole"][]> = {
  curious: ["foundation", "representation", "explore", "diagnostic", "extension", "application", "transfer"],
  understand: ["foundation", "explore", "diagnostic", "representation", "application", "transfer", "extension"],
  revise: ["diagnostic", "application", "representation", "transfer", "foundation", "explore", "extension"],
  test: ["diagnostic", "application", "transfer", "representation", "foundation", "explore", "extension"],
};

function goalAllows(activity: P65Activity, goal: P65Goal) {
  if (!activity.eligibleGoals.includes(goal)) return false;
  if (goal === "test") return activity.purpose === "focus" || activity.evidenceChannel === "diagnostic";
  if (goal === "revise") return !["foundation", "explore", "extension"].includes(activity.stageRole) && !(activity.stageRole === "representation" && activity.purpose === "casual");
  if (goal === "curious") return activity.purpose === "casual" || activity.stageRole === "extension";
  return true;
}

/** Purpose controls pedagogical order; depth controls technical reach and activity budget. */
export function activityPath(lesson: GoldLesson, goal: P65Goal, depth: P65Depth): P65Activity[] {
  const preferredRoles = roleOrder[goal];
  const ordered = lesson.activities
    .map((activity, sourceOrder) => ({ activity, sourceOrder }))
    .filter(({ activity }) => goalAllows(activity, goal) && activity.technicalLevel <= depthRank[depth])
    .sort((left, right) => preferredRoles.indexOf(left.activity.stageRole) - preferredRoles.indexOf(right.activity.stageRole) || left.sourceOrder - right.sourceOrder)
    .map(({ activity }) => activity);
  const selected = ordered.slice(0, activityLimit[depth]);
  if (goal === "curious" && depth === "quick") return selected.slice(0, 2);
  if (goal === "revise" && depth === "quick") return selected.slice(0, 1);
  if (goal === "test" && depth === "quick") return selected.slice(0, 2);
  return selected;
}

export function findActivity(lesson: GoldLesson, id: string) {
  return lesson.activities.find((activity) => activity.id === id);
}
