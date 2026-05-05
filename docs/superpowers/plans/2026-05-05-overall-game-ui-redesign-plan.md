# Overall Game UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Phaser presentation layer into a clear roguelike deckbuilder UI that uses the existing card, enemy, node, intent, relic, contract, event, and memory sticker assets as first-class UI.

**Architecture:** Keep `src/core/` framework-neutral and unchanged except for asset registry helpers. Move drawing responsibilities out of `GameScene.ts` into focused Phaser UI modules under `src/phaser/ui/`, then have `GameScene` orchestrate state, commands, and screen composition. Preserve deterministic browser hooks and E2E button descriptors.

**Tech Stack:** Phaser 3 Canvas renderer, TypeScript, Vite, Vitest, Playwright E2E, existing `public/assets/*` PNG/OGG assets.

---

## File Structure

- Modify: `src/core/assets/assetRegistry.ts`
  - Add typed helpers for node icons, intent icons, contract icons, memory stickers, and audio keys.
- Modify: `tests/core/assetRegistry.test.ts`
  - Cover the new asset helper API and preload list.
- Create: `src/phaser/ui/uiTypes.ts`
  - Own shared Phaser UI descriptors such as `ButtonDescriptor`, `ScreenKey`, `VisibleAssetDescriptor`.
- Create: `src/phaser/ui/uiTheme.ts`
  - Own colors, fonts, panel metrics, card sizes, and z-depth conventions.
- Create: `src/phaser/ui/uiPrimitives.ts`
  - Own reusable Phaser drawing helpers: text, panel, icon, image, button, bar, asset tracking.
- Replace: `src/phaser/ui/CardView.ts`
  - Render complete card frames for hand, reward, shop, and preview contexts.
- Replace: `src/phaser/ui/EnemyView.ts`
  - Render enemy sprite, HP bar, block, status badges, intent icon, and target highlight.
- Replace: `src/phaser/ui/HudView.ts`
  - Render global shell, player stats, relic row, contract row, and audio toggle.
- Replace: `src/phaser/ui/MapView.ts`
  - Render node icons, map links, reachable/visited/current states, route labels.
- Replace: `src/phaser/ui/RewardView.ts`
  - Render reward cards using `CardView`, optional relic reward, skip reward.
- Replace: `src/phaser/ui/ShopView.ts`
  - Render card/relic/remove shop item cards.
- Replace: `src/phaser/ui/EventView.ts`
  - Render event image plus option panels with contract icons.
- Create: `src/phaser/ui/RelicView.ts`
  - Render relic icon rows and relic reward panels.
- Create: `src/phaser/ui/ContractView.ts`
  - Render active contract chips and event contract option blocks.
- Create: `src/phaser/ui/StatusView.ts`
  - Render HP bars, block badges, status badges, and intent badges.
- Modify: `src/scenes/GameScene.ts`
  - Convert from low-level drawing methods to screen orchestration using the new UI modules.
- Modify: `tests/e2e/helpers.mjs`
  - Add screenshot helper and visible-asset assertions.
- Modify: `tests/e2e/fullRunSmoke.mjs`
  - Assert that UI screens expose required visible asset keys and still complete the quick run.

## Task 1: Asset Registry Helpers

**Files:**
- Modify: `tests/core/assetRegistry.test.ts`
- Modify: `src/core/assets/assetRegistry.ts`
- Modify: `src/core/index.ts`

- [ ] **Step 1: Add failing tests for node, intent, contract, memory sticker, and audio helpers**

Add these tests to `tests/core/assetRegistry.test.ts`:

```ts
it("resolves map node icon texture keys from data", () => {
  const registry = createAssetRegistry(loadGameData());

  expect(registry.getNodeIcon("normalCombat")).toEqual({
    key: "ui:nodeNormalCombat",
    path: "/assets/ui/nodes/normal-combat.png"
  });
  expect(registry.getNodeIcon("boss")).toEqual({
    key: "ui:nodeBoss",
    path: "/assets/ui/nodes/boss.png"
  });
});

it("resolves intent icon texture keys from data", () => {
  const registry = createAssetRegistry(loadGameData());

  expect(registry.getIntentIcon("attack")).toEqual({
    key: "ui:intentAttack",
    path: "/assets/ui/intents/attack.png"
  });
  expect(registry.getIntentIcon("mixed")).toEqual({
    key: "ui:intentAttack",
    path: "/assets/ui/intents/attack.png"
  });
});

it("resolves contract and memory sticker texture keys", () => {
  const registry = createAssetRegistry(loadGameData());

  expect(registry.getContractIcon("blood_contract")).toEqual({
    key: "contract:blood_contract:icon",
    path: "/assets/ui/contracts/blood_contract.png"
  });
  expect(registry.getMemorySticker("witness")).toEqual({
    key: "sticker:witness",
    path: "/assets/stickers/witness.png"
  });
});

it("resolves audio entries through the registry", () => {
  const registry = createAssetRegistry(loadGameData());

  expect(registry.getAudio("bgm")).toEqual({
    key: "audio:bgm",
    path: "/assets/audio/bgm/main-loop.ogg"
  });
});
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- tests/core/assetRegistry.test.ts`

Expected: FAIL with TypeScript errors or runtime errors indicating `getNodeIcon`, `getIntentIcon`, `getContractIcon`, `getMemorySticker`, and `getAudio` are missing.

- [ ] **Step 3: Implement helper signatures and mappings**

Update `src/core/assets/assetRegistry.ts`:

```ts
import type { ContractDefinition, GameData, MemoryType, NodeType } from "../types";

export type IntentIconType = "attack" | "block" | "debuff" | "mixed";
export type AudioAssetKey = keyof GameData["assets"]["audio"];

export interface AssetRegistry {
  getCardArt(cardId: string): AssetEntry;
  getEnemySprite(enemyId: string): AssetEntry;
  getRelicIcon(relicId: string): AssetEntry;
  getEventImage(eventId: string): AssetEntry;
  getNodeIcon(nodeType: NodeType): AssetEntry;
  getIntentIcon(intentType: IntentIconType): AssetEntry;
  getContractIcon(contractId: string): AssetEntry;
  getMemorySticker(memoryType: MemoryType | "empty"): AssetEntry;
  getAudio(audioKey: AudioAssetKey): AssetEntry;
  getPlaceholder(slot: string): AssetEntry;
  listPreloadEntries(): AssetEntry[];
}

const nodeIconKeys: Record<NodeType, keyof GameData["assets"]["ui"]> = {
  normalCombat: "nodeNormalCombat",
  eliteCombat: "nodeEliteCombat",
  event: "nodeEvent",
  rest: "nodeRest",
  shop: "nodeShop",
  boss: "nodeBoss"
};

const intentIconKeys: Record<IntentIconType, keyof GameData["assets"]["ui"]> = {
  attack: "intentAttack",
  block: "intentBlock",
  debuff: "intentDebuff",
  mixed: "intentAttack"
};

const memoryStickerPaths: Record<MemoryType | "empty", string> = {
  bloodthirst: "stickers/bloodthirst.png",
  desperation: "stickers/desperation.png",
  grudge: "stickers/grudge.png",
  obsession: "stickers/obsession.png",
  witness: "stickers/witness.png",
  empty: "stickers/memory-empty.png"
};
```

Inside `createAssetRegistry`, add a `contracts` map and helper implementation:

```ts
const contracts = new Map(data.contracts.map((contract) => [contract.id, contract]));

function uiEntry(id: keyof GameData["assets"]["ui"]): AssetEntry {
  const path = data.assets.ui[id] ?? data.assets.placeholders.uiIcon;
  return { key: `ui:${id}`, path: assetPath(path) };
}

function contractEntry(contract: ContractDefinition | undefined, contractId: string): AssetEntry {
  return contract?.assets.icon
    ? { key: `contract:${contractId}:icon`, path: assetPath(contract.assets.icon) }
    : placeholder("uiIcon");
}
```

Add methods to the returned object:

```ts
getNodeIcon(nodeType) {
  return uiEntry(nodeIconKeys[nodeType]);
},
getIntentIcon(intentType) {
  return uiEntry(intentIconKeys[intentType]);
},
getContractIcon(contractId) {
  return contractEntry(contracts.get(contractId), contractId);
},
getMemorySticker(memoryType) {
  const path = memoryStickerPaths[memoryType];
  return path ? { key: `sticker:${memoryType}`, path: assetPath(path) } : placeholder("memorySticker");
},
getAudio(audioKey) {
  const path = data.assets.audio[audioKey];
  if (!path) {
    throw new Error(`Unknown audio asset key: ${String(audioKey)}`);
  }
  return { key: `audio:${String(audioKey)}`, path: assetPath(path) };
}
```

Update `listPreloadEntries()` to include contracts and stickers:

```ts
...data.contracts.map((contract) => this.getContractIcon(contract.id)),
...(["empty", "bloodthirst", "desperation", "grudge", "obsession", "witness"] as const).map((memoryType) =>
  this.getMemorySticker(memoryType)
),
```

- [ ] **Step 4: Export new types**

Update `src/core/index.ts`:

```ts
export type { AssetEntry, AssetRegistry, AudioAssetKey, IntentIconType } from "./assets/assetRegistry";
```

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npm test -- tests/core/assetRegistry.test.ts
npm test
```

Expected: all asset registry tests pass, then all Vitest files pass.

Commit:

```bash
git add src/core/assets/assetRegistry.ts src/core/index.ts tests/core/assetRegistry.test.ts
git commit -m "feat: add UI asset registry helpers"
```

## Task 2: Shared UI Types, Theme, And Primitives

**Files:**
- Create: `src/phaser/ui/uiTypes.ts`
- Create: `src/phaser/ui/uiTheme.ts`
- Create: `src/phaser/ui/uiPrimitives.ts`
- Modify: `src/phaser/ui/CardView.ts`
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Create shared UI types**

Create `src/phaser/ui/uiTypes.ts`:

```ts
export interface ButtonDescriptor {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  enabled: boolean;
}

export interface VisibleAssetDescriptor {
  key: string;
  role: string;
}

export type ScreenKey = "title" | "map" | "combat" | "reward" | "rest" | "shop" | "event" | "victory" | "defeat";

export interface UiRenderContext {
  buttons: ButtonDescriptor[];
  visibleAssets: VisibleAssetDescriptor[];
}
```

- [ ] **Step 2: Create theme constants**

Create `src/phaser/ui/uiTheme.ts`:

```ts
export const UI_WIDTH = 1280;
export const UI_HEIGHT = 720;

export const HUD_FONT = "Inter, system-ui, sans-serif";

export const colors = {
  background: 0x10141c,
  panel: 0x202833,
  panelDark: 0x151923,
  panelLight: 0x2f3948,
  ink: "#fff8d8",
  muted: "#d1d5db",
  cyan: 0x2dd4bf,
  cyanText: "#8be9d1",
  gold: "#ffd166",
  red: 0xee4266,
  green: 0x39d98a,
  purpleText: "#c4b5fd",
  disabled: 0x4b5563
};

export const layout = {
  topBarHeight: 70,
  leftPanel: { x: 22, y: 92, w: 218, h: 406 },
  battlefield: { x: 260, y: 92, w: 700, h: 390 },
  rightPanel: { x: 984, y: 92, w: 272, h: 506 },
  hand: { x: 250, y: 500, w: 720, h: 194 },
  endTurn: { x: 1034, y: 620, w: 184, h: 54 }
};

export const cardSize = {
  handW: 132,
  handH: 184,
  rewardW: 178,
  rewardH: 248,
  shopW: 206,
  shopH: 210,
  previewW: 160,
  previewH: 222
};
```

- [ ] **Step 3: Create Phaser UI primitives**

Create `src/phaser/ui/uiPrimitives.ts`:

```ts
import Phaser from "phaser";
import { colors, HUD_FONT } from "./uiTheme";
import type { ButtonDescriptor, UiRenderContext } from "./uiTypes";

export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, title?: string) {
  const container = scene.add.container(x, y);
  const bg = scene.add.rectangle(0, 0, w, h, colors.panel, 0.9).setOrigin(0).setStrokeStyle(2, 0xffffff, 0.14);
  container.add(bg);
  if (title) {
    container.add(
      scene.add.text(14, 12, title, {
        color: colors.ink,
        fontFamily: HUD_FONT,
        fontSize: "18px",
        fontStyle: "800"
      })
    );
  }
  return container;
}

export function label(scene: Phaser.Scene, x: number, y: number, text: string, size = 16, color = colors.ink, wrapWidth?: number) {
  return scene.add.text(x, y, text, {
    color,
    fontFamily: HUD_FONT,
    fontSize: `${size}px`,
    fontStyle: size >= 22 ? "800" : "650",
    wordWrap: wrapWidth ? { width: wrapWidth } : undefined
  });
}

export function image(
  scene: Phaser.Scene,
  context: UiRenderContext,
  x: number,
  y: number,
  key: string,
  w: number,
  h: number,
  role: string,
  alpha = 1
) {
  if (!scene.textures.exists(key)) return undefined;
  const img = scene.add.image(x, y, key).setDisplaySize(w, h).setAlpha(alpha);
  context.visibleAssets.push({ key, role });
  return img;
}

export function button(
  scene: Phaser.Scene,
  context: UiRenderContext,
  id: string,
  labelText: string,
  x: number,
  y: number,
  w: number,
  h: number,
  onClick: () => void,
  enabled = true,
  fill = colors.cyan,
  alpha?: number
) {
  const rectAlpha = alpha ?? (enabled ? 0.94 : 0.52);
  const rect = scene.add.rectangle(x, y, w, h, enabled ? fill : colors.disabled, rectAlpha).setOrigin(0);
  rect.setStrokeStyle(2, 0xffffff, enabled ? 0.42 : 0.2);
  if (enabled) {
    rect.setInteractive({ useHandCursor: true });
    rect.on("pointerdown", onClick);
  }
  const text = label(scene, x + w / 2, y + h / 2, labelText, labelText.length > 10 ? 14 : 17, enabled ? "#101318" : colors.ink, w - 14);
  text.setOrigin(0.5);
  context.buttons.push({ id, label: labelText, x: x + w / 2, y: y + h / 2, w, h, enabled });
  return scene.add.container(0, 0, [rect, text]);
}

export function bar(scene: Phaser.Scene, x: number, y: number, w: number, h: number, ratio: number, fill: number, bg = 0x111827) {
  const container = scene.add.container(x, y);
  container.add(scene.add.rectangle(0, 0, w, h, bg, 0.9).setOrigin(0));
  container.add(scene.add.rectangle(0, 0, Math.max(0, Math.min(1, ratio)) * w, h, fill, 0.96).setOrigin(0));
  container.add(scene.add.rectangle(0, 0, w, h, 0xffffff, 0).setOrigin(0).setStrokeStyle(1, 0xffffff, 0.22));
  return container;
}
```

- [ ] **Step 4: Move `ButtonDescriptor` import**

Update `src/phaser/ui/CardView.ts` to import `ButtonDescriptor` instead of defining it:

```ts
export type { ButtonDescriptor } from "./uiTypes";

