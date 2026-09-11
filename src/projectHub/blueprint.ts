export type SystemStatus = "exists" | "current" | "planned" | "later";

export type BlueprintSystem = {
  id: string;
  number: string;
  title: string;
  purpose: string;
  target: string[];
  status: SystemStatus;
  statusLabel: string;
  prototype: string;
  principles: string[];
  questions: string[];
  examples?: { label: string; items: string[] }[];
  strategies?: { title: string; assumption: string; behaviours: string[] }[];
  flow?: string[];
};

export type BlueprintPage = {
  slug: string;
  eyebrow: string;
  title: string;
  intro: string;
  systems: BlueprintSystem[];
};

export const targetDescription =
  "Curiosity Lab is a learning engine that can understand trustworthy knowledge, decide how that knowledge should be learned, construct an appropriate interactive experience, observe evidence of understanding, adapt the experience when necessary, and preserve what the learner has learned.";

export const targetLoop = [
  "What do you want to learn?",
  "Knowledge acquisition",
  "Knowledge understanding",
  "Learning design",
  "Representation selection",
  "Interactive construction",
  "Learning canvas",
  "Learner interaction",
  "Evidence collection",
  "Understanding estimate",
  "Adaptation",
  "Application / transfer",
  "Progressive reference",
  "Next learning decision",
];

export const targetLoopConnections = [
  "Activities produce learner evidence.",
  "Learner evidence drives adaptation.",
  "Adaptation changes the scene or activity.",
  "Changed scenes create new evidence.",
  "Learned knowledge enters the reference.",
  "P7 supplies knowledge.",
  "P8 supplies missing learning representations.",
];

export const notTheProduct = [
  "A chatbot",
  "A quiz generator",
  "An AI note generator",
  "A static course website",
  "A slide generator",
];

export const blueprintPrinciples = [
  "Do not only generate an explanation. Build the experience through which the learner understands it.",
  "Purpose determines how we teach. Depth determines how far we go.",
  "Do not expose information simply because it belongs to the topic. Expose it because this learner, with this goal, needs it now.",
  "Objects are the explanation. Text supports them.",
  "Experience → notice → name → explain → connect → apply.",
  "If something can be learned through doing, prefer meaningful doing.",
  "If it cannot be learned by manipulating something, make the knowledge itself explorable.",
  "A chatbot changes its answer. Curiosity Lab can change the learning experience.",
];

export const capabilityStatus = [
  { name: "Autonomous lesson design", status: "exists" as const, label: "Exists · P6" },
  { name: "Learning-experience vocabulary", status: "current" as const, label: "Current · P6.5" },
  { name: "Activity system", status: "current" as const, label: "Current · P6.5" },
  { name: "Persistent canvas", status: "current" as const, label: "Current · P6.5" },
  { name: "Adaptation design", status: "current" as const, label: "Current · P6.5" },
  { name: "Learner understanding model", status: "current" as const, label: "Current design · deeper implementation later" },
  { name: "Autonomous knowledge acquisition", status: "planned" as const, label: "Planned · P7" },
  { name: "Autonomous interactive construction", status: "planned" as const, label: "Planned · P8" },
  { name: "Playground", status: "later" as const, label: "Later" },
  { name: "Full course / textbook generation", status: "later" as const, label: "Later" },
];

