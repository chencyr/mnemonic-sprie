import { chooseBossCountermeasure } from "../boss/habitAnalysis";
import { createCombat } from "../combat/createCombat";
import { checkCombatEnd, endPlayerTurn, playCard } from "../combat/combatEngine";
import { emptyMemory, type CardInstance } from "../combat/types";
import { createRng, type Rng } from "../rng";
import { applyBrokenNotes, hasRelic } from "../relics/relicEngine";
import type { GameData, NodeType } from "../types";
import { canMutate, mutateCardInstance } from "../memory/mutations";
import { contractById, pickEvent } from "./events";
import { firstFloorNodeId, generateMap } from "./mapGenerator";
import { createCombatReward, rareCard } from "./rewards";
import { createShopInventory } from "./shop";
import type { ActiveContract, MapNode, RunState } from "./types";

export interface RunEngine {
  data: GameData;
  rng: Rng;
  run: RunState;
}

export interface CreateRunOptions {
  seed?: number;
  quick?: boolean;
}

export function createRun(data: GameData, options: CreateRunOptions = {}): RunEngine {
  const seed = options.seed ?? 20260505;
  const rng = createRng(seed);
  const map = generateMap(data, rng);
  const first = firstFloorNodeId(map);
  const run: RunState = {
    seed,
    mode: "title",
    floor: 0,
    playerHp: 72,
    playerMaxHp: 72,
    gold: 99,
    deck: createStartingDeck(),
    relics: ["broken_notes"],
    activeContracts: [],
    map,
    reachableNodeIds: [first],
    recentCombatSummaries: [],
    log: ["拾憶者抵達牌塔入口。"],
    quick: Boolean(options.quick)
  };
  return { data, rng, run };
}

export function startRun(engine: RunEngine) {
  engine.run.mode = "map";
  engine.run.log.push("開始爬塔。");
}

export function selectMapNode(engine: RunEngine, nodeId: string) {
  const { run, data, rng } = engine;
  if (run.mode !== "map") throw new Error("只能在地圖畫面選擇節點。");
  if (!run.reachableNodeIds.includes(nodeId)) throw new Error(`節點目前不可到達：${nodeId}`);
  const node = getNode(run.map, nodeId);
  run.currentNodeId = nodeId;
  run.floor = node.floor;
  if (node.type === "normalCombat" || node.type === "eliteCombat" || node.type === "boss") {
    startCombatNode(engine, node.type);
    return;
  }
  if (node.type === "event") {
    run.activeEvent = pickEvent(data, node.floor);
    run.mode = "event";
    run.log.push(`事件：${run.activeEvent.name}`);
    return;
  }
  if (node.type === "rest") {
    run.mode = "rest";
    run.log.push("抵達休息點。");
    return;
  }
  if (node.type === "shop") {
    openShop(engine);
    return;
  }
  rng.next();
}

export function playRunCard(engine: RunEngine, cardInstanceId: string, targetEnemyId?: string, targetCardId?: string) {
  const combat = requireCombat(engine.run);
  playCard(combat, engine.data, engine.rng, cardInstanceId, { targetEnemyId, targetCardId });
  if (combat.phase === "victory") completeCombat(engine);
  if (combat.phase === "defeat") engine.run.mode = "defeat";
}

export function endRunTurn(engine: RunEngine) {
  const combat = requireCombat(engine.run);
  endPlayerTurn(combat, engine.data, engine.rng);
  if (combat.phase === "victory") completeCombat(engine);
  if (combat.phase === "defeat") engine.run.mode = "defeat";
}

export function autoWinCombat(engine: RunEngine) {
  const combat = requireCombat(engine.run);
  for (const enemy of combat.enemies) enemy.hp = 0;
  checkCombatEnd(combat);
  completeCombat(engine);
}

export function chooseCardReward(engine: RunEngine, cardId: string) {
  const reward = engine.run.reward;
  if (!reward) throw new Error("No reward available.");
  const card = reward.cards.find((item) => item.id === cardId);
  if (!card) throw new Error(`Reward card not available: ${cardId}`);
  engine.run.deck.push(createCardInstance(card.id, `${card.id}-${engine.run.deck.length + 1}`));
  finishReward(engine);
}

export function skipCardReward(engine: RunEngine) {
  const reward = engine.run.reward;
  if (!reward) throw new Error("No reward available.");
  engine.run.gold += reward.gold;
  finishReward(engine);
}

