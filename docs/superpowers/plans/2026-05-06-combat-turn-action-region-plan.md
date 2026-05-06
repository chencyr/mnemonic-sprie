# Combat Turn Action Region Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Per `AGENTS.md`, any use of `superpowers:executing-plans` in this project must also use the `develop-web-game` workflow.

**Goal:** Build the battle screen right-bottom turn action region as a real asset-backed UI device that shows turn, energy, end-turn availability, auto-end status, enemy phase status, and victory presentation status.

**Architecture:** Keep combat rules framework-neutral in `src/core/` through a query API that Phaser can call. Keep transition-only presentation state in Phaser and map it through a small UI snapshot adapter before rendering the asset-backed panel. Register all new image assets through `docs/assets/image-generation-prompts.jsonl`, `src/data/assets.json`, and `src/core/assets/assetRegistry.ts`.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest, Playwright E2E, Codex in-app browser / develop-web-game verification.

**Current visual tuning rule:** During manual or auto turn transition, the main button swaps to the `敵方回合` label asset instead of showing debug-style transition text. The large button plate is rotated left about 20 degrees while the label remains unrotated and about 5% smaller. The turn/energy frame is about half the previous visual size and left-aligns to the large button's left edge.

---

## File Structure

- Create `src/core/combat/turnActionState.ts`
  - Owns `getCombatTurnActionState(engine)`, `canAnyCombatHandCardPlay(data, combat)`, and `combatCardPlayabilityReason(data, combat, cardInstanceId)`.
  - This file is framework-neutral and must not import Phaser.
- Modify `src/core/index.ts`
  - Re-export the new turn action query functions and types.
- Modify `src/phaser/input/cardPlayRules.ts`
  - Remove duplicated hand-card playability logic and call the new core helpers.
  - Keep drag/drop zone resolution in Phaser because it depends on pointer zones.
- Create `tests/core/turnActionState.test.ts`
  - Tests query states for non-combat, player-ready, no-playable-card, enemy phase, victory phase, and defeat phase.
- Create `src/phaser/ui/TurnActionView.ts`
  - Owns `deriveTurnActionUiSnapshot()` and `renderTurnActionView()`.
  - Renders the proposal-1-inspired button plate, separate label sprites, turn/energy frame, and repeated energy lightning icons.
- Create `tests/phaser/turnActionView.test.ts`
  - Tests presentation mapping for manual end, auto end, enemy phase, victory presentation, player ready, and no-playable states.
- Modify `src/core/assets/assetRegistry.ts`
  - Add typed combat UI asset keys for the five new turn action assets.
- Modify `src/data/assets.json`
  - Add the five new UI asset entries.
- Modify `tests/core/assetRegistry.test.ts`
  - Assert the five new entries resolve and preload.
- Modify `docs/assets/image-generation-prompts.jsonl`
  - Add exact prompt lines for the five new assets.
- Create image assets during execution:
  - `public/assets/ui/combat/end-turn-button-plate.png`
  - `public/assets/ui/combat/end-turn-label.png`
  - `public/assets/ui/combat/enemy-turn-label.png`
  - `public/assets/ui/combat/turn-energy-frame.png`
  - `public/assets/ui/combat/energy-lightning-icon.png`
- Modify `src/scenes/GameScene.ts`
  - Replace `renderCombatTurnDevice()` and the direct `this.button("end-turn", ...)` call with `renderTurnActionView()`.
  - Add `turnActionUi` to `window.render_game_to_text()`.
  - Keep `測試勝利` in the left-bottom quick-control area when `?e2e=1`.
- Modify `tests/e2e/fullRunSmoke.mjs`
  - Assert the new turn action roles and `turnActionUi` states.
  - Keep the quick win control left-bottom and separate from the formal turn action panel.
- Modify `progress.md`
  - Record task progress while executing.
- Move backlog files:
  - From `backlogs/22-combat-turn-action-region-backlog.md`
  - To `backlogs/in-progress/22-combat-turn-action-region-backlog.md`
  - Later to `backlogs/done/22-combat-turn-action-region-backlog.md`

---

## Task 0: Start Worktree And Backlog State

**Files:**
- Move: `backlogs/22-combat-turn-action-region-backlog.md`
- Modify: `progress.md`

- [ ] **Step 1: Confirm current branch and cleanliness**

Run:

```bash
git status --short --branch
git log --oneline -3
```

Expected:

```text
## main...origin/main [ahead 1]
d46d94d docs: design combat turn action region
```

If unrelated user changes are present, leave them untouched and continue only if they do not overlap with this backlog.

- [ ] **Step 2: Create the implementation worktree**

Run from `/Users/rexchen/Game/mnemonic-spire`:

```bash
git worktree add ../mnemonic-spire-turn-action -b feature/combat-turn-action-region
```

Expected:

```text
Preparing worktree (new branch 'feature/combat-turn-action-region')
HEAD is now at d46d94d docs: design combat turn action region
```

- [ ] **Step 3: Move the backlog into in-progress**

Run inside `/Users/rexchen/Game/mnemonic-spire-turn-action`:

```bash
mkdir -p backlogs/in-progress
git mv backlogs/22-combat-turn-action-region-backlog.md backlogs/in-progress/22-combat-turn-action-region-backlog.md
```

- [ ] **Step 4: Record execution start**

Append this exact entry to `progress.md`:

```md

## 2026-05-06 Combat Turn Action Region

- Started `22-combat-turn-action-region`.
- Worktree: `/Users/rexchen/Game/mnemonic-spire-turn-action`
- Branch: `feature/combat-turn-action-region`
- Plan: `docs/superpowers/plans/2026-05-06-combat-turn-action-region-plan.md`
- Required workflow: `superpowers:executing-plans` + `develop-web-game`.
```

