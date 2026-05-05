# Phaser Game Feel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-pass combat game feel while fixing combat-time player HP display so damage feedback is both visible and accurate.

**Architecture:** Keep combat rules in `src/core/` unchanged. Add small Phaser-only FX helpers under `src/phaser/fx/`, make `GameScene` collect render anchors for player/enemy objects, and trigger tweens from new combat events after each render. UI state fixes stay in `HudView` and `GameScene` snapshot data so E2E can observe the correct HP.

**Tech Stack:** Phaser 3 tweens/camera effects, TypeScript, Vite, Vitest, Playwright E2E.

---

## File Structure

- Move: `backlogs/01-phaser-game-feel-backlog.md` to `backlogs/in-progress/01-phaser-game-feel-backlog.md`
  - Already done before writing this plan in `feature/phaser-game-feel`.
- Create: `src/phaser/fx/combatEventDiff.ts`
  - Pure helper for consuming only newly appended combat events per combat id.
- Create: `tests/phaser/combatEventDiff.test.ts`
  - Vitest coverage for event cursor reset, append handling, and event list truncation.
- Create: `src/phaser/fx/combatFx.ts`
  - Phaser tween helpers for target flash, shake, floating text, camera shake, and death fade.
- Create: `src/phaser/fx/screenFx.ts`
  - Phaser tween helpers for staggered reward/card entry and simple fade-slide effects.
- Modify: `src/phaser/ui/HudView.ts`
  - Add `PlayerPanelVitals` and render combat HP from `combat.player.hp`.
- Modify: `src/phaser/ui/RewardView.ts`
  - Return reward card containers and apply staggered entry via `screenFx`.
- Modify: `src/scenes/GameScene.ts`
  - Track combat event cursor, player/enemy anchors, HP snapshot fields, and trigger FX after combat render.
- Modify: `tests/e2e/fullRunSmoke.mjs`
  - Add combat HP display regression coverage and keep existing full-run assertions.

## Task 1: Pure Combat Event Diff Helper

**Files:**
- Create: `src/phaser/fx/combatEventDiff.ts`
- Create: `tests/phaser/combatEventDiff.test.ts`

- [ ] **Step 1: Write failing tests for event cursor behavior**

Create `tests/phaser/combatEventDiff.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { CombatEvent } from "../../src/core";
import { consumeNewCombatEvents, type CombatEventCursor } from "../../src/phaser/fx/combatEventDiff";

function event(type: string, message = type): CombatEvent {
  return { type, message };
}

describe("consumeNewCombatEvents", () => {
  it("returns every event when entering a new combat id", () => {
    const cursor: CombatEventCursor = { combatId: "old-combat", eventCount: 4 };
    const result = consumeNewCombatEvents(cursor, "new-combat", [event("COMBAT_STARTED"), event("CARDS_DRAWN")]);

    expect(result.events.map((item) => item.type)).toEqual(["COMBAT_STARTED", "CARDS_DRAWN"]);
    expect(result.cursor).toEqual({ combatId: "new-combat", eventCount: 2 });
  });

  it("returns only events appended after the last cursor count", () => {
    const cursor: CombatEventCursor = { combatId: "combat-1", eventCount: 2 };
    const result = consumeNewCombatEvents(cursor, "combat-1", [event("COMBAT_STARTED"), event("CARDS_DRAWN"), event("PLAYER_DAMAGED")]);

    expect(result.events.map((item) => item.type)).toEqual(["PLAYER_DAMAGED"]);
    expect(result.cursor).toEqual({ combatId: "combat-1", eventCount: 3 });
  });

  it("recovers when an event list is shorter than the stored count", () => {
    const cursor: CombatEventCursor = { combatId: "combat-1", eventCount: 9 };
    const result = consumeNewCombatEvents(cursor, "combat-1", [event("COMBAT_STARTED")]);

    expect(result.events.map((item) => item.type)).toEqual(["COMBAT_STARTED"]);
    expect(result.cursor).toEqual({ combatId: "combat-1", eventCount: 1 });
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm test -- tests/phaser/combatEventDiff.test.ts
```

