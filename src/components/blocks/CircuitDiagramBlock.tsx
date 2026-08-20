import type { LearningBlock } from "@/src/domain/contracts";

type Props = {
  block: LearningBlock;
};

export function CircuitDiagramBlock({ block }: Props) {
  if (block.content.kind !== "diagram") return null;

  return (
    <article className="learning-block diagram-block">
      <BlockLabel purpose={block.purpose} title={block.title} />
      <div className="circuit-diagram" aria-label="A simple closed circuit">
        <svg viewBox="0 0 520 220" role="img" aria-labelledby={`${block.id}-title`}>
          <title id={`${block.id}-title`}>
            Battery connected to a resistor in a closed circuit
          </title>
          <path className="wire" d="M95 55 H220 M340 55 H435 V165 H95 V55" />
          <line className="battery-long" x1="76" y1="87" x2="114" y2="87" />
          <line className="battery-short" x1="84" y1="119" x2="106" y2="119" />
          <path className="wire" d="M95 55 V87 M95 119 V165" />
          <path
            className="resistor"
            d="M220 55 l15 -16 l20 32 l20 -32 l20 32 l20 -32 l25 16"
          />
          <path className="current-arrow" d="M160 150 h80" />
          <path className="arrow-head" d="M240 150 l-15 -9 v18 z" />
          <text className="svg-label" x="47" y="108">9 V</text>
          <text className="svg-label" x="248" y="112">Resistance</text>
          <text className="svg-label" x="151" y="140">Current</text>
        </svg>
      </div>
      <div className="relationship-row" aria-label="Ohm's law relationship">
        <span>Fixed voltage</span>
        <span aria-hidden="true">+</span>
        <span>Higher resistance</span>
        <span aria-hidden="true">→</span>
        <strong>Lower current</strong>
      </div>
      <h3>{block.content.heading}</h3>
      <p>{block.content.body}</p>
      <div className="formula-explainer" aria-label="Ohm's law explained">
        <div>
          <span>Relationship</span>
          <strong>I = V ÷ R</strong>
        </div>
        <p>
          <strong>I</strong> means current, <strong>V</strong> means voltage, and <strong>R</strong> means resistance.
          Dividing by a larger resistance gives a smaller current when the voltage does not change.
        </p>
      </div>
    </article>
  );
}

export function BlockLabel({
  purpose,
  title,
}: {
  purpose: string;
  title: string;
}) {
  return (
    <header className="block-heading">
      <span className="purpose-pill">{purpose}</span>
      <span className="block-kicker">{title}</span>
    </header>
  );
}