- [ ] **Step 5: Commit backlog start**

Run:

```bash
git add backlogs/in-progress/22-combat-turn-action-region-backlog.md progress.md
git commit -m "docs: start combat turn action backlog"
```

Expected:

```text
[feature/combat-turn-action-region ...] docs: start combat turn action backlog
```

---

## Task 1: Core Turn Action Query API

**Files:**
- Create: `src/core/combat/turnActionState.ts`
- Modify: `src/core/index.ts`
- Modify: `src/phaser/input/cardPlayRules.ts`
- Test: `tests/core/turnActionState.test.ts`
- Test: `tests/phaser/cardPlayRules.test.ts`

- [ ] **Step 1: Write failing core tests**

Create `tests/core/turnActionState.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  createRun,
  getCombatTurnActionState,
  loadGameData,
  selectMapNode,
  startRun,
  type CardInstance,
  type CombatState
} from "../../src/core";

const data = loadGameData();

function combatEngine() {
  const engine = createRun(data, { seed: 20260505, quick: true });
  startRun(engine);
  selectMapNode(engine, engine.run.reachableNodeIds[0]);
  if (!engine.run.currentCombat) throw new Error("fixture did not enter combat");
  return engine;
}

function card(instanceId: string, cardId: string): CardInstance {
  return {
    instanceId,
    cardId,
    memory: { bloodthirst: 0, desperation: 0, grudge: 0, obsession: 0, witness: 0 },
    combatCostDelta: 0,
    retained: false,
    retainedStreak: 0,
    usedThisCombat: 0,
    discardedThisCombat: 0,
    exhausted: false
  };
}

function setHand(combat: CombatState, cards: CardInstance[]) {
  combat.cards = cards;
  combat.hand = cards.map((item) => item.instanceId);
  combat.drawPile = [];
  combat.discardPile = [];
}

describe("combat turn action state", () => {
  it("returns notCombat outside combat", () => {
    const engine = createRun(data, { seed: 1, quick: true });

    expect(getCombatTurnActionState(engine)).toEqual({
      mode: "notCombat",
      maxEnergy: 3,
      canEndTurn: false,
      canPlayAnyHandCard: false,
      endTurnDisabledReason: "不在戰鬥中。",
      suggestedUiState: "notCombat"
    });
  });

  it("reports playerReady when at least one hand card can be played", () => {
    const engine = combatEngine();
    const combat = engine.run.currentCombat!;
    combat.phase = "player";
    combat.player.energy = 3;
    setHand(combat, [card("strike-1", "strike")]);

    expect(getCombatTurnActionState(engine)).toMatchObject({
      mode: "combat",
      combatPhase: "player",
      turn: combat.turn,
      energy: 3,
      maxEnergy: 3,
      canEndTurn: true,
      canPlayAnyHandCard: true,
      suggestedUiState: "playerReady"
    });
  });

  it("reports playerNoPlayableCards when the player has no legal plays", () => {
    const engine = combatEngine();
    const combat = engine.run.currentCombat!;
    combat.phase = "player";
    combat.player.energy = 0;
    setHand(combat, [card("strike-1", "strike")]);

    expect(getCombatTurnActionState(engine)).toMatchObject({
      mode: "combat",
      combatPhase: "player",
      energy: 0,
      canEndTurn: true,
      canPlayAnyHandCard: false,
      suggestedUiState: "playerNoPlayableCards"
    });
  });

  it("disables end turn during enemy phase", () => {
    const engine = combatEngine();
    const combat = engine.run.currentCombat!;
    combat.phase = "enemy";

    expect(getCombatTurnActionState(engine)).toMatchObject({
      mode: "combat",
      combatPhase: "enemy",
      canEndTurn: false,
      endTurnDisabledReason: "敵人行動中。",
      suggestedUiState: "enemyPhase"
    });
  });

  it("disables end turn during victory and defeat phases", () => {
    const victoryEngine = combatEngine();
    victoryEngine.run.currentCombat!.phase = "victory";
    expect(getCombatTurnActionState(victoryEngine)).toMatchObject({
      canEndTurn: false,
      endTurnDisabledReason: "勝利處理中。",
      suggestedUiState: "victory"
    });

    const defeatEngine = combatEngine();
    defeatEngine.run.currentCombat!.phase = "defeat";
    expect(getCombatTurnActionState(defeatEngine)).toMatchObject({
      canEndTurn: false,
      endTurnDisabledReason: "失敗處理中。",
      suggestedUiState: "defeat"
    });
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm test -- tests/core/turnActionState.test.ts
```

Expected:

```text
FAIL tests/core/turnActionState.test.ts
Error: Failed to resolve import "../../src/core"
```

or:

```text
getCombatTurnActionState is not exported
```

- [ ] **Step 3: Implement the core query**

Create `src/core/combat/turnActionState.ts`:

```ts
import { effectiveCardCost } from "./combatEngine";
import { isEnemyAlive } from "./enemyState";
import type { CardDefinition, GameData } from "../types";
import type { RunEngine } from "../run/runEngine";
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
  const disabledReason = canEndTurn ? undefined : endTurnDisabledReason(combat.phase);

  return {
    mode: "combat",
    combatPhase: combat.phase,
    turn: combat.turn,
    energy: combat.player.energy,
    maxEnergy: MVP_MAX_ENERGY,
    canEndTurn,
    canPlayAnyHandCard,
    endTurnDisabledReason: disabledReason,
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
  if ((definition.target === "singleEnemy" || definition.target === "allEnemies") && !combat.enemies.some(isEnemyAlive)) return "沒有可攻擊目標。";
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
```

- [ ] **Step 4: Export the core query**

