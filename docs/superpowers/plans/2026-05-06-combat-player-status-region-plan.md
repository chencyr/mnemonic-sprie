# Combat Player Status Region Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the combat left-top debug-style player panel with the accepted `player-status-base.png` asset, Phaser-rendered HP fill/text, energy/block text, and a testable `playerStatusUi` snapshot.

**Architecture:** Keep gameplay rules in `src/core/` unchanged. Add typed asset registry entries, a focused Phaser UI state helper, then wire `CombatSceneView` and `GameScene` to render the accepted base asset and expose the derived UI contract through `window.render_game_to_text()`.

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest, Playwright E2E, project asset registry.

---

## File Structure

- Modify `src/data/assets.json`: register the four generated player status UI files under `assets.ui`.
- Modify `src/core/assets/assetRegistry.ts`: add typed combat UI keys for the player status asset set.
- Modify `tests/core/assetRegistry.test.ts`: prove the new keys resolve and preload.
- Create `src/phaser/ui/combatPlayerStatusUi.ts`: derive UI-only HP ratio, HP state, block/energy flags, and pile counts from `CombatState`.
- Create `tests/phaser/combatPlayerStatusUi.test.ts`: lock the helper thresholds and snapshot values before renderer changes.
- Modify `src/phaser/ui/CombatSceneView.ts`: render HP fill below the cleaned base aperture, then overlay dynamic HP/energy/block text.
- Modify `src/scenes/GameScene.ts`: pass `UiRenderContext` and assets into the renderer, and expose `playerStatusUi` in `TextSnapshot`.
- Modify `tests/e2e/fullRunSmoke.mjs`: assert the new asset role and `playerStatusUi` consistency with the combat snapshot.

## Implementation Rules

- Do not modify core combat rules, card effects, turn flow, enemy logic, or HP/block/energy mechanics.
- Do not use `public/assets/ui/combat/player-panel.png` for this left-top runtime panel.
- Do not render readable text from PNG assets; HP, energy, block, and pile counts remain Phaser text.
- Do not add deck graphics into `player-status-base.png`; only Phaser text may show pile counts.
- Use the documented accepted redrawn `player-status-base.png`: HP lane is a transparent runtime fill aperture, and the block plate is opaque.
- Draw the red HP fill before drawing `player-status-base.png`.
- Use Codex app browser / develop-web-game style verification for visual inspection; do not use an external browser.

### Task 1: Register Player Status UI Assets

**Files:**
- Modify: `src/data/assets.json`
- Modify: `src/core/assets/assetRegistry.ts`
- Test: `tests/core/assetRegistry.test.ts`

- [ ] **Step 1: Add failing asset registry assertions**

Add these assertions to the existing `resolves combat UI assets through typed lookup` test in `tests/core/assetRegistry.test.ts`:

```ts
expect(registry.getCombatUiAsset("playerStatusBase")).toEqual({
  key: "ui:combatPlayerStatusBase",
  path: "/assets/ui/combat/player-status-base.png"
});
expect(registry.getCombatUiAsset("playerStatusHpFillSlot")).toEqual({
  key: "ui:combatPlayerStatusHpFillSlot",
  path: "/assets/ui/combat/player-status-hp-fill-slot.png"
});
expect(registry.getCombatUiAsset("playerStatusEnergyValueSlot")).toEqual({
  key: "ui:combatPlayerStatusEnergyValueSlot",
  path: "/assets/ui/combat/player-status-energy-value-slot.png"
});
expect(registry.getCombatUiAsset("playerStatusBlockValueSlot")).toEqual({
  key: "ui:combatPlayerStatusBlockValueSlot",
  path: "/assets/ui/combat/player-status-block-value-slot.png"
});
```

Add this assertion to `preloads combat UI assets from asset data`:

