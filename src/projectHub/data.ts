export type PrototypeStatus = "completed" | "current" | "next" | "later";

export type PrototypeRecord = {
  slug: string;
  number: string;
  name: string;
  statusLabel: string;
  status: PrototypeStatus;
  question: string;
  purpose: string;
  proof: string;
  capabilities: string[];
  limitation?: string;
  demonstration?: string;
  pipeline?: string[];
  sections?: { title: string; intro?: string; items: string[] }[];
  distinction?: { from: string; to: string };
  demoHref?: string;
};

export const northStar = {
  statement:
    "Curiosity Lab is an AI-powered learning system that aims to turn trusted knowledge into interactive, adaptive learning experiences.",
  flow: [
    "Learner asks what they want to learn",
    "System obtains trustworthy knowledge",
    "AI understands the knowledge",
    "AI decides how it should be taught",
    "AI builds or assembles the appropriate learning experience",
    "Learner interacts with it",
    "System gathers evidence of understanding",
    "Lesson adapts",
    "Learner can explore, revise, test or go deeper",
  ],
};

export const principles = [
  {
    title: "Objects are the explanation",
    text: "Text supports them. The system should not primarily behave like a chatbot that generates paragraphs.",
  },
  {
    title: "Change the way the learner learns",
    text: "A chatbot changes its answer. Curiosity Lab changes the way you learn.",
  },
  {
    title: "Discovery before conventional questioning",
    text: "When possible, let the learner discover something by doing rather than asking a conventional question about it.",
  },
  {
    title: "Freedom within a trusted system",
    text: "AI has freedom over learning design while trusted sources, validators, deterministic code and controlled runtimes protect truth and execution.",
  },
];