Expected: FAIL because `src/phaser/fx/combatEventDiff.ts` does not exist.

- [ ] **Step 3: Implement the pure helper**

Create `src/phaser/fx/combatEventDiff.ts`:

```ts
import type { CombatEvent } from "../../core";

export interface CombatEventCursor {
  combatId?: string;
  eventCount: number;
}

export interface CombatEventDiff {
  events: CombatEvent[];
  cursor: CombatEventCursor;
}

export function consumeNewCombatEvents(cursor: CombatEventCursor, combatId: string, events: readonly CombatEvent[]): CombatEventDiff {
  const shouldReset = cursor.combatId !== combatId || cursor.eventCount > events.length;
  const start = shouldReset ? 0 : cursor.eventCount;

  return {
    events: events.slice(start),
    cursor: {
      combatId,
      eventCount: events.length
    }
  };
}
```

- [ ] **Step 4: Verify tests pass**

Run:

```bash
npm test -- tests/phaser/combatEventDiff.test.ts
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/phaser/fx/combatEventDiff.ts tests/phaser/combatEventDiff.test.ts
git commit -m "test: add combat event diff helper"
```

## Task 2: Combat-Time Player HP Display And Snapshot

**Files:**
- Modify: `src/phaser/ui/HudView.ts`
- Modify: `src/scenes/GameScene.ts`
- Modify: `tests/e2e/fullRunSmoke.mjs`

- [ ] **Step 1: Add failing E2E assertions for combat player HP**

Update `tests/e2e/fullRunSmoke.mjs`.

Add this assertion after entering the first combat and before `playOneCardIfPossible(page)`:

```js
  await assertCombatHpTracksEnemyTurn(page);
  current = await state(page);
  assert.equal(current.mode, "combat");
```

Add this helper below `playOneCardIfPossible`:

```js
async function assertCombatHpTracksEnemyTurn(page) {
  let current = await state(page);
  assert.ok(Number.isFinite(current.combat.playerHp), "combat snapshot should include playerHp");
  assert.ok(Number.isFinite(current.combat.playerMaxHp), "combat snapshot should include playerMaxHp");
  const beforeHp = current.combat.playerHp;

  current = await clickButton(page, "end-turn");
  assert.equal(current.mode, "combat");
  assert.ok(Number.isFinite(current.combat.playerHp), "combat playerHp should remain finite after enemy turn");
  assert.ok(current.combat.playerHp <= beforeHp, "enemy turn should not increase combat player HP");

  const damageEvent = current.combat.events.find((event) => event.type === "PLAYER_DAMAGED");
  if (damageEvent && damageEvent.payload?.damage > 0) {
    assert.ok(current.combat.playerHp < beforeHp, "combat playerHp should decrease when PLAYER_DAMAGED has positive damage");
  }
}
```

Update `assertNoInvalidNumbers`:

```js
  if (current.combat) {
    assert.ok(current.combat.energy >= 0, "energy should not be negative");
    assert.ok(Number.isFinite(current.combat.playerHp), "combat player HP should be finite");
    assert.ok(current.combat.playerHp >= 0, "combat player HP should not be negative");
    assert.ok(current.combat.playerHp <= current.combat.playerMaxHp, "combat player HP should not exceed max HP");
    for (const enemy of current.combat.enemies) {
      assert.ok(enemy.hp >= 0, `enemy HP should not be negative: ${enemy.id}`);
    }
  }
```

- [ ] **Step 2: Run E2E and confirm failure**

Run:

```bash
npm run test:e2e
```

Expected: FAIL because `current.combat.playerHp` and `current.combat.playerMaxHp` are missing from `window.render_game_to_text()`.

- [ ] **Step 3: Update player panel state API**

Modify `src/phaser/ui/HudView.ts`.

Add this interface above `renderPlayerPanel`:

```ts
export interface PlayerPanelVitals {
  hp: number;
  maxHp: number;
  energy: number;
  block: number;
}
```