Modify `src/core/index.ts` by adding:

```ts
export { canAnyCombatHandCardPlay, combatCardPlayabilityReason, getCombatTurnActionState } from "./combat/turnActionState";
export type { CombatTurnActionState, CombatTurnActionSuggestedUiState } from "./combat/turnActionState";
```

- [ ] **Step 5: Reuse core playability in Phaser drag rules**

Modify the import in `src/phaser/input/cardPlayRules.ts`:

```ts
import {
  combatCardPlayabilityReason,
  effectiveCardCost,
  isEnemyAlive,
  type CardDefinition,
  type CardInstance,
  type CombatState,
  type EnemyInstance,
  type GameData
} from "../../core";
```

Replace `canAnyHandCardPlay()` and `playabilityReason()` with:

```ts
export function canAnyHandCardPlay(data: GameData, combat: CombatState): boolean {
  return combat.hand.some((cardInstanceId) => playabilityReason(data, combat, cardInstanceId) === undefined);
}

export function playabilityReason(data: GameData, combat: CombatState, cardInstanceId: string): string | undefined {
  return combatCardPlayabilityReason(data, combat, cardInstanceId);
}
```

Keep `findAutoEnemyTarget()`, `resolveDraggedCardPlay()`, `livingEnemyId()`, and `targetHandCard()` in this file.

- [ ] **Step 6: Run unit tests**

Run:

```bash
npm test -- tests/core/turnActionState.test.ts tests/phaser/cardPlayRules.test.ts
```

Expected:

```text
PASS tests/core/turnActionState.test.ts
PASS tests/phaser/cardPlayRules.test.ts
```

- [ ] **Step 7: Commit core query**

Run:

```bash
git add src/core/combat/turnActionState.ts src/core/index.ts src/phaser/input/cardPlayRules.ts tests/core/turnActionState.test.ts
git commit -m "feat: add combat turn action state query"
```

---

## Task 2: Asset Specs, Registry, And Runtime Entries

**Files:**
- Modify: `docs/assets/image-generation-prompts.jsonl`
- Modify: `src/data/assets.json`
- Modify: `src/core/assets/assetRegistry.ts`
- Modify: `tests/core/assetRegistry.test.ts`

- [ ] **Step 1: Add exact image generation prompt lines**

Append or update these five JSONL lines in `docs/assets/image-generation-prompts.jsonl`:

```jsonl
{"output":"public/assets/ui/combat/end-turn-button-plate.png","size":"340x180","background":"transparent","reference":"externals/battle-design-proposal-1.png","prompt":"Draw a new complete large end-turn button asset inspired by the proposal-1 right-bottom UI, not a crop and not a sliced reuse. The asset is one coherent transparent UI plate with a taller vertical presence: big cyan skewed polygon button body, thick white inner border, rough black marker outline and scratches, hot magenta sticker backing offset behind it, and energetic surrounding explosion/sticker burst effects in yellow, white, black, and magenta around the outside edges. The button body should feel chunky and tall, not flat or thin, with enough vertical room for a large separate Phaser text sprite. The center must remain clean and empty. Composition should already include the full button and surrounding burst in one image with balanced padding; no later programmatic cropping should be required. No readable text, no numbers, no letters, no lightning icons, no faces, no mascots, no cards, no enemies, no watermark. Crisp transparent edges, same cyan/magenta/yellow/black street-arcade palette as proposal-1."}
{"output":"public/assets/ui/combat/end-turn-label.png","size":"220x72","background":"transparent","reference":"externals/battle-design-proposal-1.png","prompt":"Transparent Chinese text sprite for the end-turn button, matching the right-bottom UI in proposal-1 almost exactly. Text must read exactly: 結束回合. Use bold heavy black Japanese arcade/graffiti lettering, slight rough marker distress, no background plate, no outline box, no extra words, no numbers, no icons, no watermark. Keep the text centered, crisp, readable at game UI size, with transparent padding for Phaser placement."}
{"output":"public/assets/ui/combat/enemy-turn-label.png","size":"220x72","background":"transparent","reference":"externals/battle-design-proposal-1.png","prompt":"Transparent Chinese text sprite for enemy phase state, designed as a sibling of the proposal-1 end-turn label. Text must read exactly: 敵方回合. Use bold heavy black Japanese arcade/graffiti lettering, slight rough marker distress, no background plate, no outline box, no extra words, no numbers, no icons, no watermark. Keep the text centered, crisp, readable at game UI size, with transparent padding for Phaser placement."}
{"output":"public/assets/ui/combat/turn-energy-frame.png","size":"300x96","background":"transparent","reference":"externals/battle-design-proposal-1.png","prompt":"Transparent top status frame extracted from the right-bottom proposal-1 UI: a black glass horizontal rounded-angled rectangle with thin gold/yellow border, small beveled corner cuts, subtle grunge scuffs, and empty interior space for Phaser-rendered 回合 and 能量 labels. Do not include lightning icons, text, numbers, letters, energy pips, button plate, characters, face, cards, enemies, or watermark. Match proposal-1 proportions and gold trim closely; crisp transparent edges."}
{"output":"public/assets/ui/combat/energy-lightning-icon.png","size":"64x64","background":"transparent","reference":"externals/battle-design-proposal-1.png","prompt":"Transparent standalone energy lightning icon copied in visual language from proposal-1 right-bottom UI: sharp cyan electric bolt with dark navy shadow and subtle marker scuff edge. No text, no numbers, no letters, no circle socket, no background frame, no watermark. Readable at 24px, centered with transparent padding, crisp edges."}
```

- [ ] **Step 2: Add runtime asset entries**

Modify the `ui` object in `src/data/assets.json` so the combat section contains these entries:

```json
"combatEndTurnButtonPlate": "ui/combat/end-turn-button-plate.png",
"combatEndTurnLabel": "ui/combat/end-turn-label.png",
"combatEnemyTurnLabel": "ui/combat/enemy-turn-label.png",
"combatTurnEnergyFrame": "ui/combat/turn-energy-frame.png",
"combatEnergyLightningIcon": "ui/combat/energy-lightning-icon.png"
```

Place them near the existing combat UI entries. The older `"combatTurnDevice": "ui/combat/turn-device.png"` key may remain available during migration, but the new turn action renderer should use the five split assets above.

- [ ] **Step 3: Extend typed registry keys**

Modify `CombatUiAssetKey` in `src/core/assets/assetRegistry.ts`:

```ts
export type CombatUiAssetKey =
  | "battleBg"
  | "playerPanel"
  | "topResourceFrame"
  | "turnDevice"
  | "endTurnButtonPlate"
  | "endTurnLabel"
  | "enemyTurnLabel"
  | "turnEnergyFrame"
  | "energyLightningIcon"
  | "tickerPanel"
  | "enemyPlatform"
  | "targetRing"
  | "handTray"
  | "dropZone";
```

Modify `combatUiAssetKeys` in the same file:

```ts
const combatUiAssetKeys: Record<CombatUiAssetKey, keyof GameData["assets"]["ui"]> = {
  battleBg: "combatBattleBg",
  playerPanel: "combatPlayerPanel",
  topResourceFrame: "combatTopResourceFrame",
  turnDevice: "combatTurnDevice",
  endTurnButtonPlate: "combatEndTurnButtonPlate",
  endTurnLabel: "combatEndTurnLabel",
  enemyTurnLabel: "combatEnemyTurnLabel",
  turnEnergyFrame: "combatTurnEnergyFrame",
  energyLightningIcon: "combatEnergyLightningIcon",
  tickerPanel: "combatTickerPanel",
  enemyPlatform: "combatEnemyPlatform",
  targetRing: "combatTargetRing",
  handTray: "combatHandTray",
  dropZone: "combatDropZone"
};
```

- [ ] **Step 4: Add asset registry assertions**

Append to `tests/core/assetRegistry.test.ts`:

```ts
it("resolves turn action UI assets through typed lookup", () => {
  const registry = createAssetRegistry(loadGameData());

  expect(registry.getCombatUiAsset("endTurnButtonPlate")).toEqual({
    key: "ui:combatEndTurnButtonPlate",
    path: "/assets/ui/combat/end-turn-button-plate.png"
  });
  expect(registry.getCombatUiAsset("endTurnLabel")).toEqual({
    key: "ui:combatEndTurnLabel",
    path: "/assets/ui/combat/end-turn-label.png"
  });
  expect(registry.getCombatUiAsset("enemyTurnLabel")).toEqual({
    key: "ui:combatEnemyTurnLabel",
    path: "/assets/ui/combat/enemy-turn-label.png"
  });
  expect(registry.getCombatUiAsset("turnEnergyFrame")).toEqual({
    key: "ui:combatTurnEnergyFrame",
    path: "/assets/ui/combat/turn-energy-frame.png"
  });
  expect(registry.getCombatUiAsset("energyLightningIcon")).toEqual({
    key: "ui:combatEnergyLightningIcon",
    path: "/assets/ui/combat/energy-lightning-icon.png"
  });
});

it("preloads turn action UI assets from asset data", () => {
  const registry = createAssetRegistry(loadGameData());
  const entries = registry.listPreloadEntries();

  expect(entries).toContainEqual({
    key: "ui:combatEndTurnButtonPlate",
    path: "/assets/ui/combat/end-turn-button-plate.png"
  });
  expect(entries).toContainEqual({
    key: "ui:combatEndTurnLabel",
    path: "/assets/ui/combat/end-turn-label.png"
  });
  expect(entries).toContainEqual({
    key: "ui:combatEnemyTurnLabel",
    path: "/assets/ui/combat/enemy-turn-label.png"
  });
  expect(entries).toContainEqual({
    key: "ui:combatTurnEnergyFrame",
    path: "/assets/ui/combat/turn-energy-frame.png"
  });
  expect(entries).toContainEqual({
    key: "ui:combatEnergyLightningIcon",
    path: "/assets/ui/combat/energy-lightning-icon.png"
  });
});
```

- [ ] **Step 5: Run registry tests**

Run:

```bash
npm test -- tests/core/assetRegistry.test.ts
```

Expected:

```text
PASS tests/core/assetRegistry.test.ts
```

- [ ] **Step 6: Generate the five assets**

Use the `imagegen` skill and the five exact `docs/assets/image-generation-prompts.jsonl` rows from Step 1. Save the generated PNGs exactly to:

```text
public/assets/ui/combat/end-turn-button-plate.png
public/assets/ui/combat/end-turn-label.png
public/assets/ui/combat/enemy-turn-label.png
public/assets/ui/combat/turn-energy-frame.png
public/assets/ui/combat/energy-lightning-icon.png
```

Verify files exist:

```bash
file public/assets/ui/combat/end-turn-button-plate.png public/assets/ui/combat/end-turn-label.png public/assets/ui/combat/enemy-turn-label.png public/assets/ui/combat/turn-energy-frame.png public/assets/ui/combat/energy-lightning-icon.png
```

Expected:

```text
PNG image data
```

- [ ] **Step 7: Commit asset registry and generated assets**

Run:

```bash
git add docs/assets/image-generation-prompts.jsonl src/data/assets.json src/core/assets/assetRegistry.ts tests/core/assetRegistry.test.ts public/assets/ui/combat/end-turn-button-plate.png public/assets/ui/combat/end-turn-label.png public/assets/ui/combat/enemy-turn-label.png public/assets/ui/combat/turn-energy-frame.png public/assets/ui/combat/energy-lightning-icon.png
git commit -m "feat: add turn action ui assets"
```