export function restHeal(engine: RunEngine) {
  if (engine.run.mode !== "rest") throw new Error("Not at rest site.");
  engine.run.playerHp = Math.min(engine.run.playerMaxHp, engine.run.playerHp + Math.ceil(engine.run.playerMaxHp * 0.3));
  engine.run.log.push("休息回血。");
  leaveNode(engine);
}

export function restMutate(engine: RunEngine, cardInstanceId?: string) {
  if (engine.run.mode !== "rest") throw new Error("Not at rest site.");
  const card = cardInstanceId ? engine.run.deck.find((item) => item.instanceId === cardInstanceId) : engine.run.deck.find((item) => canMutate(item));
  if (!card) throw new Error("沒有可變異的牌。");
  mutateCardInstance(engine.data, card, undefined, engine.run.floor);
  engine.run.log.push(`${card.instanceId} 完成變異。`);
  leaveNode(engine);
}

export function buyShopItem(engine: RunEngine, itemId: string) {
  if (engine.run.mode !== "shop" || !engine.run.shop) throw new Error("Shop is not open.");
  const item = engine.run.shop.find((entry) => entry.id === itemId);
  if (!item || item.sold) throw new Error(`Shop item unavailable: ${itemId}`);
  if (engine.run.gold < item.price) throw new Error("Gold is not enough.");
  engine.run.gold -= item.price;
  item.sold = true;
  if (item.kind === "card") engine.run.deck.push(createCardInstance(item.itemId, `${item.itemId}-${engine.run.deck.length + 1}`));
  if (item.kind === "relic" && !engine.run.relics.includes(item.itemId)) engine.run.relics.push(item.itemId);
  if (item.kind === "remove" && engine.run.deck.length > 1) engine.run.deck.pop();
  engine.run.log.push("商店交易完成。");
}

export function leaveShop(engine: RunEngine) {
  if (engine.run.mode !== "shop") throw new Error("Shop is not open.");
  leaveNode(engine);
}

export function chooseEventOption(engine: RunEngine, optionId: string) {
  const event = engine.run.activeEvent;
  if (engine.run.mode !== "event" || !event) throw new Error("No active event.");
  const option = event.options.find((item) => item.id === optionId);
  if (!option) throw new Error(`Event option unavailable: ${optionId}`);
  if (option.contractId) addContract(engine, option.contractId);
  applyEventEffect(engine, option.effectId);
  engine.run.log.push(`事件選項：${option.label}`);
  engine.run.activeEvent = undefined;
  leaveNode(engine);
}

export function snapshotRun(run: RunState) {
  return {
    mode: run.mode,
    floor: run.floor,
    hp: run.playerHp,
    maxHp: run.playerMaxHp,
    gold: run.gold,
    deckSize: run.deck.length,
    relics: run.relics,
    contracts: run.activeContracts
  };
}

function startCombatNode(engine: RunEngine, nodeType: NodeType) {
  const enemyKind = nodeType === "boss" ? "boss" : nodeType === "eliteCombat" ? "elite" : "normal";
  applyCombatStartContracts(engine, enemyKind);
  const bossCountermeasure = enemyKind === "boss" ? chooseBossCountermeasure(engine.run.recentCombatSummaries) : undefined;
  engine.run.currentCombat = createCombat(engine.data, engine.rng, {
    floor: engine.run.floor,
    enemyKind,
    playerHp: engine.run.playerHp,
    playerMaxHp: engine.run.playerMaxHp,
    deck: engine.run.deck,
    bossCountermeasure,
    quick: engine.run.quick
  });
  engine.run.mode = "combat";
}

function completeCombat(engine: RunEngine) {
  const combat = requireCombat(engine.run);
  if (hasRelic(engine.run.relics, "broken_notes")) applyBrokenNotes(combat);
  engine.run.playerHp = combat.player.hp;
  engine.run.deck = combat.cards.map((card) => ({
    ...card,
    retained: false,
    combatCostDelta: 0,
    exhausted: false
  }));
  engine.run.recentCombatSummaries.push(combat.summary);
  if (combat.enemyKind === "boss") {
    engine.run.mode = "victory";
    engine.run.log.push("打敗第 12 層 Boss。");
    return;
  }
  engine.run.reward = createCombatReward(engine.data, engine.rng, combat.enemyKind === "elite");
  engine.run.currentCombat = undefined;
  engine.run.mode = "reward";
}