```ts
expect(entries).toContainEqual({
  key: "ui:combatPlayerStatusBase",
  path: "/assets/ui/combat/player-status-base.png"
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run:

```bash
npm test -- tests/core/assetRegistry.test.ts
```

Expected: FAIL because `playerStatusBase` is not assignable to `CombatUiAssetKey` and the data keys do not exist.

- [ ] **Step 3: Add asset data keys**

In `src/data/assets.json`, add these entries inside `assets.ui` after `combatPlayerPanel`:

```json
"combatPlayerStatusBase": "ui/combat/player-status-base.png",
"combatPlayerStatusHpFillSlot": "ui/combat/player-status-hp-fill-slot.png",
"combatPlayerStatusEnergyValueSlot": "ui/combat/player-status-energy-value-slot.png",
"combatPlayerStatusBlockValueSlot": "ui/combat/player-status-block-value-slot.png",
```

- [ ] **Step 4: Add typed combat UI key mapping**

In `src/core/assets/assetRegistry.ts`, extend `CombatUiAssetKey`:

```ts
export type CombatUiAssetKey =
  | "battleBg"
  | "playerPanel"
  | "playerStatusBase"
  | "playerStatusHpFillSlot"
  | "playerStatusEnergyValueSlot"
  | "playerStatusBlockValueSlot"
  | "topResourceFrame"
  | "turnDevice"
  | "tickerPanel"
  | "enemyPlatform"
  | "targetRing"
  | "handTray"
  | "dropZone";
```

Then extend `combatUiAssetKeys`:

```ts
const combatUiAssetKeys: Record<CombatUiAssetKey, keyof GameData["assets"]["ui"]> = {
  battleBg: "combatBattleBg",
  playerPanel: "combatPlayerPanel",
  playerStatusBase: "combatPlayerStatusBase",
  playerStatusHpFillSlot: "combatPlayerStatusHpFillSlot",
  playerStatusEnergyValueSlot: "combatPlayerStatusEnergyValueSlot",
  playerStatusBlockValueSlot: "combatPlayerStatusBlockValueSlot",
  topResourceFrame: "combatTopResourceFrame",
  turnDevice: "combatTurnDevice",
  tickerPanel: "combatTickerPanel",
  enemyPlatform: "combatEnemyPlatform",
  targetRing: "combatTargetRing",
  handTray: "combatHandTray",
  dropZone: "combatDropZone"
};
```

- [ ] **Step 5: Run registry tests and commit**

Run:

```bash
npm test -- tests/core/assetRegistry.test.ts
```

Expected: PASS.

Commit:

```bash
git add src/data/assets.json src/core/assets/assetRegistry.ts tests/core/assetRegistry.test.ts
git commit -m "feat: register combat player status assets"
```

### Task 2: Add Combat Player Status UI State Helper

**Files:**
- Create: `src/phaser/ui/combatPlayerStatusUi.ts`
- Test: `tests/phaser/combatPlayerStatusUi.test.ts`

- [ ] **Step 1: Write failing helper tests**

Create `tests/phaser/combatPlayerStatusUi.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { CombatState } from "../../src/core";
import { createCombatPlayerStatusUiState } from "../../src/phaser/ui/combatPlayerStatusUi";

function combatFixture(overrides: Partial<CombatState["player"]> = {}): CombatState {
  return {
    id: "combat-test",
    floor: 1,
    enemyKind: "normal",
    phase: "player",
    turn: 1,
    player: {
      hp: 72,
      maxHp: 72,
      block: 0,
      energy: 3,
      statuses: {},
      ...overrides
    },
    enemies: [],
    cards: [],
    hand: ["hand-1", "hand-2"],
    drawPile: ["draw-1", "draw-2", "draw-3"],
    discardPile: ["discard-1"],
    exhaustPile: [],
    events: [],
    playedThisTurn: [],
    playedCounts: {},
    summary: {
      attackCards: 0,
      defenseCards: 0,
      skillCards: 0,
      zeroCostCards: 0,
      totalCards: 0,
      retainedCards: 0,
      won: false
    },
    firstMemoryGained: false,
    bossCountermeasure: undefined
  };
}