const learningExperience: BlueprintSystem[] = [
  {
    id: "learning-purpose",
    number: "02",
    title: "Learning purpose system",
    purpose: "Turn the learner's reason for learning into a genuine change in experience structure, not a wording change.",
    target: [
      "Offer four purposes: I'm curious, I want to understand this, I'm revising, and I have a test.",
      "Purpose decides the teaching strategy. It changes the starting assumption, sequence, explanation, activity and evidence strategy.",
      "Revising and I have a test assume prior exposure—not perfect understanding.",
      "Combine purpose with depth, knowledge structure and evidence when composing the lesson.",
    ],
    status: "current",
    statusLabel: "Current design work",
    prototype: "P6 foundation · P6.5 refinement",
    principles: ["Purpose determines how we teach.", "The four modes remain distinct even when they share content.", "Do not give every purpose the same amount of initial explanation."],
    questions: ["How strongly should purpose alter the scene, sequence and assessment density?"],
    strategies: [
      {
        title: "I'm curious",
        assumption: "The learner may know nothing and mainly wants to understand the interesting or core idea.",
        behaviours: ["Intuitive first", "Low technical overload", "Discovery and exploration", "Only essential terminology", "Fewer formal exercises", "Optional deeper detail", "Do not reveal every aspect of the topic immediately"],
      },
      {
        title: "I want to understand this",
        assumption: "The learner may know nothing and wants proper understanding.",
        behaviours: ["Build from foundations", "Cover all important concepts needed for genuine understanding", "Progressive introduction", "Guided learning", "Multiple representations where useful", "Explanations, activities and application", "Introduce technical detail when it becomes meaningful"],
      },
      {
        title: "I'm revising",
        assumption: "The learner has studied the topic before, but prior exposure does not imply perfect understanding.",
        behaviours: ["Do not reteach everything automatically", "Begin with diagnostic evidence", "Assume prior exposure", "Skip knowledge already demonstrated", "Identify weak or forgotten concepts", "Reteach only the relevant gaps", "Use more recall, connections and focused practice"],
      },
      {
        title: "I have a test",
        assumption: "The learner should already know the material and wants to prepare or verify readiness; gaps may still exist.",
        behaviours: ["Minimal introductory teaching", "Diagnostic checks early", "Precise factual knowledge", "Application", "Transfer", "Stronger focus activities", "Exam or test-style reasoning where appropriate", "Explanation mainly appears when evidence reveals a gap"],
      },
    ],
  },
  {
    id: "depth",
    number: "03",
    title: "Depth system",
    purpose: "Decide how far and how deep the chosen teaching strategy goes.",
    target: ["Keep Quick look, Learn it and Go deep.", "Depth modifies the chosen purpose; it does not replace the purpose strategy.", "Make every purpose + depth pairing meaningfully different."],
    status: "current",
    statusLabel: "Current design work",
    prototype: "P6 foundation · P6.5 refinement",
    principles: ["Depth determines how far we go.", "Depth affects representations, evidence and application—not merely lesson length."],
    questions: ["What is the minimum evidence required at each depth?"],
    examples: [
      { label: "Quick look", items: ["Core idea", "Concise explanation", "One or two useful interactions", "Very low friction"] },
      { label: "Learn it", items: ["Full normal learning experience", "Guided understanding", "Several kinds of evidence", "At least one meaningful application"] },
      { label: "Go deep", items: ["Richer representations", "Mechanism", "Additional connections", "More challenging application", "Extensions", "Optional open exploration"] },
      { label: "Curious + Quick look", items: ["Fast intuitive overview"] },
      { label: "Curious + Go deep", items: ["Starts intuitive", "Gradually becomes technically rich"] },
      { label: "Understand + Quick look", items: ["Proper foundation", "Only essential concepts"] },
      { label: "Understand + Go deep", items: ["Comprehensive conceptual learning", "Comprehensive technical learning"] },
      { label: "Revise + Quick look", items: ["Rapid diagnostic", "Targeted refresh"] },
      { label: "Revise + Go deep", items: ["Deeper diagnostic", "Targeted remediation", "Harder application"] },
      { label: "Test + Quick look", items: ["Fast readiness check"] },
      { label: "Test + Go deep", items: ["Extensive exam-style assessment", "Application", "Transfer"] },
    ],
  },
  {
    id: "lesson-structure",
    number: "04",
    title: "Lesson structure system",
    purpose: "Let the structure of the knowledge and the learner determine useful stages instead of enforcing one universal template.",
    target: ["AI decides which learning stages are useful.", "Stages may be omitted when unnecessary.", "Structure responds to knowledge, purpose, depth, prerequisites, evidence and available representations."],
    status: "exists",
    statusLabel: "Foundation exists",
    prototype: "P6",
    principles: ["There is no mandatory exercise phase.", "Completed work normally remains fixed while unfinished work can recompose."],
    questions: ["Which stages are universal primitives and which belong to subject-specific design?"],
    examples: [
      { label: "Concept discovery", items: ["Discover", "Predict", "Manipulate", "Notice", "Formalize", "Apply"] },
      { label: "History", items: ["Story", "Timeline", "Causes", "Evidence", "Competing interpretations"] },
      { label: "Computing", items: ["Problem", "Algorithm trace", "Debugging", "Explanation", "Construction"] },
    ],
  },
  {
    id: "freedom",
    number: "11",
    title: "Freedom system",
    purpose: "Match learner freedom to the pedagogical purpose of the moment.",
    target: ["Guided learning controls attention while introducing knowledge.", "Guided challenge provides an objective without prescribing the method.", "Playground enables open exploration as a separate, later mode."],
    status: "current",
    statusLabel: "Current design work",
    prototype: "P6.5 · Playground later",
    principles: ["Guided challenge should become an important Curiosity Lab activity style.", "Playground never replaces structured learning."],
    questions: ["How much freedom should a guided challenge provide?"],
    examples: [
      { label: "Guided learning", items: ["Strict", "System may say: Close the switch."] },
      { label: "Guided challenge", items: ["Constrained freedom", "Make the current equal 1.5 A without changing the battery."] },
      { label: "Playground / sandbox", items: ["Experiment", "Manipulate", "Build", "Ask personal questions", "Explore consequences"] },
    ],
  },
  {
    id: "lesson-conclusion",
    number: "20",
    title: "Lesson conclusion",
    purpose: "Conclude with a useful account of learning rather than only a score.",
    target: ["Summarize what the learner discovered, did, demonstrated, needed support with, can apply and has added to the reference.", "Test mode may additionally show scores or results where useful."],
    status: "current",
    statusLabel: "Current design work",
    prototype: "P6.5",
    principles: ["Evidence should tell a learning story rather than collapse into one percentage."],
    questions: ["Which conclusion elements help the learner decide what to do next?"],
  },
];