export const CARD_WIDTH = 128;
export const CARD_HEIGHT = 178;
```

Update `src/scenes/GameScene.ts` imports:

```ts
import type { ButtonDescriptor, UiRenderContext, VisibleAssetDescriptor } from "../phaser/ui/uiTypes";
```

Add to `TextSnapshot`:

```ts
visibleAssets: VisibleAssetDescriptor[];
```

Add class field:

```ts
private visibleAssets: VisibleAssetDescriptor[] = [];
```

Reset it in `render()`:

```ts
this.visibleAssets = [];
```

Add this private helper to `GameScene`:

```ts
private uiContext(): UiRenderContext {
  return {
    buttons: this.buttons,
    visibleAssets: this.visibleAssets
  };
}
```

Return it in `snapshot()`:

```ts
visibleAssets: this.visibleAssets,
```

- [ ] **Step 5: Run build and commit**

Run:

```bash
npm run build
npm test
```

Expected: TypeScript build passes and Vitest passes.

Commit:

```bash
git add src/phaser/ui/uiTypes.ts src/phaser/ui/uiTheme.ts src/phaser/ui/uiPrimitives.ts src/phaser/ui/CardView.ts src/scenes/GameScene.ts
git commit -m "feat: add Phaser UI primitives"
```

## Task 3: Full CardView

**Files:**
- Replace: `src/phaser/ui/CardView.ts`
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Replace `CardView.ts` with a reusable renderer**

Replace `src/phaser/ui/CardView.ts` with:

```ts
import Phaser from "phaser";
import type { AssetRegistry, CardDefinition, CardInstance, GameData } from "../../core";
import { effectiveCardCost } from "../../core";
import { image, label } from "./uiPrimitives";
import { cardSize, colors } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";
export type { ButtonDescriptor } from "./uiTypes";

export const CARD_WIDTH = 128;
export const CARD_HEIGHT = 178;

export interface CardViewOptions {
  scene: Phaser.Scene;
  context: UiRenderContext;
  data: GameData;
  assets: AssetRegistry;
  x: number;
  y: number;
  w?: number;
  h?: number;
  card: CardDefinition;
  instance?: CardInstance;
  selected?: boolean;
  playable?: boolean;
  mode: "hand" | "reward" | "shop" | "preview";
}

export function renderCardView(options: CardViewOptions) {
  const { scene, context, data, assets, x, y, card, instance, selected = false, playable = true, mode } = options;
  const w = options.w ?? (mode === "hand" ? cardSize.handW : cardSize.rewardW);
  const h = options.h ?? (mode === "hand" ? cardSize.handH : cardSize.rewardH);
  const container = scene.add.container(x, y);
  const frameColor = selected ? 0xf4e04d : playable ? 0xf8fafc : 0x64748b;
  container.add(scene.add.rectangle(0, 0, w, h, 0x17202b, playable ? 0.96 : 0.64).setOrigin(0).setStrokeStyle(selected ? 4 : 2, frameColor, selected ? 0.88 : 0.42));
  container.add(scene.add.rectangle(8, 8, w - 16, Math.floor(h * 0.48), 0x0f172a, 0.78).setOrigin(0));
  const art = image(scene, context, w / 2, 8 + Math.floor(h * 0.24), assets.getCardArt(card.id).key, w - 22, Math.floor(h * 0.44), `card:${card.id}`, playable ? 0.96 : 0.52);
  if (art) container.add(art);
  container.add(scene.add.circle(22, 22, 18, costColor(card.type), 1).setStrokeStyle(2, 0xffffff, 0.7));
  const cost = instance ? effectiveCardCost(data, instance) : card.cost;
  container.add(label(scene, 22, 22, String(cost), 18, "#101318").setOrigin(0.5));
  container.add(label(scene, 12, Math.floor(h * 0.53), instance?.mutation?.name ?? card.name, mode === "hand" ? 14 : 16, colors.ink, w - 24));
  container.add(scene.add.rectangle(12, Math.floor(h * 0.67), w - 24, 4, costColor(card.type), 0.92).setOrigin(0));
  container.add(label(scene, 12, Math.floor(h * 0.72), card.description, mode === "hand" ? 10 : 12, "#e5e7eb", w - 24));
  renderMemoryRow(scene, container, context, assets, instance, 12, h - 26, w - 24);
  return container;
}

function renderMemoryRow(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  context: UiRenderContext,
  assets: AssetRegistry,
  instance: CardInstance | undefined,
  x: number,
  y: number,
  width: number
) {
  const memoryTypes = ["bloodthirst", "desperation", "grudge", "obsession", "witness"] as const;
  const gap = Math.min(26, Math.floor(width / memoryTypes.length));
  memoryTypes.forEach((memoryType, index) => {
    const value = instance?.memory[memoryType] ?? 0;
    const asset = assets.getMemorySticker(value > 0 ? memoryType : "empty");
    const sticker = image(scene, context, x + index * gap + 10, y + 10, asset.key, 20, 20, `memory:${memoryType}`, value > 0 ? 1 : 0.36);
    if (sticker) container.add(sticker);
    if (value > 0) container.add(label(scene, x + index * gap + 18, y + 14, String(value), 10, colors.gold).setOrigin(0.5));
  });
}

function costColor(type: CardDefinition["type"]) {
  if (type === "attack") return 0xee4266;
  if (type === "defense") return 0x39d98a;
  if (type === "skill") return 0x8b5cf6;
  return 0xf4e04d;
}
```

- [ ] **Step 2: Use `renderCardView` in combat hand and rewards**

In `src/scenes/GameScene.ts`, import:

```ts
import { CARD_HEIGHT, CARD_WIDTH, renderCardView } from "../phaser/ui/CardView";
```

In `drawCombat`, replace the per-hand card image/text block with:

```ts
const cardView = renderCardView({
  scene: this,
  context: this.uiContext(),
  data: this.dataModel,
  assets: this.assets,
  x,
  y,
  card: cardDef,
  instance: card,
  selected,
  playable: effectiveCardCost(this.dataModel, card) <= combat.player.energy,
  mode: "hand"
});
this.root?.add(cardView);
```

Keep the existing `this.button(...)` transparent hit target above the card:

```ts
this.button(`card:${card.instanceId}`, "", x, y, CARD_WIDTH, CARD_HEIGHT, () => this.selectOrPlayCard(card.instanceId), true, selected ? 0xf4e04d : 0x2b3340, 0.02);
```

In `drawReward`, render each reward card with:

```ts
const cardView = renderCardView({
  scene: this,
  context: this.uiContext(),
  data: this.dataModel,
  assets: this.assets,
  x,
  y: 188,
  w: 178,
  h: 248,
  card,
  mode: "reward"
});
this.root?.add(cardView);
```

- [ ] **Step 3: Adjust `button` alpha parameter**

Change the private `button` signature in `GameScene.ts`:

```ts
private button(
  id: string,
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
  onClick: () => void,
  enabled = true,
  color = 0x2dd4bf,
  alpha?: number
) {
  const rectAlpha = alpha ?? (label === "" ? 0.38 : enabled ? 0.92 : 0.45);
  // existing body
}
```

- [ ] **Step 4: Build and commit**

Run:

```bash
npm run build
npm run test:e2e
```

Expected: build passes and E2E quick run still completes. Reward and combat hand buttons still work.

Commit:

```bash
git add src/phaser/ui/CardView.ts src/scenes/GameScene.ts
git commit -m "feat: render full card UI"
```

## Task 4: HUD, Relic, Contract, And Status Views

**Files:**
- Create: `src/phaser/ui/RelicView.ts`
- Create: `src/phaser/ui/ContractView.ts`
- Create: `src/phaser/ui/StatusView.ts`
- Replace: `src/phaser/ui/HudView.ts`
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Create `RelicView.ts`**

Create `src/phaser/ui/RelicView.ts`:

```ts
import Phaser from "phaser";
import type { AssetRegistry, GameData } from "../../core";
import { image, label } from "./uiPrimitives";
import { colors } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";

