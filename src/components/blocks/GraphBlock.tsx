import type { LearningBlock } from "@/src/domain/contracts";
import { BlockLabel } from "@/src/components/blocks/CircuitDiagramBlock";

type Props = {
  block: LearningBlock;
};

export function GraphBlock({ block }: Props) {
  if (block.content.kind !== "graph") return null;

  const values = block.content.resistanceValues.map((resistance) => ({
    resistance,
    current: block.content.kind === "graph" ? block.content.fixedVoltage / resistance : 0,
  }));
  const maxResistance = Math.max(...values.map((point) => point.resistance));
  const maxCurrent = Math.max(...values.map((point) => point.current));
  const points = values
    .map((point) => {
      const x = 58 + (point.resistance / maxResistance) * 390;
      const y = 210 - (point.current / maxCurrent) * 165;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <article className="learning-block graph-block">
      <BlockLabel purpose={block.purpose} title={block.title} />
      <h3>{block.content.heading}</h3>
      <p>{block.content.body}</p>
      <div className="graph-wrap">
        <svg viewBox="0 0 500 260" role="img" aria-labelledby={`${block.id}-graph-title`}>
          <title id={`${block.id}-graph-title`}>
            Current decreases non-linearly as resistance increases at fixed voltage
          </title>
          <line className="axis" x1="58" y1="30" x2="58" y2="210" />
          <line className="axis" x1="58" y1="210" x2="465" y2="210" />
          <polyline className="graph-line" points={points} />
          {values.map((point) => {
            const x = 58 + (point.resistance / maxResistance) * 390;
            const y = 210 - (point.current / maxCurrent) * 165;
            return <circle className="graph-point" cx={x} cy={y} r="5" key={point.resistance} />;
          })}
          <text className="axis-label" x="206" y="248">Resistance (Ω)</text>
          <text className="axis-label" x="-154" y="20" transform="rotate(-90)">Current (A)</text>
        </svg>
      </div>
      <details className="data-table">
        <summary>View the graph as a data table</summary>
        <table>
          <thead><tr><th>Resistance</th><th>Current</th></tr></thead>
          <tbody>
            {values.map((point) => (
              <tr key={point.resistance}>
                <td>{point.resistance} Ω</td>
                <td>{point.current.toFixed(2)} A</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </article>
  );
}