const activities: BlueprintSystem[] = [
  {
    id: "activity-vocabulary",
    number: "08",
    title: "Learning activity system",
    purpose: "Create a broad vocabulary of things learners can do, not a product reduced to exercises.",
    target: ["Select activity families because they fit the knowledge and evidence need.", "Keep multiple choice, short response, matching, calculation and ordering available without making them automatic defaults."],
    status: "current",
    statusLabel: "Current design work",
    prototype: "P6.5",
    principles: ["Activities can teach, reveal evidence, or both.", "Meaningful doing is preferred when the knowledge supports it."],
    questions: ["Which activity primitives are universal enough for the core vocabulary?"],
    examples: [
      { label: "Activity families", items: ["Discover / Explore", "Predict / Test", "Manipulate / Build", "Compare / Connect", "Recall / Identify", "Apply / Solve", "Evidence / Reason", "Repair / Debug", "Create / Demonstrate", "Transfer"] },
    ],
  },
  {
    id: "casual-activities",
    number: "09",
    title: "Casual activity system",
    purpose: "Embed low-friction activity inside learning to maintain engagement and collect concept evidence.",
    target: ["Help the learner notice relationships and check main conceptual understanding without feeling like a test."],
    status: "current",
    statusLabel: "Current design work",
    prototype: "P6.5",
    principles: ["Casual describes an activity's purpose, not its technical format."],
    questions: ["How often can casual evidence appear before it starts to feel like constant quizzing?"],
    examples: [{ label: "Examples", items: ["Make a prediction", "Identify what changed", "Manipulate one value", "Compare two situations", "Connect cause and effect", "Quick recall", "Small calculation", "Order a short process", "Choose relevant evidence"] }],
  },
  {
    id: "focus-activities",
    number: "10",
    title: "Focus activity system",
    purpose: "Ask the learner to demonstrate stronger understanding in a dedicated activity.",
    target: ["Use missions, investigations, builds, transfer and reasoning when appropriate.", "Include precise recall where it is genuinely part of the learning goal."],
    status: "current",
    statusLabel: "Current design work",
    prototype: "P6.5",
    principles: ["Focus does not mean memorization.", "In history, focus may test dates and people or require an evidence-based explanation."],
    questions: ["What threshold of evidence should a focus activity establish?"],
    examples: [{ label: "Examples", items: ["Mission", "Target challenge", "Investigation", "Build task", "Repair / debug", "Multi-step problem", "Transfer challenge", "Evidence analysis", "Design challenge", "Constructed explanation", "Precise factual recall"] }],
  },
];