export function renderRelicRow(scene: Phaser.Scene, context: UiRenderContext, data: GameData, assets: AssetRegistry, relicIds: readonly string[], x: number, y: number) {
  const container = scene.add.container(x, y);
  container.add(label(scene, 0, 0, "遺物", 14, colors.purpleText));
  relicIds.slice(0, 6).forEach((relicId, index) => {
    const relic = data.relics.find((item) => item.id === relicId);
    const icon = image(scene, context, 52 + index * 34, 8, assets.getRelicIcon(relicId).key, 28, 28, `relic:${relicId}`);
    if (icon) container.add(icon);
    if (relic && index === 0) container.add(label(scene, 42, 28, relic.name, 10, "#e9d5ff", 130));
  });
  return container;
}
```

- [ ] **Step 2: Create `ContractView.ts`**

Create `src/phaser/ui/ContractView.ts`:

```ts
import Phaser from "phaser";
import type { AssetRegistry, GameData, ActiveContract } from "../../core";
import { image, label } from "./uiPrimitives";
import { colors } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";

export function renderContractRow(scene: Phaser.Scene, context: UiRenderContext, data: GameData, assets: AssetRegistry, contracts: readonly ActiveContract[], x: number, y: number) {
  const container = scene.add.container(x, y);
  container.add(label(scene, 0, 0, "契約", 14, "#fecdd3"));
  if (contracts.length === 0) {
    container.add(label(scene, 48, 0, "無", 13, colors.muted));
    return container;
  }
  contracts.slice(0, 5).forEach((contract, index) => {
    const icon = image(scene, context, 54 + index * 40, 8, assets.getContractIcon(contract.id).key, 30, 30, `contract:${contract.id}`);
    if (icon) container.add(icon);
    container.add(label(scene, 64 + index * 40, 24, String(contract.remainingUses), 10, "#ffffff").setOrigin(0.5));
  });
  return container;
}

export function contractOptionLabel(data: GameData, contractId?: string) {
  if (!contractId) return undefined;
  const contract = data.contracts.find((item) => item.id === contractId);
  return contract ? `${contract.name}: ${contract.benefit} / ${contract.cost}` : undefined;
}
```

- [ ] **Step 3: Create `StatusView.ts`**

Create `src/phaser/ui/StatusView.ts`:

```ts
import Phaser from "phaser";
import { bar, label } from "./uiPrimitives";
import { colors } from "./uiTheme";

export function renderHpBar(scene: Phaser.Scene, x: number, y: number, w: number, current: number, max: number, labelText: string) {
  const container = scene.add.container(x, y);
  container.add(bar(scene, 0, 22, w, 14, max > 0 ? current / max : 0, 0xee4266));
  container.add(label(scene, 0, 0, `${labelText} ${current}/${max}`, 14, colors.ink, w));
  return container;
}

export function renderStatPill(scene: Phaser.Scene, x: number, y: number, text: string, fill = 0x2f3948) {
  const container = scene.add.container(x, y);
  container.add(scene.add.rectangle(0, 0, 82, 28, fill, 0.92).setOrigin(0).setStrokeStyle(1, 0xffffff, 0.22));
  container.add(label(scene, 41, 14, text, 13, colors.ink).setOrigin(0.5));
  return container;
}
```

- [ ] **Step 4: Replace `HudView.ts` with a full shell renderer**

Replace `src/phaser/ui/HudView.ts`:

```ts
import Phaser from "phaser";
import type { AssetRegistry, GameData, RunState } from "../../core";
import { button, label, panel } from "./uiPrimitives";
import { colors, HUD_FONT, layout } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";
import { renderContractRow } from "./ContractView";
import { renderRelicRow } from "./RelicView";
import { renderHpBar, renderStatPill } from "./StatusView";

export { HUD_FONT };

export function renderHudShell(
  scene: Phaser.Scene,
  context: UiRenderContext,
  data: GameData,
  assets: AssetRegistry,
  run: RunState,
  muted: boolean,
  onToggleMute: () => void
) {
  const root = scene.add.container(0, 0);
  root.add(scene.add.rectangle(0, 0, 1280, layout.topBarHeight, colors.panel, 0.96).setOrigin(0));
  root.add(label(scene, 24, 14, "記憶牌塔", 24, colors.ink));
  root.add(label(scene, 158, 18, `F${run.floor || 0}/12`, 20, colors.ink));
  root.add(label(scene, 290, 20, `金幣 ${run.gold}`, 18, colors.gold));
  root.add(renderRelicRow(scene, context, data, assets, run.relics, 430, 13));
  root.add(renderContractRow(scene, context, data, assets, run.activeContracts, 708, 13));
  root.add(button(scene, context, "mute", muted ? "音訊關" : "音訊開", 1130, 18, 110, 36, onToggleMute));
  return root;
}

export function renderPlayerPanel(scene: Phaser.Scene, run: RunState, combatEnergy?: number, combatBlock?: number) {
  const root = panel(scene, layout.leftPanel.x, layout.leftPanel.y, layout.leftPanel.w, layout.leftPanel.h, "拾憶者");
  root.add(renderHpBar(scene, 14, 52, 184, run.playerHp, run.playerMaxHp, "HP"));
  root.add(renderStatPill(scene, 14, 104, `能量 ${combatEnergy ?? 0}/3`, 0x2dd4bf));
  root.add(renderStatPill(scene, 106, 104, `格擋 ${combatBlock ?? 0}`, 0x39d98a));
  root.add(label(scene, 14, 154, `牌組 ${run.deck.length}`, 15, "#a7f3d0"));
  root.add(label(scene, 14, 184, `樓層 ${run.floor || 0}`, 15, colors.ink));
  return root;
}
```

- [ ] **Step 5: Use HUD shell and player panel in `GameScene`**

In `GameScene.drawHud`, replace the text-only HUD with:

```ts
this.root?.add(
  renderHudShell(this, this.uiContext(), this.dataModel, this.assets, this.engine.run, this.muted, () => this.toggleMute())
);
```

In `drawCombat`, add the player panel:

```ts
this.root?.add(renderPlayerPanel(this, this.engine.run, combat.player.energy, combat.player.block));
```

Remove old combat title text that duplicates energy/block.

- [ ] **Step 6: Build and commit**

Run:

```bash
npm run build
npm run test:e2e
```

Expected: build passes, E2E passes, `visibleAssets` includes relic keys on title/map/combat states when relic row is visible.

Commit:

```bash
git add src/phaser/ui/RelicView.ts src/phaser/ui/ContractView.ts src/phaser/ui/StatusView.ts src/phaser/ui/HudView.ts src/scenes/GameScene.ts
git commit -m "feat: add deckbuilder HUD shell"
```

## Task 5: EnemyView And Combat Screen Redesign

**Files:**
- Replace: `src/phaser/ui/EnemyView.ts`
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Replace `EnemyView.ts`**

Replace `src/phaser/ui/EnemyView.ts`:

```ts
import Phaser from "phaser";
import type { AssetRegistry, EnemyDefinition, EnemyInstance, GameData, IntentIconType } from "../../core";
import { button, image, label } from "./uiPrimitives";
import { colors } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";
import { renderHpBar, renderStatPill } from "./StatusView";

