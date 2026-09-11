import type { SceneState } from "./Scenes";
import type { P65Activity } from "./types";

/**
 * Projects the registered activity bindings onto the live scene. The scene,
 * calculations, controls, and learner-facing readouts all consume this same
 * resolved state so an instruction cannot silently disagree with the circuit.
 */
export function sceneForActivity(scene: SceneState, activity?: P65Activity): SceneState {
  const initial = activity?.circuitRuntime?.initial;
  const fixed = activity?.circuitRuntime?.fixed;
  const pendingInitial = initial && !scene.circuits.assessmentEvidenceRevealed ? initial : undefined;
  if (!fixed && !pendingInitial) return scene;
  return {
    ...scene,
    circuits: {
      ...scene.circuits,
      ...(pendingInitial?.voltage === undefined ? {} : { voltage: pendingInitial.voltage }),
      ...(pendingInitial?.resistance === undefined ? {} : { resistance: pendingInitial.resistance }),
      ...(fixed?.closed === undefined ? {} : { closed: fixed.closed }),
      ...(fixed?.voltage === undefined ? {} : { voltage: fixed.voltage }),
      ...(fixed?.resistance === undefined ? {} : { resistance: fixed.resistance }),
    },
  };
}

export function learnerEvidenceVisible(activity: P65Activity | undefined, committed: boolean) {
  return activity?.information.evidenceVisibility !== "withhold-until-commit" || committed;
}

/** Small fail-closed checks for circuit activities whose copy depends on live values. */
export function circuitRuntimeIssues(activity: P65Activity): string[] {
  const runtime = activity.circuitRuntime;
  if (activity.interaction === "observe-voltage") {
    if (runtime?.fixed?.resistance === undefined) return ["Voltage comparison requires one fixed resistance."];
    if (!runtime.selectableVoltages || runtime.selectableVoltages.length < 2) return ["Voltage comparison requires at least two voltage values."];
  }
  if (activity.interaction === "predict-current") {
    if (runtime?.fixed?.voltage === undefined) return ["Current prediction requires one fixed voltage."];
    if (!runtime.selectableResistances || runtime.selectableResistances.length < 2) return ["Current prediction requires at least two resistance values."];
  }
  return [];
}
