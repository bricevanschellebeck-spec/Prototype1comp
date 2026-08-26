import type { PrimitiveFactoryDescription } from "./types";

export const primitiveFactoryCatalog: PrimitiveFactoryDescription[] = [
  { primitiveId: "prediction", purpose: "Elicit a learner model for an approved relationship before revealing the result.", allowedConfigKind: "prediction" },
  { primitiveId: "parameter-experiment", purpose: "Select trusted table rows through a discrete input control and observe the recorded output.", allowedConfigKind: "parameter-experiment" },
  { primitiveId: "comparison", purpose: "Compare approved rows and columns without inventing values.", allowedConfigKind: "comparison" },
  { primitiveId: "data-plot", purpose: "Plot trusted numeric table columns and let the learner reveal recorded points.", allowedConfigKind: "data-plot" },
  { primitiveId: "classification", purpose: "Classify fact-grounded examples using approved concept categories.", allowedConfigKind: "classification" },
  { primitiveId: "step-sequence", purpose: "Sequence approved relationships into a process.", allowedConfigKind: "step-sequence" },
  { primitiveId: "evidence-reveal", purpose: "Reveal approved facts only after evidence has been observed.", allowedConfigKind: "evidence-reveal" },
  { primitiveId: "target-challenge", purpose: "Apply a pattern to a held-out trusted table row.", allowedConfigKind: "target-challenge" },
];