export const ENEMY_SIZE = 176;

export interface EnemyViewOptions {
  scene: Phaser.Scene;
  context: UiRenderContext;
  data: GameData;
  assets: AssetRegistry;
  enemy: EnemyInstance;
  x: number;
  y: number;
  selectedTargetEnabled: boolean;
  onTarget: () => void;
}

export function renderEnemyView(options: EnemyViewOptions) {
  const { scene, context, data, assets, enemy, x, y, selectedTargetEnabled, onTarget } = options;
  const def = data.enemies.find((item) => item.id === enemy.enemyId) as EnemyDefinition;
  const root = scene.add.container(0, 0);
  root.add(scene.add.ellipse(x, y + 72, 176, 34, 0x000000, 0.34));
  const sprite = image(scene, context, x, y, assets.getEnemySprite(enemy.enemyId).key, ENEMY_SIZE, ENEMY_SIZE, `enemy:${enemy.enemyId}`);
  if (sprite) root.add(sprite);
  root.add(renderHpBar(scene, x - 82, y + 96, 164, enemy.hp, enemy.maxHp, def.name));
  if (enemy.block > 0) root.add(renderStatPill(scene, x - 82, y + 142, `格擋 ${enemy.block}`, 0x39d98a));
  root.add(renderIntent(scene, context, assets, enemy.intent.type, enemy.intent.amount ?? 0, x + 36, y + 132));
  root.add(
    button(scene, context, `enemy:${enemy.instanceId}`, "目標", x - 54, y + 168, 108, 34, onTarget, selectedTargetEnabled && enemy.hp > 0, selectedTargetEnabled ? colors.red : colors.disabled)
  );
  if (selectedTargetEnabled) {
    root.add(scene.add.rectangle(x - 92, y - 92, 184, 244, 0xf4e04d, 0).setOrigin(0).setStrokeStyle(3, 0xf4e04d, 0.85));
  }
  return root;
}

function renderIntent(scene: Phaser.Scene, context: UiRenderContext, assets: AssetRegistry, intentType: IntentIconType, amount: number, x: number, y: number) {
  const root = scene.add.container(x, y);
  const icon = image(scene, context, 0, 0, assets.getIntentIcon(intentType).key, 34, 34, `intent:${intentType}`);
  if (icon) root.add(icon);
  root.add(label(scene, 24, -10, amount > 0 ? String(amount) : intentLabel(intentType), 14, colors.gold));
  return root;
}

function intentLabel(intentType: IntentIconType) {
  if (intentType === "attack") return "攻擊";
  if (intentType === "block") return "格擋";
  if (intentType === "debuff") return "狀態";
  return "混合";
}
```

- [ ] **Step 2: Refactor `drawCombat` to use battle layout**

In `GameScene.ts`, import:

```ts
import { ENEMY_SIZE, renderEnemyView } from "../phaser/ui/EnemyView";
import { layout } from "../phaser/ui/uiTheme";
import { panel, label } from "../phaser/ui/uiPrimitives";
```

In `drawCombat`, render battlefield panel and enemies:

```ts
this.root?.add(panel(this, layout.battlefield.x, layout.battlefield.y, layout.battlefield.w, layout.battlefield.h, "戰鬥場域"));
combat.enemies.forEach((enemy, index) => {
  const x = layout.battlefield.x + 180 + index * 230;
  const y = layout.battlefield.y + 150;
  this.root?.add(
    renderEnemyView({
      scene: this,
      context: this.uiContext(),
      data: this.dataModel,
      assets: this.assets,
      enemy,
      x,
      y,
      selectedTargetEnabled: Boolean(this.selected),
      onTarget: () => this.playSelectedOnEnemy(enemy.instanceId)
    })
  );
});
```

Render right-side combat log panel:

```ts
const logPanel = panel(this, layout.rightPanel.x, layout.rightPanel.y, layout.rightPanel.w, layout.rightPanel.h, "戰況");
logPanel.add(label(this, 14, 48, combat.events.map((event) => event.message).slice(-8).join("\n"), 13, "#d1d5db", layout.rightPanel.w - 28));
this.root?.add(logPanel);
```

Render hand inside hand zone:

```ts
const handPanel = panel(this, layout.hand.x, layout.hand.y, layout.hand.w, layout.hand.h, "手牌");
this.root?.add(handPanel);
const startX = layout.hand.x + 18;
const y = layout.hand.y + 28;
hand.forEach((card, index) => {
  const x = startX + index * 138;
  const cardDef = this.dataModel.cards.find((item) => item.id === card.cardId)!;
  const selected = this.selected?.cardInstanceId === card.instanceId;
  const cardView = renderCardView({
    scene: this,
    context: this.uiContext(),
    data: this.dataModel,
    assets: this.assets,
    x,
    y,
    card: cardDef,
    instance: card,
    selected,
    playable: effectiveCardCost(this.dataModel, card) <= combat.player.energy,
    mode: "hand"
  });
  this.root?.add(cardView);
  this.button(`card:${card.instanceId}`, "", x, y, CARD_WIDTH, CARD_HEIGHT, () => this.selectOrPlayCard(card.instanceId), true, selected ? 0xf4e04d : 0x2b3340, 0.02);
});
```

- [ ] **Step 3: Keep E2E target buttons stable**

Ensure `renderEnemyView` still registers `enemy:${enemy.instanceId}` buttons and hand cards still register `card:${card.instanceId}`. `playOneCardIfPossible` in `tests/e2e/fullRunSmoke.mjs` must not change for this task.

- [ ] **Step 4: Build, E2E, and commit**

Run:

```bash
npm run build
npm run test:e2e
```

Expected: E2E passes; attack card can still be selected and applied to enemy.

Commit:

```bash
git add src/phaser/ui/EnemyView.ts src/scenes/GameScene.ts
git commit -m "feat: redesign combat screen UI"
```

## Task 6: MapView Redesign With Node Icons

**Files:**
- Replace: `src/phaser/ui/MapView.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `tests/e2e/fullRunSmoke.mjs`

- [ ] **Step 1: Replace `MapView.ts`**

Replace `src/phaser/ui/MapView.ts`:

```ts
import Phaser from "phaser";
import type { AssetRegistry, MapNode, NodeType } from "../../core";
import { button, image, label, panel } from "./uiPrimitives";
import { colors } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";

export const MAP_NODE_RADIUS = 34;

export interface MapViewOptions {
  scene: Phaser.Scene;
  context: UiRenderContext;
  assets: AssetRegistry;
  nodes: readonly MapNode[];
  reachableNodeIds: readonly string[];
  currentNodeId?: string;
  onSelectNode: (nodeId: string) => void;
}

export function renderMapView(options: MapViewOptions) {
  const { scene, context, assets, nodes, reachableNodeIds, currentNodeId, onSelectNode } = options;
  const root = scene.add.container(0, 0);
  root.add(panel(scene, 54, 96, 890, 560, "爬塔路線"));
  root.add(panel(scene, 972, 96, 250, 360, "路線提示"));
  for (const node of nodes) {
    for (const nextId of node.next) {
      const next = nodes.find((item) => item.id === nextId);
      if (!next) continue;
      const p1 = mapNodePoint(node);
      const p2 = mapNodePoint(next);
      root.add(scene.add.line(0, 0, p1.x, p1.y, p2.x, p2.y, 0xffffff, 0.16).setOrigin(0));
    }
  }
  for (const node of nodes) {
    const point = mapNodePoint(node);
    const reachable = reachableNodeIds.includes(node.id);
    const current = currentNodeId === node.id;
    const icon = image(scene, context, point.x, point.y, assets.getNodeIcon(node.type).key, reachable ? 58 : 46, reachable ? 58 : 46, `node:${node.type}`, reachable ? 1 : 0.38);
    if (icon) root.add(icon);
    root.add(
      button(scene, context, `map:${node.id}`, "", point.x - MAP_NODE_RADIUS, point.y - MAP_NODE_RADIUS, MAP_NODE_RADIUS * 2, MAP_NODE_RADIUS * 2, () => onSelectNode(node.id), reachable, reachable ? colors.cyan : colors.disabled, 0.02)
    );
    if (reachable) root.add(scene.add.circle(point.x, point.y, 38, 0xf4e04d, 0).setStrokeStyle(3, 0xf4e04d, 0.78));
    if (current) root.add(scene.add.circle(point.x, point.y, 43, 0x39d98a, 0).setStrokeStyle(3, 0x39d98a, 0.84));
    root.add(label(scene, point.x, point.y + 38, `F${node.floor}`, 12, colors.ink).setOrigin(0.5));
  }
  root.add(label(scene, 996, 146, "亮起的節點可以前往。\n圖示代表戰鬥、事件、休息、商店與 Boss。", 15, "#d1d5db", 210));
  return root;
}

export function mapNodePoint(node: MapNode) {
  return {
    x: 108 + (node.floor - 1) * 74,
    y: 190 + node.x * 300
  };
}

export function nodeTypeLabel(type: NodeType) {
  if (type === "normalCombat") return "戰鬥";
  if (type === "eliteCombat") return "精英";
  if (type === "event") return "事件";
  if (type === "rest") return "休息";
  if (type === "shop") return "商店";
  return "Boss";
}
```

- [ ] **Step 2: Use `renderMapView` in `GameScene`**

Replace `drawMap()` body with:

```ts
this.root?.add(
  renderMapView({
    scene: this,
    context: this.uiContext(),
    assets: this.assets,
    nodes: this.engine.run.map,
    reachableNodeIds: this.engine.run.reachableNodeIds,
    currentNodeId: this.engine.run.currentNodeId,
    onSelectNode: (nodeId) => {
      selectMapNode(this.engine, nodeId);
      this.selected = undefined;
      this.render();
    }
  })
);
```

- [ ] **Step 3: Update E2E boss detection**

Because map buttons now have empty labels, update `chooseMapButton` in `tests/e2e/fullRunSmoke.mjs`:

```js
const node = nodesById.get(next.id);
if (node?.type === "boss") visitedActions.add("boss");
```

Replace the existing `if (next.label === "王") visitedActions.add("boss");` line with:

```js
const selectedNode = new Map(current.map.nodes.map((node) => [`map:${node.id}`, node])).get(next.id);
if (selectedNode?.type === "boss") visitedActions.add("boss");
```

- [ ] **Step 4: Build, E2E, and commit**

Run:

```bash
npm run build
npm run test:e2e
```

Expected: E2E still reaches event/rest/shop/boss/victory. `visibleAssets` includes `ui:nodeNormalCombat` and `ui:nodeBoss` during map mode.

Commit:

```bash
git add src/phaser/ui/MapView.ts src/scenes/GameScene.ts tests/e2e/fullRunSmoke.mjs
git commit -m "feat: redesign map with node icons"
```

## Task 7: Reward, Shop, Rest, And Event Screens

**Files:**
- Replace: `src/phaser/ui/RewardView.ts`
- Replace: `src/phaser/ui/ShopView.ts`
- Replace: `src/phaser/ui/EventView.ts`
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Replace `RewardView.ts`**

Replace `src/phaser/ui/RewardView.ts`:

```ts
import Phaser from "phaser";
import type { AssetRegistry, GameData, RewardState } from "../../core";
import { button, label, panel } from "./uiPrimitives";
import { cardSize, colors } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";
import { renderCardView } from "./CardView";
import { renderRelicRow } from "./RelicView";

export const REWARD_CARD_GAP = 240;

export function renderRewardView(
  scene: Phaser.Scene,
  context: UiRenderContext,
  data: GameData,
  assets: AssetRegistry,
  reward: RewardState,
  onChooseCard: (cardId: string) => void,
  onSkip: () => void
) {
  const root = scene.add.container(0, 0);
  root.add(panel(scene, 72, 104, 1120, 520, "戰鬥獎勵"));
  reward.cards.forEach((card, index) => {
    const x = 210 + index * REWARD_CARD_GAP;
    root.add(renderCardView({ scene, context, data, assets, x, y: 178, w: cardSize.rewardW, h: cardSize.rewardH, card, mode: "reward" }));
    root.add(button(scene, context, `reward:${card.id}`, "加入牌組", x, 444, cardSize.rewardW, 44, () => onChooseCard(card.id)));
  });
  if (reward.relic) {
    root.add(label(scene, 842, 178, `精英遺物：${reward.relic.name}`, 18, colors.purpleText, 260));
    root.add(renderRelicRow(scene, context, data, assets, [reward.relic.id], 842, 214));
    root.add(label(scene, 842, 264, reward.relic.description, 14, "#d1d5db", 260));
  }
  root.add(button(scene, context, "reward:skip", `跳過 +${reward.gold} 金幣`, 506, 556, 240, 46, onSkip, true, colors.green));
  return root;
}
```

- [ ] **Step 2: Replace `ShopView.ts`**

Replace `src/phaser/ui/ShopView.ts`:

```ts
import Phaser from "phaser";
import type { AssetRegistry, GameData, ShopItem } from "../../core";
import { button, image, label, panel } from "./uiPrimitives";
import { cardSize, colors } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";
import { renderCardView } from "./CardView";

export const SHOP_ITEM_WIDTH = 220;

export function renderShopView(
  scene: Phaser.Scene,
  context: UiRenderContext,
  data: GameData,
  assets: AssetRegistry,
  items: readonly ShopItem[],
  gold: number,
  onBuy: (itemId: string) => void,
  onLeave: () => void
) {
  const root = scene.add.container(0, 0);
  root.add(panel(scene, 64, 104, 1120, 514, `商人  金幣 ${gold}`));
  items.forEach((item, index) => {
    const x = 100 + index * 214;
    const y = 188;
    const soldOrPoor = item.sold || gold < item.price;
    if (item.kind === "card") {
      const card = data.cards.find((entry) => entry.id === item.itemId);
      if (card) root.add(renderCardView({ scene, context, data, assets, x, y, w: 160, h: 214, card, mode: "shop", playable: !soldOrPoor }));
    } else {
      root.add(panel(scene, x, y, 160, 214, item.kind === "relic" ? "遺物" : "服務"));
      const iconKey = item.kind === "relic" ? assets.getRelicIcon(item.itemId).key : assets.getPlaceholder("uiIcon").key;
      const icon = image(scene, context, x + 80, y + 78, iconKey, 82, 82, `shop:${item.kind}:${item.itemId}`, soldOrPoor ? 0.45 : 1);
      if (icon) root.add(icon);
      const name = item.kind === "relic" ? data.relics.find((relic) => relic.id === item.itemId)?.name ?? item.itemId : "移除一張牌";
      root.add(label(scene, x + 16, y + 138, name, 15, colors.ink, 128));
    }
    root.add(button(scene, context, `shop:${item.id}`, item.sold ? "已售出" : `${item.price}G`, x, y + 226, 160, 42, () => onBuy(item.id), !soldOrPoor));
  });
  root.add(button(scene, context, "shop:leave", "離開商店", 520, 556, 220, 48, onLeave, true, colors.green));
  return root;
}
```

