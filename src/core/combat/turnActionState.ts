import { effectiveCardCost } from "./combatEngine";
import { isEnemyAlive } from "./enemyState";
import type { RunEngine } from "../run/runEngine";
import type { CardDefinition, GameData } from "../types";
import type { CardInstance, CombatState } from "./types";

const MVP_MAX_ENERGY = 3;

export type CombatTurnActionSuggestedUiState =
  | "notCombat"
  | "playerReady"
  | "playerNoPlayableCards"
  | "enemyPhase"
  | "victory"
  | "defeat";

export interface CombatTurnActionState {
  mode: "notCombat" | "combat";
  combatPhase?: CombatState["phase"];
  turn?: number;
  energy?: number;
  maxEnergy: number;
  canEndTurn: boolean;
  canPlayAnyHandCard: boolean;
  endTurnDisabledReason?: string;
  suggestedUiState: CombatTurnActionSuggestedUiState;
}

export function getCombatTurnActionState(engine: RunEngine): CombatTurnActionState {
  if (engine.run.mode !== "combat" || !engine.run.currentCombat) {
    return {
      mode: "notCombat",
      maxEnergy: MVP_MAX_ENERGY,
      canEndTurn: false,
      canPlayAnyHandCard: false,
      endTurnDisabledReason: "不在戰鬥中。",
      suggestedUiState: "notCombat"
    };
  }

  const combat = engine.run.currentCombat;
  const canPlayAnyHandCard = canAnyCombatHandCardPlay(engine.data, combat);
  const canEndTurn = combat.phase === "player";

  return {
    mode: "combat",
    combatPhase: combat.phase,
    turn: combat.turn,
    energy: combat.player.energy,
    maxEnergy: MVP_MAX_ENERGY,
    canEndTurn,
    canPlayAnyHandCard,
    endTurnDisabledReason: canEndTurn ? undefined : endTurnDisabledReason(combat.phase),
    suggestedUiState: suggestedUiState(combat.phase, canPlayAnyHandCard)
  };
}

export function canAnyCombatHandCardPlay(data: GameData, combat: CombatState): boolean {
  if (combat.phase !== "player") return false;
  return combat.hand.some((cardInstanceId) => combatCardPlayabilityReason(data, combat, cardInstanceId) === undefined);
}

export function combatCardPlayabilityReason(data: GameData, combat: CombatState, cardInstanceId: string): string | undefined {
  if (combat.phase !== "player") return "不是玩家回合。";
  const cardInstance = combat.cards.find((card) => card.instanceId === cardInstanceId);
  const definition = cardInstance ? cardDefinition(data, cardInstance) : undefined;
  if (!cardInstance || !definition) return "找不到卡牌。";
  if (!combat.hand.includes(cardInstanceId)) return "卡牌不在手牌中。";
  if (effectiveCardCost(data, cardInstance) > combat.player.energy) return "能量不足。";
  if ((definition.target === "singleEnemy" || definition.target === "allEnemies") && !combat.enemies.some(isEnemyAlive)) {
    return "沒有可攻擊目標。";
  }
  if (definition.target === "handCard" && !combat.hand.some((id) => id !== cardInstanceId)) return "沒有可指定的手牌。";
  return undefined;
}

function cardDefinition(data: GameData, card: CardInstance): CardDefinition | undefined {
  return data.cards.find((definition) => definition.id === card.cardId);
}

function suggestedUiState(phase: CombatState["phase"], canPlayAnyHandCard: boolean): CombatTurnActionSuggestedUiState {
  if (phase === "player") return canPlayAnyHandCard ? "playerReady" : "playerNoPlayableCards";
  if (phase === "enemy") return "enemyPhase";
  if (phase === "victory") return "victory";
  return "defeat";
}

function endTurnDisabledReason(phase: CombatState["phase"]): string {
  if (phase === "enemy") return "敵人行動中。";
  if (phase === "victory") return "勝利處理中。";
  return "失敗處理中。";
}