const displayAndExplanation: BlueprintSystem[] = [
  {
    id: "continuous-canvas",
    number: "05",
    title: "Continuous learning canvas",
    purpose: "Replace the PowerPoint feeling with a persistent scene that grows as understanding develops.",
    target: ["Keep a meaningful object or knowledge structure present.", "New knowledge can attach to an object, appear beside it, transform the representation, add evidence, introduce a comparison or extend the existing scene.", "Retain completed evidence when pedagogically useful."],
    status: "current",
    statusLabel: "Current design work",
    prototype: "P1 reference · P6.5 refinement",
    principles: ["The scene evolves rather than constantly being replaced."],
    questions: ["How persistent should the canvas be across very different concepts?", "How can adaptive scene changes avoid visual chaos?"],
    examples: [
      { label: "Across subjects", items: ["Physics: circuit with measurements, graph, formula and challenges", "Biology: cell or process with structures and mechanisms", "History: timeline, map or event network with people and evidence", "Computing: algorithm or data structure as execution progresses", "Geography: map or system as conditions change"] },
    ],
  },
  {
    id: "information-display",
    number: "06",
    title: "Information display system",
    purpose: "Reveal information progressively at the moment it becomes meaningful.",
    target: ["Level 1: always-visible orientation, such as Battery · 9 V or Resistor · 4 Ω.", "Level 2: contextual explanation when the concept matters.", "Level 3: optional depth through Why?, Explain this, Show more, click or appropriate hover."],
    status: "current",
    statusLabel: "Current design work",
    prototype: "P6.5",
    principles: ["Essential learning never depends on hover.", "Optional depth may include definitions, mechanism, units, related ideas and additional examples."],
    questions: ["How should purpose and depth alter the three information levels?"],
  },
  {
    id: "explanation",
    number: "07",
    title: "Explanation system",
    purpose: "Connect explanation directly to the phenomenon whenever possible.",
    target: ["Prefer object → learner action → visible consequence → concise explanation over paragraph → exercise.", "Use attached labels, animation, relationships, comparisons, diagrams, observations, worked examples, graphs, timelines, maps, cause/effect structures or concise text."],
    status: "current",
    statusLabel: "Current design work",
    prototype: "P1 reference · P6.5 refinement",
    principles: ["Do not eliminate text; use the representation best suited to the knowledge.", "Formal terminology and formulas often follow intuitive context."],
    questions: ["When is text genuinely the strongest representation?"],
  },
  {
    id: "cross-subject",
    number: "21",
    title: "Cross-subject representation system",
    purpose: "Give different knowledge structures the learning forms they need.",
    target: ["Ask whether the knowledge can be learned through meaningful doing.", "If it cannot, ask whether the knowledge itself can be made explorable.", "Never force fake simulations onto unsuitable topics."],
    status: "current",
    statusLabel: "Current design work",
    prototype: "P4 proof · P6.5 refinement",
    principles: ["Representation follows knowledge structure, not a preferred interface pattern."],
    questions: ["How can non-simulation subjects receive equally strong experiences?"],
    examples: [
      { label: "Physics / Chemistry", items: ["Simulation", "Experiments", "Variables", "Graphs", "Prediction", "Building"] },
      { label: "Biology", items: ["Diagrams", "Processes", "Sequences", "Classifications", "Comparisons", "Appropriate simulations"] },
      { label: "History", items: ["Timelines", "Maps", "Event networks", "Cause and consequence", "People and factions", "Evidence", "Primary sources", "Competing interpretations", "Before/after views"] },
      { label: "Computing", items: ["Algorithm traces", "Code execution", "Debugging", "Data structures", "Building", "Sequencing"] },
      { label: "Geography", items: ["Maps", "Systems", "Changing conditions", "Comparison", "Process representation"] },
      { label: "Language / Literature", items: ["Annotation", "Structure", "Examples", "Comparison", "Interpretation", "Sequencing", "Evidence"] },
    ],
  },
];