- [ ] **Step 3: Replace `EventView.ts`**

Replace `src/phaser/ui/EventView.ts`:

```ts
import Phaser from "phaser";
import type { AssetRegistry, EventDefinition, GameData } from "../../core";
import { button, image, label, panel } from "./uiPrimitives";
import { colors } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";
import { contractOptionLabel } from "./ContractView";

export const EVENT_PANEL_WIDTH = 720;

export function renderEventView(
  scene: Phaser.Scene,
  context: UiRenderContext,
  data: GameData,
  assets: AssetRegistry,
  event: EventDefinition,
  onChoose: (optionId: string) => void
) {
  const root = scene.add.container(0, 0);
  root.add(panel(scene, 58, 102, 1128, 524, event.name));
  const eventImage = image(scene, context, 296, 348, assets.getEventImage(event.id).key, 420, 280, `event:${event.id}`);
  if (eventImage) root.add(eventImage);
  root.add(label(scene, 540, 150, event.body, 18, colors.ink, 560));
  event.options.forEach((option, index) => {
    const y = 242 + index * 128;
    root.add(panel(scene, 540, y, 560, 96, option.label));
    if (option.contractId) {
      const contractIcon = image(scene, context, 570, y + 54, assets.getContractIcon(option.contractId).key, 44, 44, `contract:${option.contractId}`);
      if (contractIcon) root.add(contractIcon);
    }
    root.add(label(scene, 626, y + 38, contractOptionLabel(data, option.contractId) ?? option.description, 13, "#d1d5db", 334));
    root.add(button(scene, context, `event:${option.id}`, "選擇", 982, y + 28, 92, 42, () => onChoose(option.id), true, option.contractId ? colors.red : colors.cyan));
  });
  return root;
}
```

- [ ] **Step 4: Use screen renderers in `GameScene`**

Update `drawReward`, `drawShop`, and `drawEvent` to delegate:

```ts
private drawReward() {
  const reward = this.engine.run.reward;
  if (!reward) return;
  this.root?.add(
    renderRewardView(this, this.uiContext(), this.dataModel, this.assets, reward, (cardId) => {
      chooseCardReward(this.engine, cardId);
      this.render();
    }, () => {
      skipCardReward(this.engine);
      this.render();
    })
  );
}
```

```ts
private drawShop() {
  if (!this.engine.run.shop) return;
  this.root?.add(
    renderShopView(this, this.uiContext(), this.dataModel, this.assets, this.engine.run.shop, this.engine.run.gold, (itemId) => {
      buyShopItem(this.engine, itemId);
      this.render();
    }, () => {
      leaveShop(this.engine);
      this.render();
    })
  );
}
```

```ts
private drawEvent() {
  const event = this.engine.run.activeEvent;
  if (!event) return;
  this.root?.add(
    renderEventView(this, this.uiContext(), this.dataModel, this.assets, event, (optionId) => {
      chooseEventOption(this.engine, optionId);
      this.render();
    })
  );
}
```

- [ ] **Step 5: Build, E2E, and commit**

Run:

```bash
npm run build
npm run test:e2e
```

Expected: E2E visits reward/shop/event and passes. `visibleAssets` includes event image, contract icon when event option has a contract, and relic icon when reward has a relic.

Commit:

```bash
git add src/phaser/ui/RewardView.ts src/phaser/ui/ShopView.ts src/phaser/ui/EventView.ts src/scenes/GameScene.ts
git commit -m "feat: redesign reward shop and event screens"
```

## Task 8: Rest, Title, And End Screens

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/phaser/ui/StatusView.ts`

- [ ] **Step 1: Redesign title screen with existing assets**

Update `drawTitle()` in `GameScene.ts`:

```ts
private drawTitle() {
  const hero = this.assets.getPlaceholder("character");
  this.root?.add(panel(this, 72, 104, 1136, 512));
  this.image(410, 360, hero.key, 330, 330, 0.96, "title:seeker");
  this.text(670, 190, "記憶牌塔", 64, "#fff8d8");
  this.text(674, 270, "爬上 12 層牌塔，讓每一張牌記住它的戰鬥方式。", 22, "#d1d5db", 0, 0, 440);
  const notebook = this.assets.getRelicIcon("broken_notes");
  this.image(700, 390, notebook.key, 70, 70, 1, "title:starter-relic");
  this.text(748, 364, "起始遺物：破碎筆記", 18, "#c4b5fd", 0, 0, 300);
  this.text(748, 394, "戰鬥後，使用最多的牌獲得記憶進度。", 14, "#d1d5db", 0, 0, 300);
  this.button("start", "開始一局", 704, 506, 220, 56, () => {
    this.startAudio();
    startRun(this.engine);
    this.render();
  }, true, 0x39d98a);
}
```

This uses existing private `image`, `text`, and `button`; update `image` signature in Step 4 below.

- [ ] **Step 2: Redesign rest screen**

Update `drawRest()`:

```ts
private drawRest() {
  this.root?.add(panel(this, 82, 112, 1100, 500, "休息點"));
  const restIcon = this.assets.getNodeIcon("rest");
  this.image(208, 286, restIcon.key, 150, 150, 1, "rest:icon");
  this.text(324, 170, "整理記憶，或先保住性命。", 24, "#fff8d8", 0, 0, 520);
  this.button("rest:heal", "回血 30%", 330, 298, 220, 64, () => {
    restHeal(this.engine);
    this.render();
  }, true, 0x39d98a);
  const mutable = this.engine.run.deck.find((card) => canMutate(card));
  if (mutable) {
    const cardDef = this.dataModel.cards.find((card) => card.id === mutable.cardId);
    if (cardDef) {
      this.root?.add(renderCardView({
        scene: this,
        context: this.uiContext(),
        data: this.dataModel,
        assets: this.assets,
        x: 704,
        y: 204,
        w: 160,
        h: 222,
        card: cardDef,
        instance: mutable,
        mode: "preview"
      }));
    }
  }
  this.button("rest:mutate", mutable ? "變異記憶牌" : "沒有可變異的牌", 682, 456, 220, 56, () => {
    restMutate(this.engine, mutable?.instanceId);
    this.render();
  }, Boolean(mutable), 0xf4e04d);
}
```

- [ ] **Step 3: Redesign end screen**

Update `drawEnd()`:

```ts
private drawEnd(title: string, subtitle: string, color: number) {
  this.root?.add(panel(this, 112, 112, 1056, 480));
  const visualKey = this.engine.run.mode === "victory" ? this.assets.getEnemySprite("tower_heart").key : this.assets.getPlaceholder("character").key;
  this.image(402, 346, visualKey, this.engine.run.mode === "victory" ? 300 : 260, 240, 0.9, `end:${this.engine.run.mode}`);
  this.text(650, 232, title, 54, "#fff8d8");
  this.text(654, 306, subtitle, 22, "#d1d5db", 0, 0, 360);
  this.text(654, 358, `抵達樓層：${this.engine.run.floor}/12\n金幣：${this.engine.run.gold}\n牌組：${this.engine.run.deck.length}`, 16, "#ffffff", 0, 0, 320);
  this.button("restart", "重新開始", 654, 486, 184, 54, () => {
    this.engine = createRun(this.dataModel, { seed: 20260505, quick: this.quick });
    this.selected = undefined;
    this.render();
  }, true, color);
}
```

- [ ] **Step 4: Update private `image` helper to track visible assets**

Change `GameScene.image` signature:

```ts
private image(x: number, y: number, key: string, w: number, h: number, alpha = 1, role = "image") {
  if (!this.textures.exists(key)) return;
  const image = this.add.image(x, y, key).setDisplaySize(w, h).setAlpha(alpha);
  this.visibleAssets.push({ key, role });
  this.root?.add(image);
}
```

- [ ] **Step 5: Build, E2E, and commit**

Run:

```bash
npm run build
npm run test:e2e
```

Expected: E2E passes; title, rest, and victory/defeat snapshots have visible assets.

Commit:

```bash
git add src/scenes/GameScene.ts src/phaser/ui/StatusView.ts
git commit -m "feat: redesign title rest and end screens"
```

## Task 9: E2E Visible Asset Assertions And Screenshots

**Files:**
- Modify: `tests/e2e/helpers.mjs`
- Modify: `tests/e2e/fullRunSmoke.mjs`

- [ ] **Step 1: Add screenshot helper and visible asset assertion helper**

Update `tests/e2e/helpers.mjs`:

```js
export async function screenshot(page, name) {
  await page.screenshot({ path: `output/e2e/${name}.png`, fullPage: false });
}