export const prototypes: PrototypeRecord[] = [
  {
    slug: "prototype-1",
    number: "01",
    name: "Interactive learning experience",
    statusLabel: "Completed",
    status: "completed",
    question: "What could a highly interactive lesson feel like?",
    purpose:
      "Prove what a highly interactive lesson could feel like before worrying about sophisticated AI architecture.",
    demonstration: "Electric circuits",
    proof:
      "A lesson can make objects, actions and visible consequences do most of the explaining, with formal explanation arriving after experience.",
    capabilities: [
      "Object-centred learning",
      "Live circuit interaction",
      "Progressive introduction of concepts",
      "Very little text",
      "Labels attached to actual objects",
      "Visible consequences from learner actions",
      "Guided discovery",
      "Explanation after observation",
      "Formula introduced after the relationship has been experienced",
    ],
    sections: [
      {
        title: "Learning sequence",
        items: ["Experience", "Notice", "Name", "Explain", "Connect", "Apply"],
      },
      {
        title: "Role in the programme",
        items: ["P1 became an important visual and UX reference for later prototypes."],
      },
    ],
    limitation: "The experience was manually designed and largely static.",
    demoHref: "/",
  },
  {
    slug: "prototype-2",
    number: "02",
    name: "Deterministic adaptation",
    statusLabel: "Completed",
    status: "completed",
    question: "Can learner performance produce genuinely different paths?",
    purpose:
      "Prove that two learners can receive different learning paths based on their performance even without real AI.",
    proof: "Different learner outcomes can produce different next activities.",
    capabilities: [
      "Registered learning blocks",
      "Learner evidence",
      "Correctness and attempts",
      "Hint usage",
      "Learner-state calculation",
      "Deterministic candidate selection",
      "Support paths",
      "Challenge paths",
      "Engine trace",
    ],
    limitation: "Lesson structure and adaptation logic were still mostly predefined.",
    demoHref: "/prototype-2",
  },
  {
    slug: "prototype-3",
    number: "03",
    name: "AI lesson composition",
    statusLabel: "Completed · historical step",
    status: "completed",
    question: "Can AI compose a lesson while knowledge and components stay controlled?",
    purpose:
      "Introduce genuine AI composition while keeping knowledge and components controlled.",
    proof:
      "Trusted textbook material could become an AI-composed interactive lesson, including a real recomposition after learner evidence.",
    capabilities: [
      "Selection from registered learning components",
      "Composition by learner goal",
      "Composition by available depth and time",
      "Response to learner evidence",
      "Preservation of completed activities",
      "A stronger before/after: static textbook to interactive environment",
    ],
    pipeline: ["Trusted textbook material", "AI-composed interactive lesson"],
    limitation:
      "The AI still depended heavily on manually prepared curriculum and registered components.",
    demoHref: "/prototype-3",
  },
  {
    slug: "prototype-4",
    number: "04",
    name: "Generalized learning composer",
    statusLabel: "Completed",
    status: "completed",
    question: "Is the architecture genuinely reusable across subjects?",
    purpose: "Prove the system was not secretly just a hard-coded circuit lesson.",
    demonstration: "Physics: resistance/current · Biology: cell membrane transport",
    proof:
      "The same composition architecture worked across two domains and could recompose unfinished work while completed work remained fixed.",
    capabilities: [
      "Prediction",
      "Parameter experiment",
      "Comparison",
      "Data plot",
      "Classification",
      "Step sequence",
      "Evidence reveal",
      "Target challenge",
    ],
    sections: [
      {
        title: "Architecture principle",
        items: [
          "Human and trusted content = knowledge",
          "AI = composition",
          "Deterministic code = truth, evidence and safety",
          "Components = interaction vocabulary",
          "Runtime = execution",
        ],
      },
    ],
    limitation: "Learning blocks still had to be manually registered beforehand.",
    demoHref: "/prototype-4",
  },
  {
    slug: "prototype-5",
    number: "05",
    name: "Source-grounded learning compiler",
    statusLabel: "Completed",
    status: "completed",
    question: "Can a new trusted source become an interactive learning system?",
    purpose: "Remove the requirement that every lesson's blocks be manually prepared.",
    demonstration: "Chemistry: how concentration affects reaction rate",
    proof:
      "A new approved source can be analysed, reviewed and compiled into a registered learning-block catalogue with source facts retaining provenance.",
    capabilities: [
      "Concept, fact and relationship proposals",
      "Objectives and prerequisites",
      "Misconceptions",
      "Source-fact provenance",
      "Human knowledge approval",
      "Human representation approval",
      "Signed lessons",
      "Evidence-driven recomposition",
    ],
    pipeline: [
      "Trusted source",
      "AI source analysis",
      "Provenance validation",
      "Human knowledge approval",
      "Deterministic legal representation candidates",
      "AI representation selection",
      "Human representation approval",
      "Deterministic block compilation",
      "Signed lesson",
      "AI lesson composition",
      "Learner interaction",
      "Evidence-driven recomposition",
    ],
    sections: [
      {
        title: "Architecture correction",
        intro:
          "AI invented a plausible but nonexistent table ID. The system was corrected instead of accepting the invention.",
        items: [
          "AI output is treated as untrusted.",
          "Deterministic code constructs legal, source-grounded candidates.",
          "AI chooses among valid possibilities instead of inventing factual IDs.",
        ],
      },
    ],
    distinction: {
      from: "P4: AI chooses manually prepared activities.",
      to: "P5: A new trusted source can become a compiled interactive learning system.",
    },
    limitation: "AI still had limited freedom over the actual pedagogical design.",
    demoHref: "/prototype-5",
  },
  {
    slug: "prototype-6",
    number: "06",
    name: "Autonomous lesson designer",
    statusLabel: "Completed and frozen",
    status: "completed",
    question: "Can AI design complete lessons from generic trusted capabilities?",
    purpose:
      "Move AI from choosing prepared activities to designing the complete lesson from generic trusted capabilities.",
    proof:
      "AI can design the stages, sequence and pedagogical roles of a complete lesson while deterministic systems retain control of truth, validation and execution.",
    capabilities: [
      "Variable manipulation",
      "Cause-effect observation",
      "Quantitative trend",
      "Directional reasoning",
      "Contrast",
      "Spatial representation",
      "Deterministic application",
      "Transfer generalization",
      "Operational representation gaps",
    ],
    pipeline: [
      "Trusted knowledge + generic capabilities",
      "AI designs complete lesson blueprint",
      "Strict validation",
      "Deterministic compilation",
      "Interactive lesson",
      "Learner evidence",
      "Recomposition of unfinished lesson",
    ],
    sections: [
      {
        title: "Gemini decides",
        items: [
          "Which learning stages should exist",
          "Which generic primitive each stage uses",
          "Initial sequence and dependencies",
          "Core, support and extension roles",
          "Facts introduced, delayed or omitted",
          "Approved interaction variables and values",
          "Concise grounded explanations, instructions and feedback",
          "Alternative support stages",
          "Changes for Explore, Understand, Revise and Test",
        ],
      },
      {
        title: "Gemini cannot",
        items: [
          "Generate executable HTML, React, CSS or SVG",
          "Invent facts, units, variables or data",
          "Calculate authoritative answers",
          "Bypass validation",
          "Modify completed stages",
          "Declare learner mastery",
        ],
      },
      {
        title: "Deterministic systems control",
        items: [
          "Truth and calculations",
          "Validation and compilation",
          "Signing",
          "Learner evidence",
          "Execution and rendering",
        ],
      },
      {
        title: "Representation gaps",
        intro:
          "An objective may either be represented by valid stages or declare that a genuinely required capability does not currently exist.",
        items: ["P6 identifies the gap. P8, not P6, is intended to solve it."],
      },
      {
        title: "Closure evidence",
        items: [
          "12 live Gemini generations across four learning goals",
          "10 of 12 passed strict validation",
          "All accepted designs compiled",
          "Invalid designs were rejected rather than hidden by lesson fallbacks",
          "All goal pairings demonstrated structural differences",
          "83 tests passed",
          "P6 is frozen",
        ],
      },
    ],
    distinction: {
      from: "P4: AI chooses prebuilt activities.",
      to: "P6: AI designs activities and complete lessons from generic trusted capabilities.",
    },
    limitation:
      "The system now needs a stronger definition of what a good Curiosity Lab learning experience should be.",
  },
  {
    slug: "prototype-7",
    number: "07",
    name: "Autonomous knowledge acquisition",
    statusLabel: "Planned next",
    status: "next",
    question: "What if the learner does not provide the textbook or source at all?",
    purpose:
      "Obtain trustworthy knowledge autonomously, then hand a canonical knowledge specification to the P6 lesson designer.",
    demonstration: "Learner request: “Teach me how airplane wings generate lift.”",
    proof: "Not yet tested. This is the next planned prototype.",
    capabilities: [
      "Autonomous research planning",
      "Candidate-source discovery and selection",
      "Per-source extraction",
      "Provenance validation",
      "Multi-source synthesis",
      "Disagreement and uncertainty handling",
      "Canonical knowledge specification",
      "Freshness-aware information",
    ],
    pipeline: [
      "Learner question",
      "Autonomous research planning",
      "Web/search provider",
      "Candidate sources",
      "Trustworthy and relevant source selection",
      "Source reading",
      "Per-source extraction",
      "Provenance validation",
      "Multi-source synthesis",
      "Disagreement and uncertainty handling",
      "Canonical knowledge specification",
      "P6 lesson designer",
      "Interactive lesson",
    ],
    sections: [
      {
        title: "Non-negotiable boundaries",
        intro: "P7 obtains knowledge. P6 decides how to teach it.",
        items: [
          "Preserve citations and provenance",
          "Distinguish source knowledge from AI pedagogical proposals",
          "Merge duplicates conservatively",
          "Detect disagreements",
          "Preserve uncertainty",
          "Refuse to invent missing knowledge",
          "Support current information when freshness matters",
        ],
      },
    ],
    limitation:
      "If a suitable learning representation does not exist, P7 must declare a representationGap; it must not build the missing representation.",
  },
  {
    slug: "prototype-8",
    number: "08",
    name: "Autonomous interactive construction",
    statusLabel: "Planned later",
    status: "later",
    question:
      "What happens when the right interactive learning object does not exist?",
    purpose:
      "Allow AI to construct new interactive learning objects without giving it permission to generate and execute arbitrary application code.",
    proof: "Not yet tested. This is a later planned prototype.",
    capabilities: [
      "Simulations",
      "Specialized diagrams",
      "New experiments",
      "Process visualizations",
      "Interactive models",
      "Approved reusable capabilities",
    ],
    pipeline: [
      "Learning requirement",
      "AI creates declarative interaction specification",
      "Construction primitives",
      "Deterministic validation",
      "Compiler/runtime",
      "Executable learning object",
      "Testing",
      "Approved reusable capability",
    ],
    sections: [
      {
        title: "Layered construction",
        items: [
          "Use an existing high-level learning primitive when it is sufficient.",
          "If not, construct from lower-level visual and interactive primitives.",
          "If still impossible, preserve the representation gap rather than faking an interaction.",
        ],
      },
    ],
    limitation:
      "This capability is deliberately deferred until knowledge acquisition and lesson design are mature.",
  },
];