const learnerUnderstanding: BlueprintSystem[] = [
  {
    id: "learner-understanding",
    number: "12",
    title: "Learner understanding system",
    purpose: "Estimate temporary, concept-specific understanding from varied evidence rather than one score or permanent label.",
    target: ["Track predictions, actions, variables, attempts, irrelevant actions, self-correction, hints, comparisons, activities, transfer, confusion and recovery.", "Represent broad states such as strong evidence, supported, uncertain, misconception evidence and prerequisite uncertainty."],
    status: "current",
    statusLabel: "Current design · deeper implementation later",
    prototype: "P2 evidence foundation · P6.5 design",
    principles: ["Do not infer intelligence, personality, visual-learner labels or fixed ability.", "Only infer evidence related to current knowledge."],
    questions: ["What evidence is strong enough to claim a concept is understood?"],
    examples: [{ label: "Resistance–current concept state", items: ["✓ Correctly manipulated resistance", "✓ Predicted decreasing current", "? Explanation not demonstrated", "✗ Failed transfer with changed voltage", "✓ Recovered after comparison"] }],
  },
  {
    id: "adaptation-detection",
    number: "13",
    title: "Adaptation detection system",
    purpose: "Turn observable learner behaviour into a cautious estimate and decide when more evidence is needed.",
    target: ["Collect natural evidence during interaction.", "Insert a small diagnostic probe when evidence is uncertain.", "Accept explicit confusion and contextual questions."],
    status: "current",
    statusLabel: "Current design work",
    prototype: "P2 evidence foundation · P6.5 design",
    principles: ["The system cannot magically know what a learner understands.", "Do not constantly quiz."],
    questions: ["How frequently should diagnostic probes appear?", "How can explicit confusion avoid disrupting the lesson?"],
    flow: ["Observe", "Estimate understanding", "If uncertain, probe", "Identify likely issue", "Adapt", "Observe again"],
    examples: [
      { label: "Signals", items: ["Natural evidence", "Diagnostic: What do you think will happen?", "Diagnostic: Try to make X happen.", "I don't understand this", "Why?", "Explain this", "Show me differently", "Contextual question"] },
    ],
  },
];

const adaptation: BlueprintSystem[] = [
  {
    id: "adaptation",
    number: "14",
    title: "Adaptation system",
    purpose: "Change the experience in response to concept evidence, using wording only when wording is the actual problem.",
    target: ["Prefer, in rough order: representation, activity, scene complexity, guidance, sequence, depth and wording.", "Keep completed work fixed and normally recompose only unfinished learning."],
    status: "current",
    statusLabel: "Current design work",
    prototype: "P2/P3/P4 foundations · P6.5 refinement",
    principles: ["Struggling learners may see fewer distractions, frozen irrelevant variables and highlighted objects.", "Strong progress may unlock variables, increase complexity, skip basics or add depth."],
    questions: ["When should the system switch representation rather than add support?"],
    examples: [
      { label: "Representation", items: ["Circuit → comparison → graph → simplified visual"] },
      { label: "Activity", items: ["Failed prediction → comparison", "Easy success → transfer mission"] },
      { label: "Support ladder", items: ["Independent", "Small cue", "Highlight", "Directional question", "Comparison", "Guided support"] },
    ],
  },
  {
    id: "adaptation-size",
    number: "15",
    title: "Adaptation size",
    purpose: "Match the scale of change to the evidence rather than overreacting.",
    target: ["Micro: highlight, short hint, small label or slight wording change.", "Medium: new comparison, different activity, constrained controls or additional visual support.", "Major: representation switch, prerequisite branch or substantial unfinished-path recomposition."],
    status: "current",
    statusLabel: "Current design work",
    prototype: "P6.5",
    principles: ["Use the smallest adaptation likely to address the evidence."],
    questions: ["What evidence should trigger movement from micro to medium or major adaptation?"],
  },
  {
    id: "scene-transformation",
    number: "16",
    title: "Scene transformation",
    purpose: "Make adaptation visible in the interface when seeing the change helps the learner recover.",
    target: ["For resistance/current: shift one circuit, reveal a comparison circuit, highlight equal voltage and different resistance, then make the current difference visible.", "After recovery, collapse the comparison, keep the main circuit and continue."],
    status: "current",
    statusLabel: "Current design work",
    prototype: "P6.5",
    principles: ["The learner should sometimes be able to see that the lesson adapted.", "Avoid dramatic changes after every mistake."],
    questions: ["How do we prevent adaptive scene changes from becoming visually chaotic?"],
    flow: ["One circuit", "Comparison appears", "Relevant values highlighted", "Difference becomes visible", "Recovery", "Comparison collapses", "Main lesson continues"],
  },
];