describe("combat player status UI state", () => {
  it("derives healthy player status and resource counts", () => {
    const state = createCombatPlayerStatusUiState(combatFixture());

    expect(state).toEqual({
      hp: 72,
      maxHp: 72,
      hpRatio: 1,
      hpState: "healthy",
      block: 0,
      hasBlock: false,
      energy: 3,
      maxEnergy: 3,
      drawPileCount: 3,
      discardPileCount: 1,
      handCount: 2
    });
  });

  it.each([
    [36, "wounded"],
    [18, "critical"],
    [0, "dead"]
  ] as const)("maps hp %i to %s", (hp, hpState) => {
    const state = createCombatPlayerStatusUiState(combatFixture({ hp }));

    expect(state.hpState).toBe(hpState);
  });

  it("clamps hp ratio and exposes block presence", () => {
    const state = createCombatPlayerStatusUiState(combatFixture({ hp: 90, block: 12, energy: 2 }));

    expect(state.hpRatio).toBe(1);
    expect(state.block).toBe(12);
    expect(state.hasBlock).toBe(true);
    expect(state.energy).toBe(2);
  });
});
```

- [ ] **Step 2: Run the focused helper test and confirm failure**

Run:

```bash
npm test -- tests/phaser/combatPlayerStatusUi.test.ts
```

Expected: FAIL because `src/phaser/ui/combatPlayerStatusUi.ts` does not exist.

- [ ] **Step 3: Implement the helper**

Create `src/phaser/ui/combatPlayerStatusUi.ts`:

```ts
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
```

- [ ] **Step 4: Run helper tests and commit**

Run:

```bash
npm test -- tests/phaser/combatPlayerStatusUi.test.ts
```

Expected: PASS.

Commit:

```bash
git add src/phaser/ui/combatPlayerStatusUi.ts tests/phaser/combatPlayerStatusUi.test.ts
git commit -m "feat: derive combat player status ui state"
```

### Task 3: Render Accepted Player Status Base Asset

**Files:**
- Modify: `src/phaser/ui/CombatSceneView.ts`
- Modify: `src/scenes/GameScene.ts`
- Test: `tests/phaser/combatPlayerStatusUi.test.ts`

- [ ] **Step 1: Update renderer signature and layout**

In `src/phaser/ui/CombatSceneView.ts`, update imports:

```ts
import Phaser from "phaser";
import type { AssetRegistry } from "../../core";
import { image, label } from "./uiPrimitives";
import { colors, HUD_FONT } from "./uiTheme";
import type { UiRenderContext } from "./uiTypes";
import type { CombatPlayerStatusUiState } from "./combatPlayerStatusUi";
```

Change `combatLayout.playerPanel` to:

```ts
playerPanel: { x: 16, y: 12, w: 336, h: 192 },
```

- [ ] **Step 2: Replace `renderCombatPlayerPanel()`**

Replace the existing `renderCombatPlayerPanel()` function in `src/phaser/ui/CombatSceneView.ts` with:

```ts
export function renderCombatPlayerPanel(
  scene: Phaser.Scene,
  context: UiRenderContext,
  assets: AssetRegistry,
  status: CombatPlayerStatusUiState
) {
  const root = scene.add.container(combatLayout.playerPanel.x, combatLayout.playerPanel.y);
  const assetKey = assets.getCombatUiAsset("playerStatusBase").key;
  const hpFill = playerStatusHpFill(status);
  root.add(scene.add.rectangle(hpFill.x, hpFill.y, hpFill.w * status.hpRatio, hpFill.h, hpFill.color, 0.96).setOrigin(0));
  const base = image(
    scene,
    context,
    combatLayout.playerPanel.w / 2,
    combatLayout.playerPanel.h / 2,
    assetKey,
    combatLayout.playerPanel.w,
    combatLayout.playerPanel.h,
    "combat-ui:player-status-base"
  );
  if (base) root.add(base);

  root.add(statusText(scene, 168, 60, `${status.hp}/${status.maxHp}`, 22, "#fff8d8", 0.5));
  root.add(statusText(scene, 130, 128, `${status.energy}/${status.maxEnergy}`, 20, "#062024", 0.5));
  root.add(statusText(scene, 250, 132, `${status.block}`, 20, status.hasBlock ? "#102112" : "#2b3429", 0.5));
  root.add(statusText(scene, 244, 166, `牌 ${status.drawPileCount}/${status.discardPileCount}/${status.handCount}`, 11, colors.muted, 0.5));

  return root;
}

