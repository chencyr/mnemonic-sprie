import type { CombatState } from "../../core";

export type CombatPlayerHpState = "healthy" | "wounded" | "critical" | "dead";

export interface CombatPlayerStatusUiState {
  hp: number;
  maxHp: number;
  hpRatio: number;
  hpState: CombatPlayerHpState;
  block: number;
  hasBlock: boolean;
  energy: number;
  maxEnergy: number;
  drawPileCount: number;
  discardPileCount: number;
  handCount: number;
}

export function createCombatPlayerStatusUiState(combat: CombatState): CombatPlayerStatusUiState {
  const hp = Math.max(0, combat.player.hp);
  const maxHp = Math.max(0, combat.player.maxHp);
  const hpRatio = maxHp > 0 ? clamp01(hp / maxHp) : 0;
  const maxEnergy = 3;

  return {
    hp,
    maxHp,
    hpRatio,
    hpState: hpStateFor(hp, hpRatio),
    block: Math.max(0, combat.player.block),
    hasBlock: combat.player.block > 0,
    energy: Math.max(0, combat.player.energy),
    maxEnergy,
    drawPileCount: combat.drawPile.length,
    discardPileCount: combat.discardPile.length,
    handCount: combat.hand.length
  };
}

function hpStateFor(hp: number, hpRatio: number): CombatPlayerHpState {
  if (hp <= 0) return "dead";
  if (hpRatio <= 0.25) return "critical";
  if (hpRatio <= 0.5) return "wounded";
  return "healthy";
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