---

## Task 3: Phaser Turn Action UI Mapper

**Files:**
- Create: `src/phaser/ui/TurnActionView.ts`
- Test: `tests/phaser/turnActionView.test.ts`

- [ ] **Step 1: Write failing mapper tests**

Create `tests/phaser/turnActionView.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { CombatTurnActionState } from "../../src/core";
import { deriveTurnActionUiSnapshot } from "../../src/phaser/ui/TurnActionView";

const readyState: CombatTurnActionState = {
  mode: "combat",
  combatPhase: "player",
  turn: 2,
  energy: 2,
  maxEnergy: 3,
  canEndTurn: true,
  canPlayAnyHandCard: true,
  suggestedUiState: "playerReady"
};

describe("turn action UI snapshot", () => {
  it("maps player ready state", () => {
    expect(deriveTurnActionUiSnapshot(readyState, { quick: true })).toEqual({
      state: "playerReady",
      title: "玩家回合",
      message: "選擇卡牌，或主動結束回合。",
      turn: 2,
      energy: 2,
      maxEnergy: 3,
      endTurnEnabled: true,
      endTurnDisabledReason: undefined,
      quickWinVisible: true
    });
  });

  it("maps no playable cards state", () => {
    expect(
      deriveTurnActionUiSnapshot(
        {
          ...readyState,
          energy: 0,
          canPlayAnyHandCard: false,
          suggestedUiState: "playerNoPlayableCards"
        },
        { quick: false }
      )
    ).toMatchObject({
      state: "playerNoPlayableCards",
      title: "等待結束",
      message: "沒有可出的牌，系統會自動結束回合。",
      endTurnEnabled: true,
      quickWinVisible: false
    });
  });

  it("prioritizes manual transition over player-ready core state", () => {
    expect(deriveTurnActionUiSnapshot(readyState, { quick: true, turnTransitionKind: "manual" })).toMatchObject({
      state: "manualEnding",
      title: "回合結束",
      message: "玩家主動結束回合。",
      endTurnEnabled: false
    });
  });

  it("prioritizes auto transition over player core state", () => {
    expect(deriveTurnActionUiSnapshot(readyState, { quick: true, turnTransitionKind: "autoNoPlayableCards" })).toMatchObject({
      state: "autoEndingNoPlayableCards",
      title: "自動結束",
      message: "沒有可出的牌，準備切換回合。",
      endTurnEnabled: false
    });
  });

  it("maps enemy and victory presentation states", () => {
    expect(
      deriveTurnActionUiSnapshot(
        {
          ...readyState,
          combatPhase: "enemy",
          canEndTurn: false,
          canPlayAnyHandCard: false,
          endTurnDisabledReason: "敵人行動中。",
          suggestedUiState: "enemyPhase"
        },
        { quick: true }
      )
    ).toMatchObject({
      state: "enemyActing",
      title: "敵人行動",
      endTurnEnabled: false,
      endTurnDisabledReason: "敵人行動中。"
    });

    expect(deriveTurnActionUiSnapshot(readyState, { quick: true, victoryTransitionActive: true })).toMatchObject({
      state: "victoryPresentation",
      title: "勝利過場",
      message: "敵人倒下，記憶正在沉澱。",
      endTurnEnabled: false,
      quickWinVisible: false
    });
  });
});
```

- [ ] **Step 2: Run failing mapper tests**

Run:

```bash
npm test -- tests/phaser/turnActionView.test.ts
```

Expected:

```text
FAIL tests/phaser/turnActionView.test.ts
Error: Failed to resolve import "../../src/phaser/ui/TurnActionView"
```

- [ ] **Step 3: Implement mapper and renderer**

Create `src/phaser/ui/TurnActionView.ts`:

```ts
import Phaser from "phaser";
import type { AssetRegistry, CombatTurnActionState } from "../../core";
import { image, label } from "./uiPrimitives";
import { colors } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";

export type TurnActionUiState =
  | "playerReady"
  | "playerNoPlayableCards"
  | "manualEnding"
  | "autoEndingNoPlayableCards"
  | "enemyActing"
  | "victoryPresentation"
  | "disabled";

export interface TurnActionPresentationState {
  quick: boolean;
  turnTransitionKind?: "manual" | "autoNoPlayableCards";
  victoryTransitionActive?: boolean;
}

export interface TurnActionUiSnapshot {
  state: TurnActionUiState;
  title: string;
  message: string;
  turn: number;
  energy: number;
  maxEnergy: number;
  endTurnEnabled: boolean;
  endTurnDisabledReason?: string;
  quickWinVisible: boolean;
}

export interface RenderTurnActionViewOptions {
  scene: Phaser.Scene;
  context: UiRenderContext;
  assets: AssetRegistry;
  x: number;
  y: number;
  snapshot: TurnActionUiSnapshot;
  onEndTurn: () => void;
}

export function deriveTurnActionUiSnapshot(
  coreState: CombatTurnActionState,
  presentation: TurnActionPresentationState
): TurnActionUiSnapshot {
  const turn = coreState.turn ?? 0;
  const energy = coreState.energy ?? 0;
  const maxEnergy = coreState.maxEnergy;

  if (presentation.victoryTransitionActive) {
    return {
      state: "victoryPresentation",
      title: "勝利過場",
      message: "敵人倒下，記憶正在沉澱。",
      turn,
      energy,
      maxEnergy,
      endTurnEnabled: false,
      endTurnDisabledReason: "勝利過場中。",
      quickWinVisible: false
    };
  }

  if (presentation.turnTransitionKind === "manual") {
    return {
      state: "manualEnding",
      title: "回合結束",
      message: "玩家主動結束回合。",
      turn,
      energy,
      maxEnergy,
      endTurnEnabled: false,
      endTurnDisabledReason: "回合切換中。",
      quickWinVisible: presentation.quick
    };
  }

  if (presentation.turnTransitionKind === "autoNoPlayableCards") {
    return {
      state: "autoEndingNoPlayableCards",
      title: "自動結束",
      message: "沒有可出的牌，準備切換回合。",
      turn,
      energy,
      maxEnergy,
      endTurnEnabled: false,
      endTurnDisabledReason: "自動切換中。",
      quickWinVisible: presentation.quick
    };
  }

  if (coreState.suggestedUiState === "enemyPhase") {
    return {
      state: "enemyActing",
      title: "敵人行動",
      message: "敵人正在執行意圖。",
      turn,
      energy,
      maxEnergy,
      endTurnEnabled: false,
      endTurnDisabledReason: coreState.endTurnDisabledReason,
      quickWinVisible: presentation.quick
    };
  }

  if (coreState.suggestedUiState === "playerReady") {
    return {
      state: "playerReady",
      title: "玩家回合",
      message: "選擇卡牌，或主動結束回合。",
      turn,
      energy,
      maxEnergy,
      endTurnEnabled: coreState.canEndTurn,
      endTurnDisabledReason: coreState.endTurnDisabledReason,
      quickWinVisible: presentation.quick
    };
  }

  if (coreState.suggestedUiState === "playerNoPlayableCards") {
    return {
      state: "playerNoPlayableCards",
      title: "等待結束",
      message: "沒有可出的牌，系統會自動結束回合。",
      turn,
      energy,
      maxEnergy,
      endTurnEnabled: coreState.canEndTurn,
      endTurnDisabledReason: coreState.endTurnDisabledReason,
      quickWinVisible: presentation.quick
    };
  }

  return {
    state: "disabled",
    title: coreState.suggestedUiState === "defeat" ? "挑戰失敗" : "不可操作",
    message: coreState.endTurnDisabledReason ?? "目前不能結束回合。",
    turn,
    energy,
    maxEnergy,
    endTurnEnabled: false,
    endTurnDisabledReason: coreState.endTurnDisabledReason,
    quickWinVisible: false
  };
}

export function renderTurnActionView(options: RenderTurnActionViewOptions) {
  const { scene, context, assets, x, y, snapshot, onEndTurn } = options;
  const root = scene.add.container(x, y);

  const frame = image(scene, context, 168, 44, assets.getCombatUiAsset("turnEnergyFrame").key, 300, 96, "combat-ui:turn-energy-frame");
  if (frame) root.add(frame);
  else root.add(scene.add.rectangle(18, 4, 300, 86, 0x000000, 0.64).setOrigin(0).setStrokeStyle(2, 0xf4c542, 0.86));

  root.add(label(scene, 64, 22, `回合 ${snapshot.turn}`, 16, colors.ink, 96));
  root.add(label(scene, 64, 54, `能量 ${snapshot.energy}/${snapshot.maxEnergy}`, 14, colors.cyanText, 104));

  for (let index = 0; index < snapshot.maxEnergy; index += 1) {
    const icon = image(
      scene,
      context,
      198 + index * 34,
      56,
      assets.getCombatUiAsset("energyLightningIcon").key,
      24,
      24,
      `combat-ui:energy-lightning-icon-${index}`,
      index < snapshot.energy ? 1 : 0.26
    );
    if (icon) root.add(icon);
  }

  const plateAlpha = snapshot.endTurnEnabled || snapshot.state === "enemyActing" ? 1 : 0.52;
  const plate = image(scene, context, 170, 128, assets.getCombatUiAsset("endTurnButtonPlate").key, 340, 180, "combat-ui:end-turn-button-plate", plateAlpha);
  if (plate) root.add(plate);

  const labelKey = snapshot.state === "enemyActing" ? "enemyTurnLabel" : "endTurnLabel";
  const labelRole = snapshot.state === "enemyActing" ? "combat-ui:enemy-turn-label" : "combat-ui:end-turn-label";
  const labelSprite = image(scene, context, 170, 128, assets.getCombatUiAsset(labelKey).key, 220, 72, labelRole, plateAlpha);
  if (labelSprite) root.add(labelSprite);

  const hitZone = scene.add.zone(28, 78, 284, 94).setOrigin(0).setInteractive({ useHandCursor: snapshot.endTurnEnabled });
  hitZone.setName("end-turn");
  hitZone.on("pointerup", () => {
    if (snapshot.endTurnEnabled) onEndTurn();
  });
  context.register?.(
    "end-turn",
    hitZone,
    {
      kind: "button",
      text: snapshot.state === "enemyActing" ? "敵方回合" : "結束回合",
      enabled: snapshot.endTurnEnabled,
      bounds: { x: x + 28, y: y + 78, width: 284, height: 94 }
    }
  );
  root.add(hitZone);

  if (snapshot.endTurnDisabledReason) {
    root.add(label(scene, 28, 172, snapshot.endTurnDisabledReason, 11, "#9ca3af", 280));
  }

  return root;
}
```

- [ ] **Step 4: Run mapper tests**

Run:

```bash
npm test -- tests/phaser/turnActionView.test.ts
```

Expected:

```text
PASS tests/phaser/turnActionView.test.ts
```

- [ ] **Step 5: Commit UI mapper**

Run:

```bash
git add src/phaser/ui/TurnActionView.ts tests/phaser/turnActionView.test.ts
git commit -m "feat: add turn action ui snapshot mapper"
```

---