function finishReward(engine: RunEngine) {
  if (engine.run.reward?.relic && !engine.run.relics.includes(engine.run.reward.relic.id)) {
    engine.run.relics.push(engine.run.reward.relic.id);
  }
  engine.run.reward = undefined;
  leaveNode(engine);
}

function leaveNode(engine: RunEngine) {
  const current = engine.run.currentNodeId ? getNode(engine.run.map, engine.run.currentNodeId) : undefined;
  engine.run.reachableNodeIds = current?.next ?? [];
  engine.run.currentCombat = undefined;
  engine.run.shop = undefined;
  engine.run.reward = undefined;
  if (engine.run.mode !== "victory" && engine.run.mode !== "defeat") engine.run.mode = "map";
}

function openShop(engine: RunEngine) {
  const debt = consumeContract(engine.run.activeContracts, "debt_contract");
  const multiplier = debt ? 1.5 : hasRelic(engine.run.relics, "old_ticket_stub") ? 0.8 : 1;
  engine.run.shop = createShopInventory(engine.data, engine.rng, multiplier);
  engine.run.mode = "shop";
  engine.run.log.push("商人攤位打開。");
}

function applyCombatStartContracts(engine: RunEngine, enemyKind: "normal" | "elite" | "boss") {
  const blood = consumeContract(engine.run.activeContracts, "blood_contract");
  if (blood) {
    engine.run.playerHp = Math.max(1, engine.run.playerHp - 5);
    engine.run.log.push("血契生效：失去 5 HP。");
  }
  if (enemyKind === "boss" && consumeContract(engine.run.activeContracts, "blank_contract")) {
    engine.run.log.push("空白契生效：Boss 獲得強化。");
  }
}

function addContract(engine: RunEngine, contractId: string) {
  const definition = contractById(engine.data, contractId);
  engine.run.activeContracts.push({ id: definition.id, remainingUses: definition.remainingUses });
}

function consumeContract(contracts: ActiveContract[], contractId: string): boolean {
  const contract = contracts.find((item) => item.id === contractId && item.remainingUses > 0);
  if (!contract) return false;
  contract.remainingUses -= 1;
  return true;
}

function applyEventEffect(engine: RunEngine, effectId: string) {
  switch (effectId) {
    case "event_gain_rare_card":
      engine.run.deck.push(createCardInstance(rareCard(engine.data, engine.rng).id, `rare-${engine.run.deck.length + 1}`));
      break;
    case "event_gain_gold_100":
      engine.run.gold += 100;
      break;
    case "event_buy_memory_progress":
      if (engine.run.gold >= 25) {
        engine.run.gold -= 25;
        engine.run.deck[0].memory.obsession += 1;
      }
      break;
    case "event_remove_card":
      if (engine.run.deck.length > 1) engine.run.deck.pop();
      break;
    case "event_gain_gold_30":
      engine.run.gold += 30;
      break;
    case "event_mutate_card": {
      const target = engine.run.deck.find((card) => canMutate(card));
      if (target) mutateCardInstance(engine.data, target, undefined, engine.run.floor);
      engine.run.deck.push(createCardInstance("guard", `ink-burden-${engine.run.deck.length + 1}`));
      break;
    }
    case "event_heal_8":
      engine.run.playerHp = Math.min(engine.run.playerMaxHp, engine.run.playerHp + 8);
      break;
    case "event_noop":
      break;
  }
}

function getNode(map: readonly MapNode[], nodeId: string): MapNode {
  const node = map.find((item) => item.id === nodeId);
  if (!node) throw new Error(`Unknown map node: ${nodeId}`);
  return node;
}

function requireCombat(run: RunState) {
  if (!run.currentCombat) throw new Error("No active combat.");
  return run.currentCombat;
}

function createStartingDeck(): CardInstance[] {
  const cards: CardInstance[] = [];
  for (let i = 1; i <= 5; i += 1) cards.push(createCardInstance("strike", `strike-${i}`));
  for (let i = 1; i <= 5; i += 1) cards.push(createCardInstance("guard", `guard-${i}`));
  cards.push(createCardInstance("recall", "recall-1"));
  return cards;
}

function createCardInstance(cardId: string, instanceId: string): CardInstance {
  return {
    instanceId,
    cardId,
    memory: emptyMemory(),
    combatCostDelta: 0,
    retained: false,
    retainedStreak: 0,
    usedThisCombat: 0,
    discardedThisCombat: 0,
    exhausted: false
  };
}
