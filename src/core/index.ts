export { loadGameData } from "./data/loadGameData";
export { knownCardEffectIds, validateGameData } from "./data/validate";
export type {
  AssetDefaults,
  AssetSlots,
  CardDefinition,
  CardRarity,
  CardType,
  ContractDefinition,
  ContractTrigger,
  EnemyDefinition,
  EnemyIntentDefinition,
  EnemyKind,
  EventDefinition,
  EventOptionDefinition,
  GameData,
  MapRules,
  MemoryType,
  NodeType,
  RelicDefinition,
  RelicTrigger,
  TargetType
} from "./types";
export { createRng, pickWeighted, shuffle } from "./rng";
export type { Rng } from "./rng";
export { createEffectRegistry, registerMvpEffectPlaceholders } from "./effects/effectRegistry";
export type { EffectHandler, EffectRegistry, EffectResult } from "./effects/effectRegistry";
export { createAssetRegistry } from "./assets/assetRegistry";
export type { AssetEntry, AssetRegistry, AudioAssetKey, IntentIconType } from "./assets/assetRegistry";
export { createCombat, createCombatLookup, drawCards } from "./combat/createCombat";
export { checkCombatEnd, effectiveCardCost, endPlayerTurn, playCard, startPlayerTurn } from "./combat/combatEngine";
export { combatEffectIds, resolveCombatEffect } from "./combat/cardEffects";
export { isEnemyAlive, markEnemyDead, syncEnemyDeathState } from "./combat/enemyState";
export type {
  BossCountermeasure,
  CardInstance,
  CardMemoryState,
  CardMutationState,
  CombatEvent,
  CombatPhase,
  CombatState,
  CombatSummary,
  EnemyLifecycleState,
  EnemyInstance,
  PlayerCombatState,
  StatusKey
} from "./combat/types";
export { chooseBossCountermeasure } from "./boss/habitAnalysis";
export { MEMORY_THRESHOLDS, addMemoryProgress, eligibleMemoryTypes } from "./memory/memoryRules";
export { canMutate, mutateCardInstance } from "./memory/mutations";
export { createRun, startRun, selectMapNode, playRunCard, endRunTurn, completeCurrentCombat, autoWinCombat, chooseCardReward, skipCardReward, restHeal, restMutate, buyShopItem, leaveShop, chooseEventOption, snapshotRun } from "./run/runEngine";
export type { CombatCompletionOptions, CreateRunOptions, RunEngine } from "./run/runEngine";
export { generateMap } from "./run/mapGenerator";
export type { ActiveContract, MapNode, RewardState, RunMode, RunSnapshot, RunState, ShopItem } from "./run/types";