## Task 4: Integrate Turn Action UI Into GameScene

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `tests/e2e/fullRunSmoke.mjs`

- [ ] **Step 1: Update GameScene imports**

In `src/scenes/GameScene.ts`, add `getCombatTurnActionState` to the core imports:

```ts
  getCombatTurnActionState,
```

Remove `renderCombatTurnDevice` from the `CombatSceneView` import list.

Add this import:

```ts
import { deriveTurnActionUiSnapshot, renderTurnActionView, type TurnActionUiSnapshot } from "../phaser/ui/TurnActionView";
```

- [ ] **Step 2: Add turnActionUi to the text snapshot type**

In `TextSnapshot`, add:

```ts
  turnActionUi?: TurnActionUiSnapshot;
```

- [ ] **Step 3: Replace the old turn device rendering**

In `drawCombat()`, replace:

```ts
    const turnDevice = renderCombatTurnDevice(this, combat.turn, combat.player.energy);
    this.root?.add(turnDevice);
    this.button("end-turn", "結束回合", combatLayout.turnDevice.x + 48, combatLayout.turnDevice.y + 92, 142, 54, () => {
      this.beginTurnTransition("manual");
    }, !this.turnTransition && !this.victoryTransition);
```

with:

```ts
    const turnActionUi = this.currentTurnActionUi();
    const turnActionView = renderTurnActionView({
      scene: this,
      context: this.uiContext(),
      assets: this.assets,
      x: combatLayout.turnDevice.x,
      y: combatLayout.turnDevice.y,
      snapshot: turnActionUi,
      onEndTurn: () => this.beginTurnTransition("manual")
    });
    this.root?.add(turnActionView);
```

Leave the quick button block after this replacement:

```ts
    if (this.quick) {
      this.button("auto-win", "測試勝利", 24, 656, 132, 40, () => {
        autoWinCombat(this.engine);
        this.render();
      }, !this.victoryTransition, 0x39d98a);
    }
```

- [ ] **Step 4: Add a GameScene helper for current turn action UI**

Add this method before `snapshot()`:

```ts
  private currentTurnActionUi(): TurnActionUiSnapshot | undefined {
    if (this.engine.run.mode !== "combat") return undefined;
    return deriveTurnActionUiSnapshot(getCombatTurnActionState(this.engine), {
      quick: this.quick,
      turnTransitionKind: this.turnTransition?.kind,
      victoryTransitionActive: Boolean(this.victoryTransition)
    });
  }
```

- [ ] **Step 5: Add snapshot output**

In `snapshot()`, after `victoryTransition`, add:

```ts
      turnActionUi: this.currentTurnActionUi(),
```

- [ ] **Step 6: Keep card input disabled during transition**

In `drawCombat()`, update the card `playable` value passed to `renderCardView()`:

```ts
        playable: effectiveCardCost(this.dataModel, card) <= combat.player.energy && !this.turnTransition && !this.victoryTransition,
```

This aligns the card visual state with the input registration condition that already checks `!this.turnTransition && !this.victoryTransition`.

- [ ] **Step 7: Update E2E expectations for new turn action UI**

In `tests/e2e/fullRunSmoke.mjs`, after:

```js
  assert.equal(current.combatUi?.reference, "battle-design-proposal-3");
```

add:

```js
  assert.equal(current.turnActionUi?.state, "playerReady");
  assert.equal(current.turnActionUi?.turn, current.combat.turn);
  assert.equal(current.turnActionUi?.energy, current.combat.energy);
  assert.ok(current.turnActionUi?.endTurnEnabled, "end turn should be enabled during player-ready state");
```

Replace:

```js
  for (const role of ["combat-ui:background"]) {
```

with:

```js
  for (const role of [
    "combat-ui:background",
    "combat-ui:turn-energy-frame",
    "combat-ui:energy-lightning-icon-0",
    "combat-ui:energy-lightning-icon-1",
    "combat-ui:energy-lightning-icon-2",
    "combat-ui:end-turn-button-plate",
    "combat-ui:end-turn-label"
  ]) {
```

In `assertVictoryTransitionDelaysReward(page)`, after the existing disabled end-turn assertion, add:

```js
  assert.equal(current.turnActionUi?.state, "victoryPresentation");
  assert.equal(current.turnActionUi?.endTurnEnabled, false);
```

In `assertAutoEndTurnMessage(page)`, inside the `if (current.turnTransition?.kind === "autoNoPlayableCards")` block, add:

```js
    assert.equal(current.turnActionUi?.state, "autoEndingNoPlayableCards");
    assert.equal(current.turnActionUi?.endTurnEnabled, false);
```

Keep `assertNoCombatPanelSurfaceAssets()` unchanged for the old removed role `combat-ui:turn-device`; the new roles are separate and must be visible.

- [ ] **Step 8: Run focused unit and E2E tests**

Run:

```bash
npm test -- tests/phaser/turnActionView.test.ts tests/core/turnActionState.test.ts
npm run test:e2e
```

Expected:

```text
PASS tests/phaser/turnActionView.test.ts
PASS tests/core/turnActionState.test.ts
Full run smoke completed without assertion failure
```

- [ ] **Step 9: Commit integration**

Run:

```bash
git add src/scenes/GameScene.ts tests/e2e/fullRunSmoke.mjs
git commit -m "feat: render combat turn action region"
```

---

## Task 5: Develop-Web-Game Browser Verification

**Files:**
- Modify: `progress.md`

- [ ] **Step 1: Start or reuse the Vite server**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

Expected:

```text
Local: http://127.0.0.1:5173/
```

If port `5173` is busy, use the printed Vite URL. Keep this terminal session running until browser verification is complete.

- [ ] **Step 2: Use Codex in-app browser only**

