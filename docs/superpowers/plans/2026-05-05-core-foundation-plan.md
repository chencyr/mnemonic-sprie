# Core Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the framework-neutral TypeScript core foundation for Mnemonic Spire: shared domain types, JSON data tables, data validation, effect registry scaffolding, deterministic RNG, and asset manifest lookup.

**Architecture:** Keep `src/core/` free of Phaser imports. Store portable content metadata in `src/data/*.json`, resolve behavior through TypeScript registries, and expose stable helpers from `src/core/index.ts`. This plan creates the contracts that later combat, map, memory, shop, and Phaser UI tasks will use.

**Tech Stack:** Phaser 3 + TypeScript + Vite, Vitest for core unit tests, JSON data tables with TypeScript validation.

---

## Scope Check And Plan Series

The approved MVP spec spans several independent subsystems. Implement it as this plan series:

1. Core Foundation: types, data, validation, effect registry, RNG, asset registry.
2. Combat Engine: draw piles, turns, card play, targeting, damage, block, statuses, enemy intent.
3. Run Loop: map generation, node selection, rewards, shop, rest, events, contracts.
4. Memory Systems: physical card instances, memory triggers, mutation rules, relic triggers, Boss habit analysis.
5. Phaser Presentation: scenes, combat UI, map UI, reward UI, asset loading, audio.
6. Integration And E2E: complete run smoke path, `render_game_to_text`, `advanceTime`, balancing pass.

This document covers plan 1 only. It must leave the project with passing tests and a stable base for plan 2.

## File Structure

Create or modify these files:

- Modify: `package.json` to add `test` scripts and Vitest.
- Modify: `tsconfig.json` to support JSON imports and tests.
- Create: `src/core/types.ts` for framework-neutral domain types.
- Create: `src/core/rng.ts` for deterministic RNG utilities.
- Create: `src/core/data/validate.ts` for runtime validation of JSON data.
- Create: `src/core/data/loadGameData.ts` for loading and validating all bundled JSON data.
- Create: `src/core/effects/effectRegistry.ts` for effect id registration and lookup.
- Create: `src/core/assets/assetRegistry.ts` for data-driven asset slot to texture key mapping.
- Create: `src/core/index.ts` for public exports.
- Create: `src/data/cards.json` for 15 MVP cards.
- Create: `src/data/enemies.json` for 5 normal enemies, 1 elite, and 1 Boss.
- Create: `src/data/relics.json` for 5 relics.
- Create: `src/data/contracts.json` for 4 contracts.
- Create: `src/data/events.json` for 4 events.
- Create: `src/data/mapRules.json` for 12-floor map constraints.
- Create: `src/data/assets.json` for placeholders, UI icons, and audio paths.
- Create: `tests/core/dataValidation.test.ts`.
- Create: `tests/core/rng.test.ts`.
- Create: `tests/core/effectRegistry.test.ts`.
- Create: `tests/core/assetRegistry.test.ts`.

## Data Contract Tables

Use these exact ids in the first implementation.

Card ids:

- `strike`
- `pierce`
- `sweep`
- `countercut`
- `memory_blade`
- `terminus`
- `guard`
- `dodge`
- `stacked_defense`
- `reflect_shield`
- `preserve`
- `recall`
- `organize_hand`
- `burning_notes`
- `rewrite`

Effect ids:

- `deal_damage_6`
- `deal_damage_5_apply_vulnerable_1`
- `deal_all_damage_4`
- `countercut_damage`
- `memory_blade_damage`
- `terminus_damage`
- `gain_block_5`
- `gain_block_4_apply_weak_1`
- `stacked_defense_block`
- `reflect_shield_block_spike`
- `preserve_card`
- `recall_draw_memory`
- `organize_hand_discard_draw`
- `burning_notes_exhaust_damage`
- `rewrite_reduce_cost`

Enemy ids:

- `sticker_punk`
- `neon_mite`
- `paper_doll`
- `static_busker`
- `tagged_hound`
- `archive_brute`
- `tower_heart`

Relic ids:

- `broken_notes`
- `neon_nail`
- `sticker_charm`
- `old_ticket_stub`
- `broken_recorder`

Contract ids:

- `blood_contract`
- `debt_contract`
- `ink_contract`
- `blank_contract`

Event ids:

- `neon_alley`
- `ink_market`
- `blank_billboard`
- `lost_station`

## Task 1: Add Vitest And JSON Import Support

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `tests/core/dataValidation.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/core/dataValidation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { loadGameData } from "../../src/core/data/loadGameData";

describe("game data validation", () => {
  it("loads all bundled MVP data tables", () => {
    const data = loadGameData();

    expect(data.cards).toHaveLength(15);
    expect(data.enemies.filter((enemy) => enemy.kind === "normal")).toHaveLength(5);
    expect(data.enemies.filter((enemy) => enemy.kind === "elite")).toHaveLength(1);
    expect(data.enemies.filter((enemy) => enemy.kind === "boss")).toHaveLength(1);
    expect(data.relics).toHaveLength(5);
    expect(data.contracts).toHaveLength(4);
    expect(data.events).toHaveLength(4);
    expect(data.mapRules.floorCount).toBe(12);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/core/dataValidation.test.ts
```

Expected: command fails because `test` script or `vitest` is missing.

- [ ] **Step 3: Install Vitest**

Run:

```bash
npm install -D vitest
```

Expected: `package.json` and `package-lock.json` include `vitest`.

- [ ] **Step 4: Update scripts**

Modify `package.json` scripts to exactly:

```json
{
  "dev": "vite --host 127.0.0.1",
  "build": "tsc && vite build",
  "preview": "vite preview --host 127.0.0.1",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 5: Enable JSON imports and test types**

Modify `tsconfig.json` `compilerOptions` to include:

```json
{
  "resolveJsonModule": true,
  "types": ["vitest/globals"]
}
```

Modify `tsconfig.json` `include` to:

```json
["src", "tests"]
```

- [ ] **Step 6: Run test to verify current failure is now an unresolved import**

Run:

```bash
npm test -- tests/core/dataValidation.test.ts
```

Expected: FAIL with an import error for `src/core/data/loadGameData`.

- [ ] **Step 7: Commit**

Run:

```bash
git add package.json package-lock.json tsconfig.json tests/core/dataValidation.test.ts
git commit -m "test: add core test harness"
```

## Task 2: Define Core Domain Types

**Files:**
- Create: `src/core/types.ts`
- Create: `src/core/index.ts`
- Modify: `tests/core/dataValidation.test.ts`

- [ ] **Step 1: Write the type contract test**

Append this test to `tests/core/dataValidation.test.ts`:

```ts
import type { CardDefinition, EnemyDefinition, GameData } from "../../src/core";

describe("core type exports", () => {
  it("exports card, enemy, and game data contracts", () => {
    const card: CardDefinition = {
      id: "strike",
      name: "Strike",
      cost: 1,
      type: "attack",
      rarity: "basic",
      target: "singleEnemy",
      description: "Deal 6 damage.",
      effectId: "deal_damage_6",
      tags: ["starter"],
      mutationKeys: ["bloodthirst", "desperation"],
      assets: { cardArt: "cards/strike.png" }
    };

    const enemy: EnemyDefinition = {
      id: "sticker_punk",
      name: "Sticker Punk",
      kind: "normal",
      maxHp: 30,
      intents: [{ id: "poke", type: "attack", amount: 6, weight: 1 }],
      assets: { sprite: "enemies/sticker_punk.png" }
    };

    const data: Pick<GameData, "cards" | "enemies"> = {
      cards: [card],
      enemies: [enemy]
    };

    expect(data.cards[0].id).toBe("strike");
    expect(data.enemies[0].kind).toBe("normal");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/core/dataValidation.test.ts
```

Expected: FAIL because `src/core` exports do not exist.

- [ ] **Step 3: Create `src/core/types.ts`**

Create `src/core/types.ts`:

```ts
export type CardType = "attack" | "defense" | "skill" | "status" | "curse";
export type CardRarity = "basic" | "common" | "uncommon" | "rare" | "curse";
export type TargetType = "singleEnemy" | "allEnemies" | "self" | "none" | "handCard";
export type MemoryType = "bloodthirst" | "desperation" | "grudge" | "obsession" | "witness";
export type EnemyKind = "normal" | "elite" | "boss";
export type NodeType = "normalCombat" | "eliteCombat" | "event" | "rest" | "shop" | "boss";
export type RelicTrigger = "combatStart" | "cardPlayed" | "memoryGained" | "shopOpened" | "restSite" | "combatEnd";
export type ContractTrigger = "combatStart" | "shopOpened" | "bossStart" | "immediate";

export type AssetSlots = Record<string, string>;

export interface CardDefinition {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  rarity: CardRarity;
  target: TargetType;
  description: string;
  effectId: string;
  tags: string[];
  mutationKeys: MemoryType[];
  assets: AssetSlots;
}

export interface EnemyIntentDefinition {
  id: string;
  type: "attack" | "block" | "debuff" | "mixed";
  amount?: number;
  status?: string;
  weight: number;
}

export interface EnemyDefinition {
  id: string;
  name: string;
  kind: EnemyKind;
  maxHp: number;
  intents: EnemyIntentDefinition[];
  assets: AssetSlots;
}

export interface RelicDefinition {
  id: string;
  name: string;
  rarity: "starter" | "common" | "uncommon" | "rare";
  description: string;
  trigger: RelicTrigger;
  assets: AssetSlots;
}

export interface ContractDefinition {
  id: string;
  name: string;
  benefit: string;
  cost: string;
  trigger: ContractTrigger;
  remainingUses: number;
  assets: AssetSlots;
}

export interface EventOptionDefinition {
  id: string;
  label: string;
  description: string;
  contractId?: string;
  effectId: string;
}

export interface EventDefinition {
  id: string;
  name: string;
  body: string;
  options: EventOptionDefinition[];
  assets: AssetSlots;
}

export interface MapRules {
  floorCount: number;
  minNodesPerMiddleFloor: number;
  maxNodesPerMiddleFloor: number;
  bossFloor: number;
  firstFloorNodeType: NodeType;
  requiredRestFloorMin: number;
  requiredRestFloorMax: number;
  lateSpecialFloorMin: number;
  lateSpecialFloorMax: number;
  maxConsecutiveNonCombat: number;
}

export interface AssetDefaults {
  placeholders: Record<string, string>;
  ui: Record<string, string>;
  audio: Record<string, string>;
}

export interface GameData {
  cards: CardDefinition[];
  enemies: EnemyDefinition[];
  relics: RelicDefinition[];
  contracts: ContractDefinition[];
  events: EventDefinition[];
  mapRules: MapRules;
  assets: AssetDefaults;
}
```

- [ ] **Step 4: Create `src/core/index.ts`**

Create `src/core/index.ts`:

```ts
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
```

- [ ] **Step 5: Run test to verify unresolved loader remains**

Run:

```bash
npm test -- tests/core/dataValidation.test.ts
```

Expected: FAIL because `loadGameData` still does not exist, while type imports compile.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/core/types.ts src/core/index.ts tests/core/dataValidation.test.ts
git commit -m "feat: define core domain types"
```

## Task 3: Add MVP JSON Data Tables

**Files:**
- Create: `src/data/cards.json`
- Create: `src/data/enemies.json`
- Create: `src/data/relics.json`
- Create: `src/data/contracts.json`
- Create: `src/data/events.json`
- Create: `src/data/mapRules.json`
- Create: `src/data/assets.json`

- [ ] **Step 1: Create `src/data/cards.json`**

Use this exact file content:

```json
[
  { "id": "strike", "name": "斬擊", "cost": 1, "type": "attack", "rarity": "basic", "target": "singleEnemy", "description": "造成 6 點傷害。", "effectId": "deal_damage_6", "tags": ["starter"], "mutationKeys": ["bloodthirst", "desperation", "witness"], "assets": { "cardArt": "cards/strike.png", "memoryStickerSlot": "stickers/memory-empty.png" } },
  { "id": "pierce", "name": "穿刺", "cost": 1, "type": "attack", "rarity": "common", "target": "singleEnemy", "description": "造成 5 點傷害，施加 1 層易傷。", "effectId": "deal_damage_5_apply_vulnerable_1", "tags": ["debuff"], "mutationKeys": ["bloodthirst", "witness"], "assets": { "cardArt": "cards/pierce.png", "memoryStickerSlot": "stickers/memory-empty.png" } },
  { "id": "sweep", "name": "掃擊", "cost": 1, "type": "attack", "rarity": "common", "target": "allEnemies", "description": "對所有敵人造成 4 點傷害。", "effectId": "deal_all_damage_4", "tags": ["aoe"], "mutationKeys": ["bloodthirst", "witness"], "assets": { "cardArt": "cards/sweep.png", "memoryStickerSlot": "stickers/memory-empty.png" } },
  { "id": "countercut", "name": "反擊", "cost": 1, "type": "attack", "rarity": "uncommon", "target": "singleEnemy", "description": "造成 5 點傷害。若你有格擋，改為造成 9 點傷害。", "effectId": "countercut_damage", "tags": ["block-scaling"], "mutationKeys": ["bloodthirst", "desperation"], "assets": { "cardArt": "cards/countercut.png", "memoryStickerSlot": "stickers/memory-empty.png" } },
  { "id": "memory_blade", "name": "記憶刃", "cost": 2, "type": "attack", "rarity": "rare", "target": "singleEnemy", "description": "造成 10 點傷害。若目標是精英或 Boss，獲得 1 點見證進度。", "effectId": "memory_blade_damage", "tags": ["memory"], "mutationKeys": ["witness", "bloodthirst"], "assets": { "cardArt": "cards/memory_blade.png", "memoryStickerSlot": "stickers/memory-empty.png" } },
  { "id": "terminus", "name": "終止符", "cost": 2, "type": "attack", "rarity": "rare", "target": "singleEnemy", "description": "造成 12 點傷害。若目標低於 40% HP，改為造成 18 點傷害。", "effectId": "terminus_damage", "tags": ["finisher"], "mutationKeys": ["bloodthirst", "desperation"], "assets": { "cardArt": "cards/terminus.png", "memoryStickerSlot": "stickers/memory-empty.png" } },
  { "id": "guard", "name": "格擋", "cost": 1, "type": "defense", "rarity": "basic", "target": "self", "description": "獲得 5 點格擋。", "effectId": "gain_block_5", "tags": ["starter"], "mutationKeys": ["desperation", "obsession"], "assets": { "cardArt": "cards/guard.png", "memoryStickerSlot": "stickers/memory-empty.png" } },
  { "id": "dodge", "name": "閃避", "cost": 1, "type": "defense", "rarity": "common", "target": "singleEnemy", "description": "獲得 4 點格擋，對一名敵人施加 1 層虛弱。", "effectId": "gain_block_4_apply_weak_1", "tags": ["debuff"], "mutationKeys": ["desperation", "obsession"], "assets": { "cardArt": "cards/dodge.png", "memoryStickerSlot": "stickers/memory-empty.png" } },
  { "id": "stacked_defense", "name": "堆疊防線", "cost": 1, "type": "defense", "rarity": "uncommon", "target": "self", "description": "獲得 6 點格擋。若本回合已打出防禦牌，改為獲得 10 點格擋。", "effectId": "stacked_defense_block", "tags": ["block-scaling"], "mutationKeys": ["obsession", "desperation"], "assets": { "cardArt": "cards/stacked_defense.png", "memoryStickerSlot": "stickers/memory-empty.png" } },
  { "id": "reflect_shield", "name": "反射盾", "cost": 2, "type": "defense", "rarity": "uncommon", "target": "self", "description": "獲得 8 點格擋與 2 層尖刺。", "effectId": "reflect_shield_block_spike", "tags": ["spike"], "mutationKeys": ["obsession", "desperation"], "assets": { "cardArt": "cards/reflect_shield.png", "memoryStickerSlot": "stickers/memory-empty.png" } },
  { "id": "preserve", "name": "保存", "cost": 1, "type": "defense", "rarity": "common", "target": "handCard", "description": "選擇一張手牌，使其在回合結束時保留。", "effectId": "preserve_card", "tags": ["retain"], "mutationKeys": ["obsession", "grudge"], "assets": { "cardArt": "cards/preserve.png", "memoryStickerSlot": "stickers/memory-empty.png" } },
  { "id": "recall", "name": "回想", "cost": 0, "type": "skill", "rarity": "basic", "target": "handCard", "description": "抽 1 張牌，並給一張手牌 1 點通用記憶進度。", "effectId": "recall_draw_memory", "tags": ["starter", "memory"], "mutationKeys": ["witness", "obsession", "grudge"], "assets": { "cardArt": "cards/recall.png", "memoryStickerSlot": "stickers/memory-empty.png" } },
  { "id": "organize_hand", "name": "整理手牌", "cost": 1, "type": "skill", "rarity": "common", "target": "handCard", "description": "棄掉最多 2 張手牌，再抽等量牌。", "effectId": "organize_hand_discard_draw", "tags": ["discard", "draw"], "mutationKeys": ["grudge", "obsession"], "assets": { "cardArt": "cards/organize_hand.png", "memoryStickerSlot": "stickers/memory-empty.png" } },
  { "id": "burning_notes", "name": "燃燒筆記", "cost": 1, "type": "skill", "rarity": "uncommon", "target": "handCard", "description": "消耗一張手牌，對一名敵人造成 8 點傷害。", "effectId": "burning_notes_exhaust_damage", "tags": ["exhaust"], "mutationKeys": ["grudge", "bloodthirst"], "assets": { "cardArt": "cards/burning_notes.png", "memoryStickerSlot": "stickers/memory-empty.png" } },
  { "id": "rewrite", "name": "複寫", "cost": 1, "type": "skill", "rarity": "rare", "target": "handCard", "description": "選擇一張手牌，本場戰鬥費用降低 1，最低為 0。", "effectId": "rewrite_reduce_cost", "tags": ["cost"], "mutationKeys": ["obsession", "witness"], "assets": { "cardArt": "cards/rewrite.png", "memoryStickerSlot": "stickers/memory-empty.png" } }
]
```

- [ ] **Step 2: Create `src/data/enemies.json`**

Use this exact file content:

```json
[
  { "id": "sticker_punk", "name": "貼紙龐克", "kind": "normal", "maxHp": 30, "intents": [{ "id": "slash", "type": "attack", "amount": 6, "weight": 3 }, { "id": "tag", "type": "debuff", "status": "weak", "amount": 1, "weight": 1 }], "assets": { "sprite": "enemies/sticker_punk.png", "intentAttack": "ui/intents/attack.png" } },
  { "id": "neon_mite", "name": "霓虹蟎", "kind": "normal", "maxHp": 24, "intents": [{ "id": "spark", "type": "attack", "amount": 5, "weight": 2 }, { "id": "charge", "type": "block", "amount": 5, "weight": 1 }], "assets": { "sprite": "enemies/neon_mite.png", "intentAttack": "ui/intents/attack.png" } },
  { "id": "paper_doll", "name": "紙偶", "kind": "normal", "maxHp": 34, "intents": [{ "id": "fold", "type": "block", "amount": 8, "weight": 1 }, { "id": "cut", "type": "attack", "amount": 7, "weight": 2 }], "assets": { "sprite": "enemies/paper_doll.png", "intentAttack": "ui/intents/attack.png" } },
  { "id": "static_busker", "name": "靜電街演者", "kind": "normal", "maxHp": 38, "intents": [{ "id": "buzz", "type": "attack", "amount": 6, "weight": 2 }, { "id": "noise", "type": "debuff", "status": "frail", "amount": 1, "weight": 1 }], "assets": { "sprite": "enemies/static_busker.png", "intentAttack": "ui/intents/attack.png" } },
  { "id": "tagged_hound", "name": "塗標獵犬", "kind": "normal", "maxHp": 42, "intents": [{ "id": "bite", "type": "attack", "amount": 8, "weight": 3 }, { "id": "howl", "type": "mixed", "amount": 4, "status": "vulnerable", "weight": 1 }], "assets": { "sprite": "enemies/tagged_hound.png", "intentAttack": "ui/intents/attack.png" } },
  { "id": "archive_brute", "name": "檔案暴徒", "kind": "elite", "maxHp": 86, "intents": [{ "id": "slam", "type": "attack", "amount": 14, "weight": 2 }, { "id": "brace", "type": "block", "amount": 12, "weight": 1 }, { "id": "tear", "type": "mixed", "amount": 9, "status": "frail", "weight": 1 }], "assets": { "sprite": "enemies/archive_brute.png", "intentAttack": "ui/intents/attack.png" } },
  { "id": "tower_heart", "name": "牌塔心臟", "kind": "boss", "maxHp": 180, "intents": [{ "id": "read", "type": "debuff", "status": "vulnerable", "amount": 2, "weight": 1 }, { "id": "pulse", "type": "attack", "amount": 16, "weight": 2 }, { "id": "harden", "type": "block", "amount": 15, "weight": 1 }], "assets": { "sprite": "enemies/tower_heart.png", "intentAttack": "ui/intents/attack.png" } }
]
```

- [ ] **Step 3: Create remaining data files**

Create `src/data/relics.json`:

```json
[
  { "id": "broken_notes", "name": "破碎筆記", "rarity": "starter", "description": "每場戰鬥結束後，使用最多次的一張牌獲得記憶進度。", "trigger": "combatEnd", "assets": { "icon": "relics/broken_notes.png" } },
  { "id": "neon_nail", "name": "霓虹釘", "rarity": "common", "description": "每場戰鬥第一次打出攻擊牌時造成 +2 傷害。", "trigger": "cardPlayed", "assets": { "icon": "relics/neon_nail.png" } },
  { "id": "sticker_charm", "name": "貼紙護符", "rarity": "common", "description": "每場戰鬥第一次獲得記憶時，獲得 3 格擋。", "trigger": "memoryGained", "assets": { "icon": "relics/sticker_charm.png" } },
  { "id": "old_ticket_stub", "name": "舊票根", "rarity": "uncommon", "description": "每個商人第一件商品打折。", "trigger": "shopOpened", "assets": { "icon": "relics/old_ticket_stub.png" } },
  { "id": "broken_recorder", "name": "壞掉的錄音機", "rarity": "rare", "description": "每局一次，休息點可額外變異一張牌。", "trigger": "restSite", "assets": { "icon": "relics/broken_recorder.png" } }
]
```

Create `src/data/contracts.json`:

```json
[
  { "id": "blood_contract", "name": "血契", "benefit": "立刻獲得 1 張稀有牌。", "cost": "接下來 3 場戰鬥開場失去 5 HP。", "trigger": "combatStart", "remainingUses": 3, "assets": { "icon": "ui/contracts/blood_contract.png" } },
  { "id": "debt_contract", "name": "債契", "benefit": "立刻獲得 100 金幣。", "cost": "下次商人價格提高 50%。", "trigger": "shopOpened", "remainingUses": 1, "assets": { "icon": "ui/contracts/debt_contract.png" } },
  { "id": "ink_contract", "name": "墨契", "benefit": "立即讓一張有記憶的牌變異。", "cost": "牌組加入 1 張詛咒牌。", "trigger": "immediate", "remainingUses": 1, "assets": { "icon": "ui/contracts/ink_contract.png" } },
  { "id": "blank_contract", "name": "空白契", "benefit": "移除一張牌。", "cost": "Boss 戰開場 Boss 獲得額外強化。", "trigger": "bossStart", "remainingUses": 1, "assets": { "icon": "ui/contracts/blank_contract.png" } }
]
```

Create `src/data/events.json`:

```json
[
  { "id": "neon_alley", "name": "霓虹巷", "body": "濕亮牆面上貼滿會眨眼的貼紙。", "options": [{ "id": "take_blood_contract", "label": "簽下血契", "description": "獲得稀有牌，但接下來 3 場戰鬥開場失去 HP。", "contractId": "blood_contract", "effectId": "event_gain_rare_card" }, { "id": "walk_away", "label": "離開", "description": "不發生任何事。", "effectId": "event_noop" }], "assets": { "eventImage": "events/neon_alley.png" } },
  { "id": "ink_market", "name": "墨市", "body": "小攤販把價格寫在一張會滲墨的票根上。", "options": [{ "id": "take_debt_contract", "label": "接受債契", "description": "獲得金幣，但下次商人價格提高。", "contractId": "debt_contract", "effectId": "event_gain_gold_100" }, { "id": "buy_memory", "label": "買一枚記憶貼紙", "description": "支付少量金幣，讓一張牌獲得記憶進度。", "effectId": "event_buy_memory_progress" }], "assets": { "eventImage": "events/ink_market.png" } },
  { "id": "blank_billboard", "name": "空白看板", "body": "一整面空白看板正在等待你的名字。", "options": [{ "id": "take_blank_contract", "label": "簽下空白契", "description": "移除一張牌，但 Boss 獲得強化。", "contractId": "blank_contract", "effectId": "event_remove_card" }, { "id": "paint_over", "label": "塗掉它", "description": "獲得少量金幣。", "effectId": "event_gain_gold_30" }], "assets": { "eventImage": "events/blank_billboard.png" } },
  { "id": "lost_station", "name": "失物站", "body": "失物箱裡傳來自己的聲音。", "options": [{ "id": "take_ink_contract", "label": "接受墨契", "description": "立即變異一張有記憶的牌，但加入詛咒。", "contractId": "ink_contract", "effectId": "event_mutate_card" }, { "id": "recover", "label": "取回一點東西", "description": "回復少量 HP。", "effectId": "event_heal_8" }], "assets": { "eventImage": "events/lost_station.png" } }
]
```

Create `src/data/mapRules.json`:

```json
{
  "floorCount": 12,
  "minNodesPerMiddleFloor": 2,
  "maxNodesPerMiddleFloor": 4,
  "bossFloor": 12,
  "firstFloorNodeType": "normalCombat",
  "requiredRestFloorMin": 6,
  "requiredRestFloorMax": 9,
  "lateSpecialFloorMin": 10,
  "lateSpecialFloorMax": 11,
  "maxConsecutiveNonCombat": 2
}
```

Create `src/data/assets.json`:

```json
{
  "placeholders": {
    "cardArt": "ui/placeholders/card-art.png",
    "character": "characters/seeker-placeholder.png",
    "enemySprite": "ui/placeholders/enemy-sprite.png",
    "relicIcon": "ui/placeholders/relic-icon.png",
    "eventImage": "ui/placeholders/event-image.png",
    "memorySticker": "stickers/memory-empty.png",
    "uiIcon": "ui/placeholders/ui-icon.png"
  },
  "ui": {
    "nodeNormalCombat": "ui/nodes/normal-combat.png",
    "nodeEliteCombat": "ui/nodes/elite-combat.png",
    "nodeEvent": "ui/nodes/event.png",
    "nodeRest": "ui/nodes/rest.png",
    "nodeShop": "ui/nodes/shop.png",
    "nodeBoss": "ui/nodes/boss.png",
    "intentAttack": "ui/intents/attack.png",
    "intentBlock": "ui/intents/block.png",
    "intentDebuff": "ui/intents/debuff.png"
  },
  "audio": {
    "cardPlayed": "audio/sfx/card-played.ogg",
    "damage": "audio/sfx/damage.ogg",
    "memoryGained": "audio/sfx/memory-gained.ogg",
    "mutation": "audio/sfx/mutation.ogg",
    "victory": "audio/sfx/victory.ogg",
    "failure": "audio/sfx/failure.ogg",
    "bgm": "audio/bgm/main-loop.ogg"
  }
}
```

- [ ] **Step 4: Run test to verify loader is still missing**

Run:

```bash
npm test -- tests/core/dataValidation.test.ts
```

Expected: FAIL because `loadGameData` is still missing.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/data/cards.json src/data/enemies.json src/data/relics.json src/data/contracts.json src/data/events.json src/data/mapRules.json src/data/assets.json
git commit -m "feat: add MVP data tables"
```

## Task 4: Implement Data Loading And Validation

**Files:**
- Create: `src/core/data/validate.ts`
- Create: `src/core/data/loadGameData.ts`
- Modify: `src/core/index.ts`
- Test: `tests/core/dataValidation.test.ts`

- [ ] **Step 1: Add validation-specific tests**

Append this test to `tests/core/dataValidation.test.ts`:

```ts
import { validateGameData } from "../../src/core/data/validate";

describe("validateGameData", () => {
  it("rejects duplicate ids inside a table", () => {
    const data = loadGameData();
    const duplicated = {
      ...data,
      cards: [data.cards[0], data.cards[0]]
    };

    expect(() => validateGameData(duplicated)).toThrow("Duplicate card id: strike");
  });

  it("rejects card effect ids missing from the known MVP effect id list", () => {
    const data = loadGameData();
    const invalid = {
      ...data,
      cards: [{ ...data.cards[0], effectId: "missing_effect" }]
    };

    expect(() => validateGameData(invalid)).toThrow("Unknown card effect id: missing_effect");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/core/dataValidation.test.ts
```

Expected: FAIL because `loadGameData` and `validateGameData` are missing.

- [ ] **Step 3: Create `src/core/data/validate.ts`**

Create `src/core/data/validate.ts`:

```ts
import type { CardDefinition, ContractDefinition, EnemyDefinition, EventDefinition, GameData, RelicDefinition } from "../types";

const CARD_EFFECT_IDS = new Set([
  "deal_damage_6",
  "deal_damage_5_apply_vulnerable_1",
  "deal_all_damage_4",
  "countercut_damage",
  "memory_blade_damage",
  "terminus_damage",
  "gain_block_5",
  "gain_block_4_apply_weak_1",
  "stacked_defense_block",
  "reflect_shield_block_spike",
  "preserve_card",
  "recall_draw_memory",
  "organize_hand_discard_draw",
  "burning_notes_exhaust_damage",
  "rewrite_reduce_cost"
]);

function assertUnique<T extends { id: string }>(label: string, rows: T[]) {
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.id)) {
      throw new Error(`Duplicate ${label} id: ${row.id}`);
    }
    seen.add(row.id);
  }
}

function assertCards(cards: CardDefinition[]) {
  if (cards.length !== 15) {
    throw new Error(`Expected 15 cards, got ${cards.length}`);
  }

  for (const card of cards) {
    if (!CARD_EFFECT_IDS.has(card.effectId)) {
      throw new Error(`Unknown card effect id: ${card.effectId}`);
    }
    if (card.cost < 0) {
      throw new Error(`Card cost cannot be negative: ${card.id}`);
    }
    if (!card.assets.cardArt) {
      throw new Error(`Card missing cardArt asset: ${card.id}`);
    }
  }
}

function assertEnemies(enemies: EnemyDefinition[]) {
  const normalCount = enemies.filter((enemy) => enemy.kind === "normal").length;
  const eliteCount = enemies.filter((enemy) => enemy.kind === "elite").length;
  const bossCount = enemies.filter((enemy) => enemy.kind === "boss").length;

  if (normalCount !== 5 || eliteCount !== 1 || bossCount !== 1) {
    throw new Error(`Expected enemies normal=5 elite=1 boss=1, got normal=${normalCount} elite=${eliteCount} boss=${bossCount}`);
  }

  for (const enemy of enemies) {
    if (enemy.maxHp <= 0) {
      throw new Error(`Enemy maxHp must be positive: ${enemy.id}`);
    }
    if (enemy.intents.length === 0) {
      throw new Error(`Enemy must have at least one intent: ${enemy.id}`);
    }
    if (!enemy.assets.sprite) {
      throw new Error(`Enemy missing sprite asset: ${enemy.id}`);
    }
  }
}

function assertRelics(relics: RelicDefinition[]) {
  if (relics.length !== 5) {
    throw new Error(`Expected 5 relics, got ${relics.length}`);
  }
}

function assertContracts(contracts: ContractDefinition[]) {
  if (contracts.length !== 4) {
    throw new Error(`Expected 4 contracts, got ${contracts.length}`);
  }
}

function assertEvents(events: EventDefinition[], contracts: ContractDefinition[]) {
  if (events.length !== 4) {
    throw new Error(`Expected 4 events, got ${events.length}`);
  }

  const contractIds = new Set(contracts.map((contract) => contract.id));
  for (const event of events) {
    if (event.options.length < 2) {
      throw new Error(`Event must have at least two options: ${event.id}`);
    }
    for (const option of event.options) {
      if (option.contractId && !contractIds.has(option.contractId)) {
        throw new Error(`Event option references unknown contract: ${option.contractId}`);
      }
    }
  }
}

export function validateGameData(data: GameData): GameData {
  assertUnique("card", data.cards);
  assertUnique("enemy", data.enemies);
  assertUnique("relic", data.relics);
  assertUnique("contract", data.contracts);
  assertUnique("event", data.events);
  assertCards(data.cards);
  assertEnemies(data.enemies);
  assertRelics(data.relics);
  assertContracts(data.contracts);
  assertEvents(data.events, data.contracts);

  if (data.mapRules.floorCount !== 12 || data.mapRules.bossFloor !== 12) {
    throw new Error("Map rules must define a 12-floor tower with Boss on floor 12");
  }

  return data;
}

export const knownCardEffectIds = CARD_EFFECT_IDS;
```

- [ ] **Step 4: Create `src/core/data/loadGameData.ts`**

Create `src/core/data/loadGameData.ts`:

```ts
import assets from "../../data/assets.json";
import cards from "../../data/cards.json";
import contracts from "../../data/contracts.json";
import enemies from "../../data/enemies.json";
import events from "../../data/events.json";
import mapRules from "../../data/mapRules.json";
import relics from "../../data/relics.json";
import type { GameData } from "../types";
import { validateGameData } from "./validate";

export function loadGameData(): GameData {
  return validateGameData({
    cards,
    enemies,
    relics,
    contracts,
    events,
    mapRules,
    assets
  } as GameData);
}
```

- [ ] **Step 5: Export loader and validator**

Modify `src/core/index.ts`:

```ts
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
```

- [ ] **Step 6: Run test to verify it passes**

Run:

```bash
npm test -- tests/core/dataValidation.test.ts
```

Expected: PASS.

- [ ] **Step 7: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add src/core/data/validate.ts src/core/data/loadGameData.ts src/core/index.ts tests/core/dataValidation.test.ts
git commit -m "feat: validate bundled game data"
```

## Task 5: Add Deterministic RNG

**Files:**
- Create: `src/core/rng.ts`
- Modify: `src/core/index.ts`
- Create: `tests/core/rng.test.ts`

- [ ] **Step 1: Write RNG tests**

Create `tests/core/rng.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createRng, pickWeighted, shuffle } from "../../src/core";

describe("deterministic RNG", () => {
  it("returns the same sequence for the same seed", () => {
    const a = createRng(12345);
    const b = createRng(12345);

    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });

  it("shuffles deterministically without mutating input", () => {
    const input = ["a", "b", "c", "d"];
    const output = shuffle(input, createRng(7));

    expect(input).toEqual(["a", "b", "c", "d"]);
    expect(output).toEqual(shuffle(input, createRng(7)));
    expect(output).not.toEqual(input);
  });

  it("picks weighted entries deterministically", () => {
    const result = pickWeighted(
      [
        { value: "low", weight: 1 },
        { value: "high", weight: 9 }
      ],
      createRng(3)
    );

    expect(result).toBe("high");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/core/rng.test.ts
```

Expected: FAIL because RNG exports are missing.

- [ ] **Step 3: Create `src/core/rng.ts`**

Create `src/core/rng.ts`:

```ts
export interface Rng {
  next(): number;
  nextInt(maxExclusive: number): number;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  return {
    next() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    },
    nextInt(maxExclusive: number) {
      if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
        throw new Error(`maxExclusive must be a positive integer, got ${maxExclusive}`);
      }
      return Math.floor(this.next() * maxExclusive);
    }
  };
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = rng.nextInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickWeighted<T>(items: readonly { value: T; weight: number }[], rng: Rng): T {
  if (items.length === 0) {
    throw new Error("Cannot pick from an empty weighted list");
  }

  const total = items.reduce((sum, item) => {
    if (item.weight <= 0) {
      throw new Error(`Weight must be positive, got ${item.weight}`);
    }
    return sum + item.weight;
  }, 0);

  let roll = rng.next() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) {
      return item.value;
    }
  }

  return items[items.length - 1].value;
}
```

- [ ] **Step 4: Export RNG helpers**

Append to `src/core/index.ts`:

```ts
export { createRng, pickWeighted, shuffle } from "./rng";
export type { Rng } from "./rng";
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
npm test -- tests/core/rng.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run all core tests**

Run:

```bash
npm test -- tests/core
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/core/rng.ts src/core/index.ts tests/core/rng.test.ts
git commit -m "feat: add deterministic core rng"
```

## Task 6: Add Effect Registry Scaffolding

**Files:**
- Create: `src/core/effects/effectRegistry.ts`
- Modify: `src/core/index.ts`
- Create: `tests/core/effectRegistry.test.ts`

- [ ] **Step 1: Write effect registry tests**

Create `tests/core/effectRegistry.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createEffectRegistry, loadGameData, registerMvpEffectPlaceholders } from "../../src/core";

describe("effect registry", () => {
  it("registers every MVP card effect id", () => {
    const registry = createEffectRegistry();
    registerMvpEffectPlaceholders(registry);

    const data = loadGameData();
    for (const card of data.cards) {
      expect(registry.has(card.effectId)).toBe(true);
    }
  });

  it("rejects duplicate effect ids", () => {
    const registry = createEffectRegistry();
    registry.register("deal_damage_6", () => ({ events: [] }));

    expect(() => registry.register("deal_damage_6", () => ({ events: [] }))).toThrow("Effect already registered: deal_damage_6");
  });

  it("throws when resolving an unknown effect", () => {
    const registry = createEffectRegistry();

    expect(() => registry.resolve("missing")).toThrow("Unknown effect id: missing");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/core/effectRegistry.test.ts
```

Expected: FAIL because effect registry exports are missing.

- [ ] **Step 3: Create `src/core/effects/effectRegistry.ts`**

Create `src/core/effects/effectRegistry.ts`:

```ts
import { knownCardEffectIds } from "../data/validate";

export interface EffectResult {
  events: readonly { type: string; payload?: unknown }[];
}

export type EffectHandler = () => EffectResult;

export interface EffectRegistry {
  register(effectId: string, handler: EffectHandler): void;
  has(effectId: string): boolean;
  resolve(effectId: string): EffectHandler;
  ids(): string[];
}

export function createEffectRegistry(): EffectRegistry {
  const handlers = new Map<string, EffectHandler>();

  return {
    register(effectId, handler) {
      if (handlers.has(effectId)) {
        throw new Error(`Effect already registered: ${effectId}`);
      }
      handlers.set(effectId, handler);
    },
    has(effectId) {
      return handlers.has(effectId);
    },
    resolve(effectId) {
      const handler = handlers.get(effectId);
      if (!handler) {
        throw new Error(`Unknown effect id: ${effectId}`);
      }
      return handler;
    },
    ids() {
      return [...handlers.keys()].sort();
    }
  };
}

export function registerMvpEffectPlaceholders(registry: EffectRegistry): EffectRegistry {
  for (const effectId of knownCardEffectIds) {
    registry.register(effectId, () => ({
      events: [{ type: "EFFECT_PLACEHOLDER_RESOLVED", payload: { effectId } }]
    }));
  }
  return registry;
}
```

- [ ] **Step 4: Export effect registry helpers**

Append to `src/core/index.ts`:

```ts
export { createEffectRegistry, registerMvpEffectPlaceholders } from "./effects/effectRegistry";
export type { EffectHandler, EffectRegistry, EffectResult } from "./effects/effectRegistry";
```

- [ ] **Step 5: Run effect registry tests**

Run:

```bash
npm test -- tests/core/effectRegistry.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run all core tests**

Run:

```bash
npm test -- tests/core
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/core/effects/effectRegistry.ts src/core/index.ts tests/core/effectRegistry.test.ts
git commit -m "feat: add card effect registry scaffold"
```

## Task 7: Add Asset Registry

**Files:**
- Create: `src/core/assets/assetRegistry.ts`
- Modify: `src/core/index.ts`
- Create: `tests/core/assetRegistry.test.ts`

- [ ] **Step 1: Write asset registry tests**

Create `tests/core/assetRegistry.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createAssetRegistry, loadGameData } from "../../src/core";

describe("asset registry", () => {
  it("resolves card art texture keys from data", () => {
    const registry = createAssetRegistry(loadGameData());

    expect(registry.getCardArt("strike")).toEqual({
      key: "card:strike:art",
      path: "/assets/cards/strike.png"
    });
  });

  it("resolves enemy sprite texture keys from data", () => {
    const registry = createAssetRegistry(loadGameData());

    expect(registry.getEnemySprite("tower_heart")).toEqual({
      key: "enemy:tower_heart:sprite",
      path: "/assets/enemies/tower_heart.png"
    });
  });

  it("returns placeholder entries for unknown content ids", () => {
    const registry = createAssetRegistry(loadGameData());

    expect(registry.getCardArt("missing")).toEqual({
      key: "placeholder:cardArt",
      path: "/assets/ui/placeholders/card-art.png"
    });
  });

  it("lists preloadable asset entries without duplicate keys", () => {
    const registry = createAssetRegistry(loadGameData());
    const entries = registry.listPreloadEntries();
    const keys = entries.map((entry) => entry.key);

    expect(keys).toContain("card:strike:art");
    expect(keys).toContain("enemy:tower_heart:sprite");
    expect(new Set(keys).size).toBe(keys.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- tests/core/assetRegistry.test.ts
```

Expected: FAIL because asset registry exports are missing.

- [ ] **Step 3: Create `src/core/assets/assetRegistry.ts`**

Create `src/core/assets/assetRegistry.ts`:

```ts
import type { GameData } from "../types";

export interface AssetEntry {
  key: string;
  path: string;
}

export interface AssetRegistry {
  getCardArt(cardId: string): AssetEntry;
  getEnemySprite(enemyId: string): AssetEntry;
  getRelicIcon(relicId: string): AssetEntry;
  getEventImage(eventId: string): AssetEntry;
  getPlaceholder(slot: string): AssetEntry;
  listPreloadEntries(): AssetEntry[];
}

function assetPath(path: string): string {
  return `/assets/${path}`;
}

function uniqueEntries(entries: AssetEntry[]): AssetEntry[] {
  const byKey = new Map<string, AssetEntry>();
  for (const entry of entries) {
    byKey.set(entry.key, entry);
  }
  return [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export function createAssetRegistry(data: GameData): AssetRegistry {
  const cards = new Map(data.cards.map((card) => [card.id, card]));
  const enemies = new Map(data.enemies.map((enemy) => [enemy.id, enemy]));
  const relics = new Map(data.relics.map((relic) => [relic.id, relic]));
  const events = new Map(data.events.map((event) => [event.id, event]));

  function placeholder(slot: string): AssetEntry {
    const path = data.assets.placeholders[slot] ?? data.assets.placeholders.uiIcon;
    return { key: `placeholder:${slot}`, path: assetPath(path) };
  }

  return {
    getCardArt(cardId) {
      const card = cards.get(cardId);
      return card?.assets.cardArt ? { key: `card:${cardId}:art`, path: assetPath(card.assets.cardArt) } : placeholder("cardArt");
    },
    getEnemySprite(enemyId) {
      const enemy = enemies.get(enemyId);
      return enemy?.assets.sprite ? { key: `enemy:${enemyId}:sprite`, path: assetPath(enemy.assets.sprite) } : placeholder("enemySprite");
    },
    getRelicIcon(relicId) {
      const relic = relics.get(relicId);
      return relic?.assets.icon ? { key: `relic:${relicId}:icon`, path: assetPath(relic.assets.icon) } : placeholder("relicIcon");
    },
    getEventImage(eventId) {
      const event = events.get(eventId);
      return event?.assets.eventImage ? { key: `event:${eventId}:image`, path: assetPath(event.assets.eventImage) } : placeholder("eventImage");
    },
    getPlaceholder(slot) {
      return placeholder(slot);
    },
    listPreloadEntries() {
      const entries: AssetEntry[] = [
        ...data.cards.map((card) => this.getCardArt(card.id)),
        ...data.enemies.map((enemy) => this.getEnemySprite(enemy.id)),
        ...data.relics.map((relic) => this.getRelicIcon(relic.id)),
        ...data.events.map((event) => this.getEventImage(event.id)),
        ...Object.keys(data.assets.placeholders).map((slot) => placeholder(slot)),
        ...Object.entries(data.assets.ui).map(([id, path]) => ({ key: `ui:${id}`, path: assetPath(path) })),
        ...Object.entries(data.assets.audio).map(([id, path]) => ({ key: `audio:${id}`, path: assetPath(path) }))
      ];
      return uniqueEntries(entries);
    }
  };
}
```

- [ ] **Step 4: Export asset registry helpers**

Append to `src/core/index.ts`:

```ts
export { createAssetRegistry } from "./assets/assetRegistry";
export type { AssetEntry, AssetRegistry } from "./assets/assetRegistry";
```

- [ ] **Step 5: Run asset registry tests**

Run:

```bash
npm test -- tests/core/assetRegistry.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run all tests and build**

Run:

```bash
npm test -- tests/core
npm run build
```

Expected: both commands PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/core/assets/assetRegistry.ts src/core/index.ts tests/core/assetRegistry.test.ts
git commit -m "feat: add data-driven asset registry"
```

## Task 8: Final Core Foundation Review

**Files:**
- Inspect: `src/core/index.ts`
- Inspect: `src/core/types.ts`
- Inspect: `src/data/*.json`
- Inspect: `tests/core/*.test.ts`
- Modify only if a check fails.

- [ ] **Step 1: Verify no Phaser import entered the core**

Run:

```bash
rg -n "from ['\\\"]phaser|from ['\\\"]Phaser|import Phaser" src/core tests/core
```

Expected: no matches and exit code 1.

- [ ] **Step 2: Verify all planned data ids exist**

Run:

```bash
node -e "const fs=require('fs'); const cards=JSON.parse(fs.readFileSync('src/data/cards.json','utf8')); const enemies=JSON.parse(fs.readFileSync('src/data/enemies.json','utf8')); console.log(cards.map(c=>c.id).join(',')); console.log(enemies.map(e=>e.id).join(','));"
```

Expected output contains:

```text
strike,pierce,sweep,countercut,memory_blade,terminus,guard,dodge,stacked_defense,reflect_shield,preserve,recall,organize_hand,burning_notes,rewrite
sticker_punk,neon_mite,paper_doll,static_busker,tagged_hound,archive_brute,tower_heart
```

- [ ] **Step 3: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit any review fixes**

If Step 1 through Step 4 required edits, run:

```bash
git add src/core src/data tests package.json package-lock.json tsconfig.json
git commit -m "chore: finalize core foundation"
```

If Step 1 through Step 4 required no edits, do not create an empty commit.

## Self-Review Checklist

- Spec coverage: this plan covers framework-neutral core boundaries, JSON data tables, card/enemy/relic/event/contract/map/assets data, effect registry scaffolding, asset replacement rules, deterministic test support, and core unit test harness.
- Deferred to later plans: combat resolution, map generation implementation, event execution, memory mutation behavior, relic triggers, Boss habit analysis, Phaser UI, audio playback, and Playwright E2E.
- Placeholder scan: every task includes concrete file paths, code, commands, and expected results.
- Type consistency: `CardDefinition`, `EnemyDefinition`, `GameData`, `EffectRegistry`, and `AssetRegistry` names match between test snippets and implementation snippets.
