import type { SourceDocument } from "./types";

export const reactionRateSource: SourceDocument = {
  schemaVersion: "p5-source-1",
  id: "reaction-rate-concentration-v1",
  title: "How concentration affects reaction rate",
  subject: "chemistry",
  language: "en",
  sections: [
    {
      id: "reaction-system",
      heading: "The reaction",
      text: "Magnesium reacts with hydrochloric acid and produces hydrogen gas. We can compare reaction rate by measuring the time needed to collect 30 mL of hydrogen.",
    },
    {
      id: "particle-explanation",
      heading: "Why concentration matters",
      text: "A higher acid concentration contains more acid particles in the same volume. This produces more frequent successful collisions with magnesium, so the reaction is faster.",
    },
    {
      id: "reading-time",
      heading: "Reading the evidence",
      text: "For the same 30 mL volume of hydrogen, a shorter collection time indicates a faster reaction. Doubling concentration does not necessarily double the reaction rate.",
    },
  ],
  tables: [{
    id: "concentration-time-table",
    title: "Hydrogen collection results",
    description: "Time required to collect a fixed 30 mL volume of hydrogen.",
    columns: [
      { id: "concentration", label: "Acid concentration", unit: "mol/L", valueType: "number" },
      { id: "time", label: "Time to collect 30 mL hydrogen", unit: "s", valueType: "number" },
    ],
    rows: [
      { id: "result-050", values: { concentration: 0.5, time: 92 } },
      { id: "result-100", values: { concentration: 1, time: 49 } },
      { id: "result-150", values: { concentration: 1.5, time: 34 } },
      { id: "result-200", values: { concentration: 2, time: 26 } },
    ],
  }],
};

export const evaluationSources: SourceDocument[] = [
  reactionRateSource,
  {
    schemaVersion: "p5-source-1", id: "photosynthesis-light-v1", title: "Light intensity and photosynthesis", subject: "biology", language: "en",
    sections: [{ id: "light-rate", heading: "Light as a limiting factor", text: "At low light intensity, increasing light can increase the rate of photosynthesis. At high light intensity, another factor may limit the rate." }],
    tables: [{ id: "light-bubbles", title: "Pondweed results", description: "Bubbles counted in one minute.", columns: [{ id: "distance", label: "Lamp distance", unit: "cm", valueType: "number" }, { id: "bubbles", label: "Bubbles", unit: "per min", valueType: "number" }], rows: [{ id: "p1", values: { distance: 10, bubbles: 42 } }, { id: "p2", values: { distance: 20, bubbles: 25 } }, { id: "p3", values: { distance: 30, bubbles: 14 } }] }],
  },
  {
    schemaVersion: "p5-source-1", id: "river-erosion-v1", title: "What changes river erosion?", subject: "geography", language: "en",
    sections: [{ id: "erosion", heading: "Energy and erosion", text: "Faster water can carry more energy. Greater discharge and a steeper gradient can increase river velocity and erosion, while resistant rock erodes more slowly." }], tables: [],
  },
  {
    schemaVersion: "p5-source-1", id: "supply-demand-v1", title: "Supply, demand and price", subject: "economics", language: "en",
    sections: [{ id: "market", heading: "Market changes", text: "When demand increases while supply is unchanged, price tends to rise. When supply increases while demand is unchanged, price tends to fall." }], tables: [],
  },
  {
    schemaVersion: "p5-source-1", id: "perpendicular-bisector-v1", title: "Constructing a perpendicular bisector", subject: "geometry", language: "en",
    sections: [{ id: "construction", heading: "Compass construction", text: "Draw equal-radius arcs from both endpoints of a line segment. Join the two arc intersections. The new line is perpendicular to the segment and passes through its midpoint." }], tables: [],
  },
];

export function getSourceDocument(id: string): SourceDocument | undefined {
  return evaluationSources.find((source) => source.id === id);
}