export const designLanguage = [
  {
    id: "display",
    letter: "A",
    title: "Display",
    summary: "Build a persistent, evolving canvas—not a slide deck.",
    body: [
      "Move away from slide → next → exercise → next → quiz.",
      "Something important usually remains visible while knowledge grows around it. The scene evolves rather than constantly being replaced.",
    ],
    items: [
      "Physics: circuit",
      "History: timeline, map or event network",
      "Biology: cell or process",
      "Computing: algorithm or data structure",
    ],
  },
  {
    id: "reference",
    letter: "B",
    title: "Progressive reference / textbook",
    summary: "Record what has been learned instead of front-loading a textbook.",
    body: [
      "Do not dump the entire textbook at the learner before learning begins. Progressively construct a clean reference as concepts are learned.",
      "The reference is not the main learning interface. It records what has been learned and may later develop into autonomous textbook or course creation.",
    ],
    items: [
      "Explanations and definitions",
      "Diagrams and formulas",
      "Dates, names and relationships",
      "Learner-created evidence and graphs",
      "Examples and summaries",
    ],
  },
  {
    id: "reveal",
    letter: "C",
    title: "Information reveal",
    summary: "Explain information when it becomes meaningful.",
    body: [
      "Use three levels: always-visible orientation (for example, Battery · 9 V), contextual explanation when the object becomes meaningful, and optional deeper information through Why?, Explain this, hover or click.",
      "Essential information must never require hover. Goal and depth affect how much information is revealed.",
    ],
    items: ["Do not explain something merely because it exists. Explain it when it becomes meaningful."],
  },
  {
    id: "explanation",
    letter: "D",
    title: "Explanation",
    summary: "Experience first; terminology follows understanding.",
    body: [
      "Prefer object → action → visible consequence → short contextual explanation over a large explanatory paragraph followed by an exercise.",
      "Formal terminology should often arrive after intuitive understanding.",
    ],
    items: [],
  },
  {
    id: "activities",
    letter: "E",
    title: "Learning activities",
    summary: "Use a broad activity vocabulary, not only exercises.",
    body: [
      "Conventional multiple-choice and short-answer questions remain available when genuinely appropriate. They should not be the default simply because they are easy to build.",
    ],
    items: [
      "Discover / Explore",
      "Predict / Test",
      "Manipulate / Build",
      "Compare / Connect",
      "Recall / Identify",
      "Apply / Solve",
      "Evidence / Reason",
      "Create / Demonstrate",
    ],
  },
  {
    id: "casual-focus",
    letter: "F",
    title: "Casual vs focus activities",
    summary: "Gather light evidence naturally; reserve focus activities for clear demonstration.",
    body: [
      "Casual activities are short and embedded naturally: prediction, tiny comparison, small manipulation, cause/effect connection, identifying a change, quick recall or a mini calculation.",
      "Focus activities are dedicated demonstrations: mission, target challenge, build, repair/debug, investigation, multi-step problem, transfer challenge, evidence reasoning, design challenge or precise recall where appropriate.",
      "Focus does not mean memorisation only. In history, casual work may examine causes and consequences; focus may test precise facts or deeper source and evidence reasoning.",
    ],
    items: [],
  },
  {
    id: "freedom",
    letter: "G",
    title: "Three levels of freedom",
    summary: "Match learner freedom to the purpose of the moment.",
    body: [],
    items: [
      "Guided learning — strict direction when introducing a concept.",
      "Guided challenge — a goal with constrained freedom, without prescribing the exact solution. This should become a major Curiosity Lab activity style.",
      "Playground / sandbox — optional open experimentation for personal questions; never a replacement for structured learning.",
    ],
  },
  {
    id: "goal",
    letter: "H",
    title: "Goal",
    summary: "The learner's purpose must change structure and pedagogy—not merely wording.",
    body: [],
    items: ["I'm curious", "I want to understand this", "I'm revising", "I have a test"],
  },
  {
    id: "depth",
    letter: "I",
    title: "Depth",
    summary: "Goal and depth combine to produce meaningfully different lessons.",
    body: ["Curious + Quick look is fundamentally different from Test + Go deep."],
    items: ["Quick look", "Learn it", "Go deep"],
  },
  {
    id: "adaptation",
    letter: "J",
    title: "Adaptation",
    summary: "Change the experience before merely rewriting the text.",
    body: [
      "Preferred dimensions, in order: representation, activity, scene complexity, guidance, sequence, depth and wording.",
      "If resistance and current are misunderstood, move from one circuit to side-by-side circuits, highlight relevant values, ask the learner to compare, then return to the main scene after recovery.",
      "Use the smallest adaptation likely to solve the problem.",
    ],
    items: [
      "Micro — hint, highlight or label",
      "Medium — comparison, constrained controls or a different activity",
      "Major — different representation, prerequisite branch or substantial unfinished-path recomposition",
    ],
  },
  {
    id: "detection",
    letter: "K",
    title: "Adaptation detection",
    summary: "Use interaction evidence, small probes and explicit learner signals.",
    body: [
      "Do not rely only on occasional quiz questions. When evidence is uncertain, insert a tiny targeted diagnostic probe rather than quizzing constantly.",
      "Allow contextual signals: I don't understand this, Why?, Explain this and Show me another way.",
      "Understanding remains concept-specific. Do not pretend to know permanent traits such as intelligence or learning style.",
    ],
    items: [
      "Natural evidence: controls changed, predictions and repeated attempts",
      "Natural evidence: irrelevant-variable manipulation and self-correction",
      "Natural evidence: hint use, transfer failure and recovery",
      "Targeted diagnostic probes",
      "Explicit learner signals",
    ],
  },
  {
    id: "side-learning",
    letter: "L",
    title: "Side learning",
    summary: "Support temporary related branches, then return to the main path.",
    body: [
      "A learner studying resistance and current may ask why the battery creates voltage. Support main path → related explanation → return to main path.",
      "P6.5 defines this experience. P7 will later allow missing knowledge for these branches to be obtained autonomously.",
    ],
    items: [],
  },
  {
    id: "cross-subject",
    letter: "M",
    title: "Cross-subject learning",
    summary: "Match the representation to the structure of the knowledge.",
    body: [
      "Do not force circuit-style simulations onto every topic. If a concept can be learned through doing, prefer meaningful interaction. If it cannot, make the knowledge itself explorable.",
    ],
    items: [
      "History: timeline",
      "History: map",
      "History: cause/effect network and changing states",
      "History: evidence and perspectives",
      "History: people and faction relationships",
    ],
  },
];