Navigate the Codex in-app browser to:

```text
http://127.0.0.1:5173/?e2e=1
```

Do not use macOS `open`, Chrome, Safari, or any browser outside the Codex app.

- [ ] **Step 3: Verify initial combat state through develop-web-game**

Using `$WEB_GAME_CLIENT` or the equivalent develop-web-game Playwright client, perform:

1. Start game.
2. Select the first map combat node.
3. Capture screenshot.
4. Read `window.render_game_to_text()`.
5. Read console/page errors.

Expected text state:

```json
{
  "mode": "combat",
  "turnActionUi": {
    "state": "playerReady",
    "endTurnEnabled": true,
    "quickWinVisible": true
  }
}
```

Expected visual state:

```text
Right-bottom turn action panel uses visible image assets.
Quick test win button is left-bottom.
Panel does not cover hand cards or combat ticker.
No console errors.
No page errors.
```

- [ ] **Step 4: Verify manual end-turn state**

Click `結束回合`, immediately read `window.render_game_to_text()`, and capture screenshot.

Expected:

```json
{
  "turnActionUi": {
    "state": "manualEnding",
    "endTurnEnabled": false
  },
  "turnTransition": {
    "kind": "manual"
  }
}
```

- [ ] **Step 5: Verify auto end-turn state**

Use Playwright evaluation to force an unwinnable current hand with no energy:

```js
const scene = window.mnemonicSpireScene;
const combat = scene.engine.run.currentCombat;
combat.phase = "player";
combat.player.energy = 0;
const strike = combat.cards.find((card) => card.cardId === "strike");
combat.hand = [strike.instanceId];
scene.turnTransition = undefined;
scene.victoryTransition = undefined;
scene.maybeBeginAutoEndTurn();
scene.render();
```

Then read state.

Expected:

```json
{
  "turnActionUi": {
    "state": "autoEndingNoPlayableCards",
    "endTurnEnabled": false
  },
  "turnTransition": {
    "kind": "autoNoPlayableCards"
  }
}
```

- [ ] **Step 6: Verify victory presentation state**

Use the existing E2E victory transition flow or click `測試勝利` only after verifying the formal panel. During the death/victory presentation, read state.

Expected:

```json
{
  "turnActionUi": {
    "state": "victoryPresentation",
    "endTurnEnabled": false,
    "quickWinVisible": false
  }
}
```

- [ ] **Step 7: Record browser verification**

Append this exact entry to `progress.md`:

```md

### Turn Action Browser Verification

- Verified in Codex in-app browser.
- Checked screenshot for player-ready, manual end-turn, auto end-turn, and victory presentation states.
- Checked `window.render_game_to_text().turnActionUi`.
- Checked console/page errors.
```

- [ ] **Step 8: Commit verification record**

Run:

```bash
git add progress.md
git commit -m "docs: record turn action browser verification"
```

---

## Task 6: Final Verification, Backlog Done, And Merge

**Files:**
- Move: `backlogs/in-progress/22-combat-turn-action-region-backlog.md`
- Modify: `progress.md`

- [ ] **Step 1: Run full verification**

Run:

```bash
npm test
npm run build
npm run test:e2e
```

Expected:

```text
Test Files  all pass
✓ built
Full run smoke completed without assertion failure
```

- [ ] **Step 2: Move backlog to done**

Run:

```bash
mkdir -p backlogs/done
git mv backlogs/in-progress/22-combat-turn-action-region-backlog.md backlogs/done/22-combat-turn-action-region-backlog.md
```

- [ ] **Step 3: Record completion**

Append this exact entry to `progress.md`:

```md

### Turn Action Completion

- Completed `22-combat-turn-action-region`.
- Added core query API for Phaser turn action state.
- Added turn action asset slots and runtime registry entries.
- Rendered the right-bottom turn action panel with asset-backed UI.
- Added `turnActionUi` to `window.render_game_to_text()`.
- Verification completed: `npm test`, `npm run build`, `npm run test:e2e`, and Codex in-app browser develop-web-game checks.
```

- [ ] **Step 4: Commit backlog completion**

Run:

```bash
git add backlogs/done/22-combat-turn-action-region-backlog.md progress.md
git commit -m "docs: complete combat turn action backlog"
```

- [ ] **Step 5: Merge back to main**

Run:

```bash
git status --short --branch
cd /Users/rexchen/Game/mnemonic-spire
git status --short --branch
git merge --ff-only feature/combat-turn-action-region
```

Expected:

```text
Updating ...
Fast-forward
```

- [ ] **Step 6: Push main**

Run:

```bash
git push origin main
```

Expected:

```text
main -> main
```

---

## Self-Review Checklist

- Spec coverage:
  - Core query API is covered by Task 1.
  - Phaser command boundary is preserved by Task 4; the formal panel calls `beginTurnTransition("manual")`, which resolves through existing `endRunTurn(engine, { completeVictory: false })`.
  - UI asset slots and prompt rules are covered by Task 2.
  - Dynamic Phaser text, energy, turn, disabled reason, and button state are covered by Tasks 3 and 4.
  - `window.render_game_to_text().turnActionUi` is covered by Task 4.
  - Codex in-app browser and develop-web-game verification are covered by Task 5.
  - Full test commands are covered by Task 6.
- Placeholder scan:
  - The plan contains exact file paths, exact test code, exact implementation snippets, and exact commands.
  - No step relies on unspecified behavior.
- Type consistency:
  - `CombatTurnActionState`, `TurnActionUiSnapshot`, and `TurnActionUiState` names are consistent between core, Phaser, tests, and `GameScene`.
  - Asset keys are consistent between JSON data, registry type union, registry mapping, renderer calls, and E2E role assertions.