Replace `renderPlayerPanel` with:

```ts
export function renderPlayerPanel(scene: Phaser.Scene, run: RunState, vitals?: PlayerPanelVitals) {
  const hp = vitals?.hp ?? run.playerHp;
  const maxHp = vitals?.maxHp ?? run.playerMaxHp;
  const energy = vitals?.energy ?? 0;
  const block = vitals?.block ?? 0;
  const root = panel(scene, layout.leftPanel.x, layout.leftPanel.y, layout.leftPanel.w, layout.leftPanel.h, "拾憶者");
  root.add(renderHpBar(scene, 14, 52, 184, hp, maxHp, "HP"));
  root.add(renderStatPill(scene, 14, 104, `能量 ${energy}/3`, 0x2dd4bf));
  root.add(renderStatPill(scene, 106, 104, `格擋 ${block}`, 0x39d98a));
  root.add(label(scene, 14, 154, `牌組 ${run.deck.length}`, 15, "#a7f3d0"));
  root.add(label(scene, 14, 184, `樓層 ${run.floor || 0}`, 15, colors.ink));
  return root;
}
```

- [ ] **Step 4: Use combat HP in `GameScene.drawCombat`**

In `src/scenes/GameScene.ts`, replace:

```ts
this.root?.add(renderPlayerPanel(this, this.engine.run, combat.player.energy, combat.player.block));
```

with:

```ts
this.root?.add(
  renderPlayerPanel(this, this.engine.run, {
    hp: combat.player.hp,
    maxHp: combat.player.maxHp,
    energy: combat.player.energy,
    block: combat.player.block
  })
);
```

- [ ] **Step 5: Add combat HP fields and event payloads to snapshot**

In `src/scenes/GameScene.ts`, inside the `combat` snapshot object, replace:

```ts
energy: combat.player.energy,
block: combat.player.block,
```

with:

```ts
energy: combat.player.energy,
block: combat.player.block,
playerHp: combat.player.hp,
playerMaxHp: combat.player.maxHp,
playerBlock: combat.player.block,
```

Replace:

```ts
events: combat.events.slice(-5).map((event) => event.message)
```

with:

```ts
events: combat.events.slice(-8).map((event) => ({
  type: event.type,
  message: event.message,
  payload: event.payload
}))
```

- [ ] **Step 6: Verify E2E and unit tests**

Run:

```bash
npm run test:e2e
npm test
```

Expected: E2E passes, Vitest passes.

- [ ] **Step 7: Commit**

```bash
git add src/phaser/ui/HudView.ts src/scenes/GameScene.ts tests/e2e/fullRunSmoke.mjs
git commit -m "fix: show combat player HP"
```

## Task 3: Phaser Combat FX Helpers

**Files:**
- Create: `src/phaser/fx/combatFx.ts`

- [ ] **Step 1: Create combat FX helper module**

Create `src/phaser/fx/combatFx.ts`:

```ts
import Phaser from "phaser";

export type FxTarget = Phaser.GameObjects.GameObject & Partial<Phaser.GameObjects.Components.Transform> & Partial<Phaser.GameObjects.Components.Tint>;

export interface FloatTextOptions {
  color?: string;
  fontSize?: number;
  dy?: number;
  duration?: number;
}

export function flashTarget(scene: Phaser.Scene, target: FxTarget | undefined, color = 0xffffff, duration = 120) {
  if (!target || !("setTintFill" in target) || !("clearTint" in target)) return;
  target.setTintFill(color);
  scene.time.delayedCall(duration, () => {
    if (target.active) target.clearTint();
  });
}

export function shakeTarget(scene: Phaser.Scene, target: FxTarget | undefined, intensity = 8, duration = 160) {
  if (!target || typeof target.x !== "number" || typeof target.y !== "number") return;
  const startX = target.x;
  scene.tweens.add({
    targets: target,
    x: { from: startX - intensity, to: startX + intensity },
    duration: Math.max(40, Math.floor(duration / 4)),
    yoyo: true,
    repeat: 2,
    onComplete: () => {
      if (target.active) target.x = startX;
    }
  });
}

export function floatText(scene: Phaser.Scene, x: number, y: number, text: string, options: FloatTextOptions = {}) {
  const label = scene.add
    .text(x, y, text, {
      color: options.color ?? "#fff8d8",
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: `${options.fontSize ?? 22}px`,
      fontStyle: "800",
      stroke: "#101318",
      strokeThickness: 4
    })
    .setOrigin(0.5);
  scene.tweens.add({
    targets: label,
    y: y - (options.dy ?? 42),
    alpha: 0,
    duration: options.duration ?? 620,
    ease: "Cubic.easeOut",
    onComplete: () => label.destroy()
  });
  return label;
}

export function cameraHit(scene: Phaser.Scene, strength = 0.006, duration = 120) {
  scene.cameras.main.shake(duration, strength);
}

export function fadeOutOnDeath(scene: Phaser.Scene, target: FxTarget | undefined) {
  if (!target) return;
  scene.tweens.add({
    targets: target,
    alpha: 0.22,
    scaleX: 0.92,
    scaleY: 0.92,
    duration: 220,
    ease: "Back.easeIn"
  });
}
```

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/phaser/fx/combatFx.ts
git commit -m "feat: add combat FX helpers"
```

## Task 4: Combat Event FX Playback In GameScene

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Modify: `src/phaser/ui/HudView.ts`

- [ ] **Step 1: Add imports and anchor types**

In `src/scenes/GameScene.ts`, add imports:

```ts
import type { CombatEvent } from "../core";
import { cameraHit, fadeOutOnDeath, flashTarget, floatText, shakeTarget, type FxTarget } from "../phaser/fx/combatFx";
import { consumeNewCombatEvents, type CombatEventCursor } from "../phaser/fx/combatEventDiff";
```

Add these types near `type Selection`:

```ts
interface RenderAnchor {
  x: number;
  y: number;
  target: FxTarget;
}