export function assertVisibleAssetPrefix(current, prefix, mode) {
  const found = current.visibleAssets?.some((asset) => asset.key.startsWith(prefix));
  if (!found) {
    throw new Error(`Expected visible asset prefix ${prefix} in ${mode}.\n${JSON.stringify(current.visibleAssets, null, 2)}`);
  }
}

export function assertVisibleAssetRole(current, role, mode) {
  const found = current.visibleAssets?.some((asset) => asset.role === role || asset.role.startsWith(`${role}:`));
  if (!found) {
    throw new Error(`Expected visible asset role ${role} in ${mode}.\n${JSON.stringify(current.visibleAssets, null, 2)}`);
  }
}
```

- [ ] **Step 2: Update E2E to assert UI asset usage per screen**

Update import in `tests/e2e/fullRunSmoke.mjs`:

```js
import { assertVisibleAssetPrefix, assertVisibleAssetRole, clickButton, firstEnabledButton, screenshot, state, withGamePage } from "./helpers.mjs";
```

Add after initial title state:

```js
assertVisibleAssetRole(current, "title", "title");
await screenshot(page, "title");
```

After start/map:

```js
assertVisibleAssetPrefix(current, "ui:node", "map");
await screenshot(page, "map");
```

After entering combat:

```js
assertVisibleAssetPrefix(current, "enemy:", "combat");
assertVisibleAssetPrefix(current, "card:", "combat");
assertVisibleAssetPrefix(current, "ui:intent", "combat");
await screenshot(page, "combat");
```

After reward:

```js
assertVisibleAssetPrefix(current, "card:", "reward");
await screenshot(page, "reward");
```

Inside the loop, after each state read:

```js
if (current.mode === "event") assertVisibleAssetPrefix(current, "event:", "event");
if (current.mode === "shop") assert.ok(current.visibleAssets?.length > 0, "shop should render visible assets");
if (current.mode === "rest") assertVisibleAssetRole(current, "rest", "rest");
```

Before finishing after victory:

```js
assertVisibleAssetRole(current, "end", "victory");
await screenshot(page, "victory");
```

- [ ] **Step 3: Run E2E and commit**

Run:

```bash
rm -rf output/e2e
npm run test:e2e
```

Expected: E2E passes and creates screenshots under `output/e2e/`. `output/` is ignored, so screenshots are not committed.

Commit:

```bash
git add tests/e2e/helpers.mjs tests/e2e/fullRunSmoke.mjs
git commit -m "test: assert redesigned UI asset usage"
```

## Task 10: Browser Visual Review And Final Fixes

**Files:**
- Modify only files already touched by this plan, as needed for visual fixes.

- [ ] **Step 1: Run full verification**

Run:

```bash
npm test
npm run build
npm run test:e2e
```

Expected:

- Vitest: all files pass.
- Build: Vite production build succeeds.
- E2E: full quick-run passes with no console errors.

- [ ] **Step 2: Start dev server for manual browser review**

Run:

```bash
npm run dev -- --port 5173
```

Expected: Vite reports `Local: http://127.0.0.1:5173/`.

- [ ] **Step 3: Capture and inspect key screenshots**

Use in-app browser or Playwright to inspect:

- `http://127.0.0.1:5173/`
- `http://127.0.0.1:5173/?e2e=1`

Screens that must be visually checked:

- title
- map
- combat
- reward
- rest
- shop
- event
- victory or defeat

Pass criteria:

- Node icons are visible on map.
- Intent icons are visible in combat.
- Cards use full card frames.
- Relics/contracts/stickers are visible where relevant.
- Main text is not overlapping.
- Buttons remain clickable.

- [ ] **Step 4: Fix visual issues found during review**

When a visual issue is found, make the smallest scoped adjustment in the relevant component:

- Card layout issues: `src/phaser/ui/CardView.ts`
- Enemy intent/status issues: `src/phaser/ui/EnemyView.ts` or `src/phaser/ui/StatusView.ts`
- Map icon/line issues: `src/phaser/ui/MapView.ts`
- Reward/shop/event layout issues: their matching view files
- Screen composition issues: `src/scenes/GameScene.ts`

After each fix, run:

```bash
npm run build
npm run test:e2e
```

Expected: build and E2E continue to pass.

- [ ] **Step 5: Commit final visual fixes**

Commit:

```bash
git add src tests
git commit -m "fix: polish redesigned game UI"
```

If there were no visual fixes after Task 9, do not create an empty commit.

## Task 11: Complete Backlog State

**Files:**
- Move: `backlogs/in-progress/17-overall-game-ui-redesign-backlog.md` to `backlogs/done/17-overall-game-ui-redesign-backlog.md`

- [ ] **Step 1: Move backlog to done**

Run:

```bash
git mv backlogs/in-progress/17-overall-game-ui-redesign-backlog.md backlogs/done/17-overall-game-ui-redesign-backlog.md
```

- [ ] **Step 2: Run final verification from the feature worktree**

Run:

```bash
npm test
npm run build
npm run test:e2e
```

Expected: all pass.

- [ ] **Step 3: Commit backlog completion**

Commit:

```bash
git add backlogs/done/17-overall-game-ui-redesign-backlog.md
git commit -m "docs: complete overall UI redesign backlog"
```

## Self-Review Checklist

- Spec coverage:
  - Asset helper requirements: Task 1.
  - Component boundary requirements: Tasks 2-8.
  - Title, map, combat, reward, shop, rest, event, victory/defeat requirements: Tasks 5-8.
  - Test hook and E2E requirements: Tasks 2, 9, 10.
  - Backlog lifecycle requirements: Task 11.
- Type consistency:
  - `ButtonDescriptor`, `VisibleAssetDescriptor`, and `UiRenderContext` originate in `uiTypes.ts`.
  - `AssetRegistry` helpers use existing `NodeType`, `MemoryType`, and UI asset ids.
  - `GameScene` remains the command orchestrator; UI modules receive callbacks and do not mutate core state.
- Verification:
  - Every implementation task includes `npm run build` or targeted tests.
  - Final tasks include full `npm test`, `npm run build`, and `npm run test:e2e`.