function playerStatusHpFill(status: CombatPlayerStatusUiState) {
  const colorByState: Record<CombatPlayerStatusUiState["hpState"], number> = {
    healthy: 0xff335f,
    wounded: 0xff7a2f,
    critical: 0xff1f6d,
    dead: 0x3f0b18
  };
  return {
    x: 145,
    y: 73,
    w: 146,
    h: 16,
    color: colorByState[status.hpState]
  };
}

function statusText(scene: Phaser.Scene, x: number, y: number, value: string, size: number, color: string, originX = 0) {
  return scene.add
    .text(x, y, value, {
      color,
      fontFamily: HUD_FONT,
      fontSize: `${size}px`,
      fontStyle: size >= 18 ? "800" : "650",
      align: "center"
    })
    .setOrigin(originX, 0.5);
}
```

- [ ] **Step 3: Wire `GameScene.drawCombat()`**

In `src/scenes/GameScene.ts`, add import:

```ts
import { createCombatPlayerStatusUiState } from "../phaser/ui/combatPlayerStatusUi";
```

Replace the `renderCombatPlayerPanel()` call with:

```ts
const playerStatusUi = createCombatPlayerStatusUiState(combat);
const playerPanel = renderCombatPlayerPanel(this, this.uiContext(), this.assets, playerStatusUi);
```

- [ ] **Step 4: Run build and fix type errors in touched files**

Run:

```bash
npm run build
```

Expected: PASS. If TypeScript reports unused imports from `bar`, `RunState`, or `colors`, remove only the unused imports from `src/phaser/ui/CombatSceneView.ts`.

- [ ] **Step 5: Commit renderer changes**

Commit:

```bash
git add src/phaser/ui/CombatSceneView.ts src/scenes/GameScene.ts
git commit -m "feat: render combat player status asset"
```

### Task 4: Expose Player Status UI Snapshot and E2E Contract

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `tests/e2e/fullRunSmoke.mjs`

- [ ] **Step 1: Add snapshot type**

In `src/scenes/GameScene.ts`, import the type:

```ts
import type { CombatPlayerStatusUiState } from "../phaser/ui/combatPlayerStatusUi";
```

Add this interface near `TextSnapshot`:

```ts
interface CombatPlayerStatusUiSnapshot extends CombatPlayerStatusUiState {
  visible: boolean;
  reference: "battle-design-proposal-1";
  assetRoles: string[];
}
```

Add this property to `TextSnapshot`:

```ts
playerStatusUi?: CombatPlayerStatusUiSnapshot;
```

- [ ] **Step 2: Add snapshot payload**

Inside `private snapshot()` in `src/scenes/GameScene.ts`, create the derived state before `return`:

```ts
const playerStatusUi = combat ? createCombatPlayerStatusUiState(combat) : undefined;
```

Add this field to the returned object next to `combatUi`:

```ts
playerStatusUi:
  playerStatusUi && run.mode === "combat"
    ? {
        ...playerStatusUi,
        visible: this.visibleAssets.some((asset) => asset.role === "combat-ui:player-status-base"),
        reference: "battle-design-proposal-1",
        assetRoles: this.visibleAssets.filter((asset) => asset.role.startsWith("combat-ui:player-status")).map((asset) => asset.role)
      }
    : undefined,