interface CombatRenderAnchors {
  player?: RenderAnchor;
  enemies: Map<string, RenderAnchor>;
}
```

- [ ] **Step 2: Add event cursor field**

In `GameScene` fields, add:

```ts
private combatEventCursor: CombatEventCursor = { eventCount: 0 };
```

- [ ] **Step 3: Capture player panel anchor**

In `drawCombat`, replace the player panel render block with:

```ts
const anchors: CombatRenderAnchors = { enemies: new Map() };
const playerPanel = renderPlayerPanel(this, this.engine.run, {
  hp: combat.player.hp,
  maxHp: combat.player.maxHp,
  energy: combat.player.energy,
  block: combat.player.block
});
this.root?.add(playerPanel);
anchors.player = {
  x: layout.leftPanel.x + layout.leftPanel.w / 2,
  y: layout.leftPanel.y + 106,
  target: playerPanel as FxTarget
};
```

- [ ] **Step 4: Capture enemy anchors**

In the `combat.enemies.forEach` block, replace the direct `this.root?.add(renderEnemyView(...))` call with:

```ts
const enemyView = renderEnemyView({
  scene: this,
  context: this.uiContext(),
  data: this.dataModel,
  assets: this.assets,
  enemy,
  x,
  y,
  selectedTargetEnabled: Boolean(this.selected),
  onTarget: () => this.playSelectedOnEnemy(enemy.instanceId)
});
this.root?.add(enemyView);
anchors.enemies.set(enemy.instanceId, {
  x,
  y,
  target: enemyView as FxTarget
});
```

- [ ] **Step 5: Consume and play new combat events**

At the end of `drawCombat`, after the quick `auto-win` button block, add:

```ts
const diff = consumeNewCombatEvents(this.combatEventCursor, combat.id, combat.events);
this.combatEventCursor = diff.cursor;
this.playCombatFx(diff.events, anchors);
```

Add this method to `GameScene` above `selectOrPlayCard`:

```ts
private playCombatFx(events: readonly CombatEvent[], anchors: CombatRenderAnchors) {
  for (const event of events) {
    if (event.type === "DAMAGE_DEALT") {
      const payload = event.payload as { enemy?: string; damage?: number } | undefined;
      const anchor = payload?.enemy ? anchors.enemies.get(payload.enemy) : undefined;
      if (payload?.damage && payload.damage > 0) {
        shakeTarget(this, anchor?.target, 7, 160);
        flashTarget(this, anchor?.target, 0xffffff, 90);
        floatText(this, anchor?.x ?? 620, (anchor?.y ?? 240) - 86, `-${payload.damage}`, { color: "#ff6b6b" });
      }
      const enemy = payload?.enemy ? this.engine.run.currentCombat?.enemies.find((item) => item.instanceId === payload.enemy) : undefined;
      if (enemy?.hp === 0) fadeOutOnDeath(this, anchor?.target);
    }

    if (event.type === "PLAYER_DAMAGED") {
      const payload = event.payload as { damage?: number } | undefined;
      const damage = payload?.damage ?? 0;
      if (damage > 0) {
        shakeTarget(this, anchors.player?.target, 5, 140);
        flashTarget(this, anchors.player?.target, 0xee4266, 100);
        floatText(this, anchors.player?.x ?? 130, anchors.player?.y ?? 190, `-${damage} HP`, { color: "#ff6b6b" });
        cameraHit(this, 0.004, 120);
      } else {
        floatText(this, anchors.player?.x ?? 130, anchors.player?.y ?? 190, "格擋", { color: "#8be9d1", fontSize: 18 });
      }
    }
  }
}
```

- [ ] **Step 6: Reset event cursor on run restart and start**

In the `start` button handler in `drawTitle`, before `this.render();`, add:

```ts
this.combatEventCursor = { eventCount: 0 };
```

In the `restart` button handler in `drawEnd`, before `this.render();`, add:

```ts
this.combatEventCursor = { eventCount: 0 };
```

- [ ] **Step 7: Build and E2E**

Run:

```bash
npm run build
npm run test:e2e
```

Expected: build passes and E2E remains stable.

- [ ] **Step 8: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: play combat damage FX"
```

## Task 5: Reward Entry Screen FX

**Files:**
- Create: `src/phaser/fx/screenFx.ts`
- Modify: `src/phaser/ui/RewardView.ts`

- [ ] **Step 1: Create screen FX helper**

Create `src/phaser/fx/screenFx.ts`:

```ts
import Phaser from "phaser";

export interface StaggerOptions {
  delayStep?: number;
  duration?: number;
  yOffset?: number;
}

export function staggerChildren(scene: Phaser.Scene, targets: Phaser.GameObjects.GameObject[], options: StaggerOptions = {}) {
  const delayStep = options.delayStep ?? 70;
  const duration = options.duration ?? 260;
  const yOffset = options.yOffset ?? 20;
  targets.forEach((target, index) => {
    const item = target as Phaser.GameObjects.GameObject & Partial<Phaser.GameObjects.Components.Transform> & Partial<Phaser.GameObjects.Components.Alpha>;
    if (typeof item.y !== "number" || typeof item.setAlpha !== "function") return;
    const targetY = item.y;
    item.y = targetY + yOffset;
    item.setAlpha(0);
    scene.tweens.add({
      targets: item,
      y: targetY,
      alpha: 1,
      delay: index * delayStep,
      duration,
      ease: "Cubic.easeOut"
    });
  });
}

export function fadeSlideIn(scene: Phaser.Scene, target: Phaser.GameObjects.GameObject, yOffset = 16, duration = 240) {
  staggerChildren(scene, [target], { delayStep: 0, duration, yOffset });
}
```

- [ ] **Step 2: Apply staggered reward card entry**

In `src/phaser/ui/RewardView.ts`, add import:

```ts
import { staggerChildren } from "../fx/screenFx";
```

In `renderRewardView`, add after creating `root`:

```ts
const rewardCardViews: Phaser.GameObjects.GameObject[] = [];
```

Replace the reward card render line:

```ts
root.add(renderCardView({ scene, context, data, assets, x, y: 178, w: cardSize.rewardW, h: cardSize.rewardH, card, mode: "reward" }));
```

with:

```ts
const cardView = renderCardView({ scene, context, data, assets, x, y: 178, w: cardSize.rewardW, h: cardSize.rewardH, card, mode: "reward" });
root.add(cardView);
rewardCardViews.push(cardView);
```

Before `return root;`, add:

```ts
staggerChildren(scene, rewardCardViews, { delayStep: 80, duration: 260, yOffset: 24 });
```

- [ ] **Step 3: Build and E2E**

Run:

```bash
npm run build
npm run test:e2e
```

Expected: build and E2E pass. Reward buttons remain immediately present in `buttons`.

- [ ] **Step 4: Commit**

```bash
git add src/phaser/fx/screenFx.ts src/phaser/ui/RewardView.ts
git commit -m "feat: animate reward card entry"
```

## Task 6: Visual Review, Final Verification, And Backlog Completion

**Files:**
- Move: `backlogs/in-progress/01-phaser-game-feel-backlog.md` to `backlogs/done/01-phaser-game-feel-backlog.md`

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

- [ ] **Step 2: Start a dev server from this worktree**

Run:

```bash
npm run dev -- --port 5175
```

Expected: Vite reports `Local: http://127.0.0.1:5175/`.

- [ ] **Step 3: Capture manual review screenshots**

Use Playwright or in-app browser on `http://127.0.0.1:5175/?e2e=1`.

Required screenshots:

- `output/manual-review-game-feel/combat-before.png`
- `output/manual-review-game-feel/combat-after-attack.png`
- `output/manual-review-game-feel/combat-after-enemy-turn.png`
- `output/manual-review-game-feel/reward-entry.png`

Use this Playwright evaluation pattern to click by existing button descriptors:

```js
const current = JSON.parse(await page.evaluate(() => window.render_game_to_text()));
const button = current.buttons.find((item) => item.id === "end-turn");
await page.mouse.click(button.x, button.y);
```

Pass criteria:

- Combat player HP in the left panel changes after enemy damage.
- Enemy hit feedback is visible during attack screenshots or observable in the browser.
- Player damage feedback is visible during enemy-turn screenshots or observable in the browser.
- Reward cards visually enter with a short stagger.
- No major text overlap introduced.

- [ ] **Step 4: Fix visual issues if found**

Allowed files for visual fixes:

- `src/phaser/fx/combatFx.ts`
- `src/phaser/fx/screenFx.ts`
- `src/phaser/ui/HudView.ts`
- `src/phaser/ui/RewardView.ts`
- `src/scenes/GameScene.ts`
- `tests/e2e/fullRunSmoke.mjs`

After each fix, run:

```bash
npm run build
npm run test:e2e
```

Expected: build and E2E pass.

- [ ] **Step 5: Move backlog to done**

Run:

```bash
git mv backlogs/in-progress/01-phaser-game-feel-backlog.md backlogs/done/01-phaser-game-feel-backlog.md
```

- [ ] **Step 6: Commit completion**

Run:

```bash
git add backlogs/done/01-phaser-game-feel-backlog.md
git commit -m "docs: complete phaser game feel backlog"
```

## Self-Review Checklist

- Spec coverage:
  - Combat HP display fix: Task 2.
  - Combat event diff and no replay: Task 1 and Task 4.
  - Enemy hit feedback: Task 3 and Task 4.
  - Player damage feedback: Task 3 and Task 4.
  - Reward entry animation: Task 5.
  - E2E stability: Tasks 2, 4, 5, and 6.
- Type consistency:
  - `CombatEventCursor` is defined in Task 1 and imported by `GameScene` in Task 4.
  - `PlayerPanelVitals` is defined in `HudView.ts` and used by `GameScene.drawCombat`.
  - `FxTarget` is exported from `combatFx.ts` and used only for Phaser display anchors.
- Scope:
  - No core combat rule files are modified.
  - No drag/drop, audio pass, or full transition state machine is included.
