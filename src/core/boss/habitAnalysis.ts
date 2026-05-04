import type { BossCountermeasure, CombatSummary } from "../combat/types";

export function chooseBossCountermeasure(summaries: readonly CombatSummary[]): BossCountermeasure {
  const recent = summaries.slice(-3);
  const total = recent.reduce((sum, item) => sum + Math.max(1, item.totalCards), 0);
  const attacks = recent.reduce((sum, item) => sum + item.attackCards, 0) / total;
  const defenses = recent.reduce((sum, item) => sum + item.defenseCards, 0) / total;
  const skills = recent.reduce((sum, item) => sum + item.skillCards, 0) / total;
  const zeroCost = recent.reduce((sum, item) => sum + item.zeroCostCards, 0) / total;
  const cardsPerCombat = recent.reduce((sum, item) => sum + item.totalCards, 0) / Math.max(1, recent.length);
  const retained = recent.reduce((sum, item) => sum + item.retainedCards, 0);

  if (zeroCost >= 0.28) return "zero_cost_ward";
  if (retained >= 2) return "retention_punish";
  if (cardsPerCombat >= 9) return "fatigue_draw";
  if (attacks >= 0.5) return "spikes_vs_attacks";
  if (defenses >= 0.4) return "guard_breaker";
  if (skills >= 0.35) return "skill_tax";
  return "spikes_vs_attacks";
}