const reference: BlueprintSystem[] = [
  {
    id: "side-learning",
    number: "17",
    title: "Side-learning system",
    purpose: "Let related curiosity branch temporarily without losing the learner's place in the main lesson.",
    target: ["Support main lesson → related branch → explanation or activity → exact return point.", "Preserve original lesson state.", "Use P7 later when the side question exceeds current trusted knowledge."],
    status: "current",
    statusLabel: "Experience designed · knowledge expansion planned",
    prototype: "P6.5 · P7 later supplies knowledge",
    principles: ["Learning should not be trapped inside the predefined lesson path."],
    questions: ["When should a side question become a branch rather than a small contextual explanation?"],
    examples: [{ label: "Example", items: ["Main topic: resistance/current", "Learner: Why does a battery create voltage?"] }],
  },
  {
    id: "contextual-help",
    number: "18",
    title: "Contextual help / assistant system",
    purpose: "Provide help that understands and can alter the current learning context instead of acting like a text-heavy chatbot.",
    target: ["Understand the scene, selected object, objective, evidence, concept and previous actions.", "Respond with concise text, highlight, diagram, comparison, tiny activity, graph, demonstration, diagnostic question or side-learning branch."],
    status: "later",
    statusLabel: "Later vision",
    prototype: "Later capability",
    principles: ["Chat when conversation is useful. Interact when interaction teaches better."],
    questions: ["Which contextual responses need new trusted representations rather than text?"],
  },
  {
    id: "progressive-reference",
    number: "19",
    title: "Progressive reference / textbook system",
    purpose: "Build a clean, structured record of knowledge as it is introduced or discovered.",
    target: ["Add learned concepts to My Lesson or Reference.", "Include definitions, explanations, diagrams, formulas, graphs, timelines, names, dates, examples, relationships, learner-produced evidence and summaries.", "Keep the learning canvas primary."],
    status: "current",
    statusLabel: "Current design work",
    prototype: "P6.5 · course generation later",
    principles: ["Do not necessarily present the entire textbook before learning.", "The reference records knowledge; it is not the main learning interface."],
    questions: ["How much should be learner-generated evidence versus canonical explanation?"],
  },
];

const aiBuilder: BlueprintSystem[] = [
  {
    id: "autonomous-design",
    number: "22",
    title: "Autonomous lesson design",
    purpose: "Use AI to design the complete learning experience from trusted knowledge and controlled capabilities.",
    target: ["Decide stages, sequence, primitive selection, dependencies, support, extensions, grounded explanation and goal-specific design.", "Eventually reason across every system in this blueprint."],
    status: "exists",
    statusLabel: "Foundation exists",
    prototype: "P6",
    principles: ["P6.5 refines the design vocabulary future AI lessons should use."],
    questions: ["How should the designer balance all blueprint systems without producing overloaded lessons?"],
  },
  {
    id: "knowledge-acquisition",
    number: "23",
    title: "Autonomous knowledge acquisition",
    purpose: "Let the system obtain trustworthy knowledge when a learner simply asks to learn something.",
    target: ["Plan research, search, select trustworthy sources, read, extract, preserve provenance, compare sources, handle conflict and uncertainty, and construct canonical knowledge.", "Feed canonical knowledge into the lesson designer."],
    status: "planned",
    statusLabel: "Planned",
    prototype: "P7",
    principles: ["P7 answers: Can the system obtain the knowledge itself?"],
    questions: ["How should source trust, relevance, disagreement and freshness be evaluated?"],
  },
  {
    id: "interactive-construction",
    number: "24",
    title: "Autonomous interactive construction",
    purpose: "Create missing learning representations without executing arbitrary AI-generated application code.",
    target: ["Convert representation need into a declarative interaction specification, controlled primitives, deterministic validation, compiler/runtime and executable learning object.", "Level 1: configure an existing high-level primitive.", "Level 2: build from smaller controlled primitives.", "Level 3: preserve an honest representation gap if still impossible."],
    status: "planned",
    statusLabel: "Planned",
    prototype: "P8",
    principles: ["Prefer controlled declarative construction over arbitrary generated React.", "The long-term system should not require humans to pre-program every possible interaction."],
    questions: ["What lower-level construction vocabulary will P8 need?"],
    flow: ["Representation need", "Interaction specification", "Construction primitives", "Deterministic validation", "Compiler/runtime", "Executable learning object"],
  },
];

const futureSystems: BlueprintSystem[] = [
  {
    id: "course-builder",
    number: "25",
    title: "Full textbook / course builder",
    purpose: "Extend the mature lesson architecture into complete courses and structured textbooks.",
    target: ["Support curriculum structure, prerequisite graphs, units, chapters, lesson ordering, progressive reference, interactive sections, exercises, revision, assessments, projects, multi-lesson progress and adaptive course sequencing."],
    status: "later",
    statusLabel: "Later vision",
    prototype: "After P8",
    principles: ["The current system focuses on individual learning experiences.", "Do not implement this now."],
    questions: ["When is the lesson-level architecture mature enough to expand to course-level sequencing?"],
  },
];