export const decisions = [
  "The Project Hub currently covers only the core Course / Learning Builder.",
  "The roadmap is organized in prototype order.",
  "P1 remains the visual and experience reference.",
  "P6 is completed and frozen.",
  "P6.5 is a design and pedagogy refinement, not an autonomous knowledge system.",
  "P7 obtains knowledge; P6 decides how to teach it.",
  "P7 declares representation gaps instead of constructing missing representations.",
  "P8 uses declarative specifications, controlled primitives, validation and a compiler/runtime—not arbitrary generated application code.",
  "Full textbook and course construction is a later milestone, outside P6.5, P7 and P8.",
];

export const openQuestions = [
  "What does the learner actually see, do, discover and understand?",
  "What makes a Curiosity Lab lesson good across very different subjects?",
  "How should goal and depth change the structure—not just the wording—of a lesson?",
  "What evidence is sufficient before the system adapts, and at what scale?",
  "How should trustworthy sources be selected and disagreements preserved in P7?",
  "Which declarative construction primitives are safe and expressive enough for P8?",
];

export const parkedCapabilities = [
  "Full textbook and course builder",
  "Deeper learner-system expansion",
];

export const courseBuilderExpansion = [
  "Units",
  "Chapters",
  "Concept-dependency progression",
  "Reference material",
  "Interactive sections",
  "Activities",
  "Revision",
  "Assessments",
  "Projects",
  "Progression across lessons",
];

export function getPrototype(slug: string) {
  return prototypes.find((prototype) => prototype.slug === slug);
}