```

- [ ] **Step 3: Update E2E combat assertions**

In `tests/e2e/fullRunSmoke.mjs`, after `assertVisibleAssetRole(current, "combat-ui:background", "combat");`, add:

```js
assertVisibleAssetRole(current, "combat-ui:player-status-base", "combat");
assert.equal(current.playerStatusUi?.reference, "battle-design-proposal-1");
assert.equal(current.playerStatusUi?.visible, true);
assert.equal(current.playerStatusUi?.hp, current.combat.playerHp);
assert.equal(current.playerStatusUi?.maxHp, current.combat.playerMaxHp);
assert.equal(current.playerStatusUi?.block, current.combat.block);
assert.equal(current.playerStatusUi?.energy, current.combat.energy);
assert.ok(current.playerStatusUi.assetRoles.includes("combat-ui:player-status-base"));
```

Change the combat UI roles loop to:

```js
for (const role of ["combat-ui:background", "combat-ui:player-status-base"]) {
  assert.ok(current.combatUi.assetRoles.includes(role), `combat UI snapshot should include ${role}`);
}
```

Update `assertNoCombatPanelSurfaceAssets()` so it still rejects the old generated panel, but allows the new accepted status base:

```js
function assertNoCombatPanelSurfaceAssets(current) {
  const removedRoles = new Set(["combat-ui:player-panel", "combat-ui:top-resource", "combat-ui:ticker-panel", "combat-ui:hand-tray", "combat-ui:turn-device"]);
  const stillRendered = current.visibleAssets?.filter((asset) => removedRoles.has(asset.role)) ?? [];
  assert.deepEqual(stillRendered, [], "combat progress/ticker/action/hand regions should use black translucent Phaser regions; player status should use the accepted player-status-base asset.");
}
```

- [ ] **Step 4: Update HP tracking E2E to check `playerStatusUi` after enemy turn**

In `assertCombatHpTracksEnemyTurn(page)`, after the existing finite HP assertions, add:

```js
assert.equal(current.playerStatusUi?.hp, current.combat.playerHp);
assert.equal(current.playerStatusUi?.maxHp, current.combat.playerMaxHp);
assert.equal(current.playerStatusUi?.block, current.combat.block);
assert.equal(current.playerStatusUi?.energy, current.combat.energy);
```

- [ ] **Step 5: Run E2E and commit**

Run:

```bash
npm run test:e2e
```

Expected: PASS and `output/e2e/combat.png` contains the accepted player status base in the left-top region.

Commit:

```bash
git add src/scenes/GameScene.ts tests/e2e/fullRunSmoke.mjs output/e2e/combat.png
git commit -m "test: expose combat player status ui snapshot"
```

### Task 5: Full Verification and Visual Check

**Files:**
- Inspect: `output/e2e/combat.png`
- Inspect: browser `window.render_game_to_text()` output

- [ ] **Step 1: Run unit tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Run E2E smoke**

Run:

```bash
npm run test:e2e
```

Expected: PASS.

- [ ] **Step 4: Start local dev server for visual verification**

Run:

```bash
npm run dev -- --port 5174
```

Expected: Vite serves `http://127.0.0.1:5174/`.

- [ ] **Step 5: Use Codex app browser or develop-web-game Playwright client**

Navigate the in-app browser target to:

```text
http://127.0.0.1:5174/?e2e=1
```

Click into combat, then verify:

```js
JSON.parse(window.render_game_to_text()).playerStatusUi
```

Expected fields:

```json
{
  "visible": true,
  "reference": "battle-design-proposal-1",
  "assetRoles": ["combat-ui:player-status-base"]
}
```

Also inspect console/page errors. Expected: no console errors and no page errors.

- [ ] **Step 6: Visual acceptance check**

Inspect the latest combat screenshot and confirm:

- Left-top UI uses `player-status-base.png`.
- The base asset matches the accepted style-teradadara-like redraw.
- The HP fill appears through the transparent HP aperture and does not leak outside the framed slot.
- Energy and block runtime text sit on the intended lanes, and the block plate does not look translucent.
- HP, energy, and block text remain readable at 1280x720.
- The left-top component does not cover the enemy area, hand tray, or end-turn device.

- [ ] **Step 7: Final status commit**

If verification changes only screenshots or generated output that the repo tracks, commit them:

```bash
git add output/e2e/combat.png
git commit -m "test: refresh combat player status screenshot"
```

If verification produces no tracked changes, record the passing commands in the final response instead of creating an empty commit.

## Self-Review

- Spec coverage: Tasks cover accepted asset registration, Phaser-rendered HP fill/text, energy/block text, block opacity, `playerStatusUi` snapshot, E2E checks, and required visual verification.
- Completion scan: This plan does not contain unresolved filler language or open implementation gaps.
- Type consistency: `CombatPlayerStatusUiState`, `createCombatPlayerStatusUiState`, `playerStatusUi`, and `playerStatusBase` are named consistently across tests, renderer, snapshot, and E2E.