export const blueprintPages: BlueprintPage[] = [
  { slug: "learning-experience", eyebrow: "Purpose, depth and structure", title: "Shape the learning journey around the learner.", intro: "Purpose, depth, knowledge structure and evidence determine which stages exist, how much freedom the learner receives and how the experience concludes.", systems: learningExperience },
  { slug: "activities", eyebrow: "Activity vocabulary", title: "Learning is larger than exercises.", intro: "Activities may reveal a relationship, create evidence, build skill or ask for strong demonstration. Their purpose matters more than their technical format.", systems: activities },
  { slug: "display-explanation", eyebrow: "Canvas and representation", title: "Make the concept visible, active and explorable.", intro: "The interface should evolve around a meaningful object or knowledge structure, revealing explanation when it becomes useful.", systems: displayAndExplanation },
  { slug: "learner-understanding", eyebrow: "Evidence and estimation", title: "Understand concepts cautiously, not learners permanently.", intro: "The system observes concept-specific evidence, admits uncertainty and probes sparingly before deciding how to adapt.", systems: learnerUnderstanding },
  { slug: "adaptation", eyebrow: "Response and recovery", title: "Change the learning experience when evidence calls for it.", intro: "Adaptation begins with representation, activity and scene—not automatic paragraph rewriting—and uses the smallest useful change.", systems: adaptation },
  { slug: "reference", eyebrow: "Continuity and knowledge record", title: "Let learning branch, return and accumulate.", intro: "Contextual support can alter the immediate experience while a progressive reference preserves what the learner has learned.", systems: reference },
  { slug: "ai-builder", eyebrow: "AI learning builder", title: "Understand knowledge, design learning, construct what is missing.", intro: "P6, P7 and P8 form distinct layers: design the lesson, obtain the knowledge and construct missing interactive representations.", systems: aiBuilder },
  { slug: "future-systems", eyebrow: "Course-scale future", title: "Extend the engine only after its lesson systems mature.", intro: "Full course and textbook generation remains a later vision, not current implementation scope.", systems: futureSystems },
];

export const openQuestionSeeds = [
  "How persistent should the learning canvas be across very different concepts?",
  "When should the system switch representation versus simply add support?",
  "How much freedom should a guided challenge provide?",
  "What evidence is strong enough to claim a concept is understood?",
  "How should the learner explicitly indicate confusion without disrupting the lesson?",
  "How frequently should diagnostic probes appear?",
  "When should a side question create a branch rather than a small contextual explanation?",
  "How much of the progressive reference should be learner-generated evidence versus canonical explanation?",
  "Which activity primitives are universal enough to belong in the core vocabulary?",
  "What lower-level construction vocabulary will eventually be needed for P8?",
  "How do we prevent adaptive scene changes from becoming visually chaotic?",
  "How do we create equally strong experiences for subjects that are not naturally simulation-based?",
];

export const decisionSeeds = [
  "Purpose determines how we teach. Depth determines how far we go.",
  "Do not expose information simply because it belongs to the topic. Expose it because this learner, with this goal, needs it now.",
  "Revising and I have a test assume prior exposure, not perfect understanding.",
  "Learner purposes do not receive the same amount of initial explanation: curious and understand can begin from no knowledge, while revising and test begin with evidence of prior exposure.",
  "Persistent and evolving scenes are preferred over slide-based lessons.",
  "Essential information must never depend on hover.",
  "Information should be revealed when it becomes meaningful.",
  "Casual and focus describe the purpose of an activity, not its technical format.",
  "Traditional questions remain available but are not the default.",
  "Guided learning, guided challenge and playground are distinct levels of freedom.",
  "Exercises are not mandatory lesson phases.",
  "Adaptation should prefer representation and activity changes over simple text rewriting.",
  "Completed learning should generally remain intact during adaptation.",
  "The system uses concept-specific learner evidence rather than fixed learning-style labels.",
  "Different subjects receive representations appropriate to their knowledge structure.",
  "P7 handles autonomous knowledge acquisition.",
  "P8 handles autonomous construction of missing interactive representations.",
];

export function getBlueprintPage(slug: string) {
  return blueprintPages.find((page) => page.slug === slug);
}
