# Drag Drop Card Play Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Phaser drag/drop card play, auto-targeting, auto end-turn transition messaging, and distinct combat audio cues while preserving click fallback.

**Architecture:** Keep rule decisions in small pure helpers under `src/phaser/input/`; keep core combat rules unchanged. `GameScene` owns Phaser pointer state, drop-zone geometry, transition timing, cue playback, and `render_game_to_text()` additions. E2E drives both click fallback and real mouse drag paths.

**Tech Stack:** Phaser 3, TypeScript, Vitest, Playwright E2E, develop-web-game Playwright client.

---

### Task 1: Pure Card Play Rule Helpers

**Files:**
- Create: `src/phaser/input/cardPlayRules.ts`
- Create: `tests/phaser/cardPlayRules.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/phaser/cardPlayRules.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { CardInstance, CombatState, EnemyInstance } from "../../src/core";
import { createRun, loadGameData, selectMapNode, startRun } from "../../src/core";
import { canAnyHandCardPlay, findAutoEnemyTarget, resolveDraggedCardPlay } from "../../src/phaser/input/cardPlayRules";

const data = loadGameData();

function combatFixture(): CombatState {
  const engine = createRun(data, { seed: 20260505, quick: true });
  startRun(engine);
  selectMapNode(engine, engine.run.reachableNodeIds[0]);
  if (!engine.run.currentCombat) throw new Error("fixture did not enter combat");
  return engine.run.currentCombat;
}

function enemy(id: string, hp: number): EnemyInstance {
  return {
    instanceId: id,
    enemyId: "sticker_punk",
    hp,
    maxHp: 12,
    block: 0,
    statuses: {},
    intent: { id: "attack", type: "attack", amount: 4, weight: 1 }
  };
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

describe("card play drag rules", () => {
  it("auto-targets the only living enemy", () => {
    expect(findAutoEnemyTarget([enemy("enemy-a", 8)])).toBe("enemy-a");
  });

  it("auto-targets the lowest HP living enemy and breaks ties by order", () => {
    expect(findAutoEnemyTarget([enemy("enemy-a", 9), enemy("enemy-b", 3), enemy("enemy-c", 3)])).toBe("enemy-b");
  });

  it("ignores defeated enemies when auto-targeting", () => {
    expect(findAutoEnemyTarget([enemy("dead", 0), enemy("alive", 7)])).toBe("alive");
  });

  it("resolves a single-target attack dropped on battlefield to auto target", () => {
    const combat = combatFixture();
    combat.enemies = [enemy("enemy-a", 8), enemy("enemy-b", 2)];
    combat.hand = ["strike-1"];
    combat.cards = [card("strike-1", "strike")];

    expect(resolveDraggedCardPlay(data, combat, "strike-1", { zone: "battlefield" })).toEqual({
      ok: true,
      targetEnemyId: "enemy-b"
    });
  });

  it("cancels a card dropped back to hand without consuming resources", () => {
    const combat = combatFixture();
    combat.hand = ["strike-1"];
    combat.cards = [card("strike-1", "strike")];

    expect(resolveDraggedCardPlay(data, combat, "strike-1", { zone: "hand" })).toEqual({
      ok: false,
      reason: "拖回手牌，取消出牌。"
    });
  });

  it("blocks cards that cost more than current energy", () => {
    const combat = combatFixture();
    combat.player.energy = 0;
    combat.hand = ["strike-1"];
    combat.cards = [card("strike-1", "strike")];

    expect(resolveDraggedCardPlay(data, combat, "strike-1", { zone: "battlefield" })).toEqual({
      ok: false,
      reason: "能量不足。"
    });
  });

  it("requires another hand card for handCard targets", () => {
    const combat = combatFixture();
    combat.hand = ["recall-1"];
    combat.cards = [card("recall-1", "recall")];

    expect(resolveDraggedCardPlay(data, combat, "recall-1", { zone: "battlefield" })).toEqual({
      ok: false,
      reason: "沒有可指定的手牌。"
    });
  });

  it("detects whether any hand card can currently be played", () => {
    const combat = combatFixture();
    combat.player.energy = 0;
    combat.hand = ["strike-1"];
    combat.cards = [card("strike-1", "strike")];
    expect(canAnyHandCardPlay(data, combat)).toBe(false);

    combat.hand = ["recall-1", "guard-1"];
    combat.cards = [card("recall-1", "recall"), card("guard-1", "guard")];
    expect(canAnyHandCardPlay(data, combat)).toBe(true);
  });
});
```

- [ ] **Step 2: Verify tests fail**

Run: `npm test -- tests/phaser/cardPlayRules.test.ts`

Expected: fail because `src/phaser/input/cardPlayRules.ts` does not exist.

- [ ] **Step 3: Implement helper module**

Create `src/phaser/input/cardPlayRules.ts`:

```ts
import { effectiveCardCost, type CardDefinition, type CardInstance, type CombatState, type EnemyInstance, type GameData } from "../../core";

export type DropZoneKind = "enemy" | "battlefield" | "player" | "hand" | "invalid";

export interface CardDropResult {
  zone: DropZoneKind;
  enemyId?: string;
}

export interface ResolvedCardPlay {
  ok: boolean;
  targetEnemyId?: string;
  targetCardId?: string;
  reason?: string;
}

export function findAutoEnemyTarget(enemies: readonly EnemyInstance[]): string | undefined {
  return enemies
    .filter((enemy) => enemy.hp > 0)
    .reduce<EnemyInstance | undefined>((best, enemy) => {
      if (!best) return enemy;
      if (enemy.hp < best.hp) return enemy;
      return best;
    }, undefined)?.instanceId;
}

export function canAnyHandCardPlay(data: GameData, combat: CombatState): boolean {
  return combat.hand.some((cardInstanceId) => playabilityReason(data, combat, cardInstanceId) === undefined);
}

export function playabilityReason(data: GameData, combat: CombatState, cardInstanceId: string): string | undefined {
  const cardInstance = combat.cards.find((card) => card.instanceId === cardInstanceId);
  const definition = cardInstance ? cardDefinition(data, cardInstance) : undefined;
  if (!cardInstance || !definition) return "找不到卡牌。";
  if (!combat.hand.includes(cardInstanceId)) return "卡牌不在手牌中。";
  if (effectiveCardCost(data, cardInstance) > combat.player.energy) return "能量不足。";
  if ((definition.target === "singleEnemy" || definition.target === "allEnemies") && !findAutoEnemyTarget(combat.enemies)) return "沒有可攻擊目標。";
  if (definition.target === "handCard" && !targetHandCard(combat, cardInstanceId)) return "沒有可指定的手牌。";
  return undefined;
}

export function resolveDraggedCardPlay(data: GameData, combat: CombatState, cardInstanceId: string, drop: CardDropResult): ResolvedCardPlay {
  if (drop.zone === "hand") return { ok: false, reason: "拖回手牌，取消出牌。" };
  if (drop.zone === "invalid") return { ok: false, reason: "沒有放到可出牌區域。" };

  const cardInstance = combat.cards.find((card) => card.instanceId === cardInstanceId);
  const definition = cardInstance ? cardDefinition(data, cardInstance) : undefined;
  if (!cardInstance || !definition) return { ok: false, reason: "找不到卡牌。" };

  const reason = playabilityReason(data, combat, cardInstanceId);
  if (reason) return { ok: false, reason };

  if (definition.target === "singleEnemy") {
    if (drop.zone !== "enemy" && drop.zone !== "battlefield") return { ok: false, reason: "攻擊牌需要放到敵人或戰場。" };
    return { ok: true, targetEnemyId: livingEnemyId(combat, drop.enemyId) ?? findAutoEnemyTarget(combat.enemies) };
  }

  if (definition.target === "allEnemies") {
    if (drop.zone !== "enemy" && drop.zone !== "battlefield") return { ok: false, reason: "群體攻擊需要放到戰場。" };
    return { ok: true };
  }

  if (definition.target === "self" || definition.target === "none") {
    if (drop.zone !== "player" && drop.zone !== "battlefield") return { ok: false, reason: "這張牌需要放到玩家區或戰場。" };
    return { ok: true };
  }

  if (definition.target === "handCard") {
    if (drop.zone !== "player" && drop.zone !== "battlefield") return { ok: false, reason: "這張牌需要放到玩家區或戰場。" };
    return { ok: true, targetCardId: targetHandCard(combat, cardInstanceId) };
  }

  return { ok: false, reason: "不支援的卡牌目標。" };
}

function cardDefinition(data: GameData, card: CardInstance): CardDefinition | undefined {
  return data.cards.find((definition) => definition.id === card.cardId);
}

function livingEnemyId(combat: CombatState, enemyId?: string): string | undefined {
  return combat.enemies.find((enemy) => enemy.instanceId === enemyId && enemy.hp > 0)?.instanceId;
}

function targetHandCard(combat: CombatState, cardInstanceId: string): string | undefined {
  return combat.hand.find((id) => id !== cardInstanceId);
}
```

- [ ] **Step 4: Verify helper tests pass**

Run: `npm test -- tests/phaser/cardPlayRules.test.ts`

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/phaser/input/cardPlayRules.ts tests/phaser/cardPlayRules.test.ts
git commit -m "test: add card drag play rule helpers"
```

### Task 2: Audio Cue Asset Keys

**Files:**
- Modify: `src/data/assets.json`
- Modify: `tests/core/assetRegistry.test.ts`

- [ ] **Step 1: Add failing asset registry expectations**

In `tests/core/assetRegistry.test.ts`, extend `resolves audio entries through the registry`:

```ts
expect(registry.getAudio("cardDragStart")).toEqual({
  key: "audio:cardDragStart",
  path: "/assets/audio/sfx/card-played.ogg"
});
expect(registry.getAudio("cardDropCancel")).toEqual({
  key: "audio:cardDropCancel",
  path: "/assets/audio/sfx/failure.ogg"
});
expect(registry.getAudio("autoEndTurn")).toEqual({
  key: "audio:autoEndTurn",
  path: "/assets/audio/sfx/mutation.ogg"
});
```

- [ ] **Step 2: Verify tests fail**

Run: `npm test -- tests/core/assetRegistry.test.ts`

Expected: fail with unknown audio asset keys.

- [ ] **Step 3: Add cue mappings**

In `src/data/assets.json`, add these keys inside `audio`:

```json
"cardDragStart": "audio/sfx/card-played.ogg",
"cardDropPlay": "audio/sfx/card-played.ogg",
"cardDropCancel": "audio/sfx/failure.ogg",
"attackHit": "audio/sfx/damage.ogg",
"blockGain": "audio/sfx/memory-gained.ogg",
"enemyAttack": "audio/sfx/damage.ogg",
"autoEndTurn": "audio/sfx/mutation.ogg"
```

- [ ] **Step 4: Verify tests pass**

Run: `npm test -- tests/core/assetRegistry.test.ts`

Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add src/data/assets.json tests/core/assetRegistry.test.ts
git commit -m "feat: add combat interaction audio cues"
```

### Task 3: Phaser Drag State And Turn Transition

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Add imports and state types**

Add import:

```ts
import { canAnyHandCardPlay, playabilityReason, resolveDraggedCardPlay, type CardDropResult, type DropZoneKind } from "../phaser/input/cardPlayRules";
```

Add types near `MusicKey`:

```ts
interface DragCardState {
  active: boolean;
  cardInstanceId?: string;
  originX?: number;
  originY?: number;
  currentX?: number;
  currentY?: number;
  validDropZone?: DropZoneKind;
  hoverEnemyId?: string;
  reasonIfBlocked?: string;
}

interface DropRect {
  id?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TurnTransitionState {
  kind: "manual" | "autoNoPlayableCards";
  message: string;
  dueAt: number;
  timer?: Phaser.Time.TimerEvent;
}
```

Add fields:

```ts
private dragCard: DragCardState = { active: false };
private cardPointerDown?: { cardInstanceId: string; x: number; y: number };
private enemyDropZones = new Map<string, DropRect>();
private battlefieldDropZone?: DropRect;
private playerDropZone?: DropRect;
private handDropZone?: DropRect;
private dragFeedback?: Phaser.GameObjects.Graphics;
private turnTransition?: TurnTransitionState;
private virtualNow = 0;
```

- [ ] **Step 2: Add deterministic time hook**

Replace `window.advanceTime` body with:

```ts
window.advanceTime = (ms: number) => {
  this.virtualNow += ms;
  this.resolvePendingTurnTransition();
  this.render();
};
```

- [ ] **Step 3: Track drop zones in `drawCombat`**

At the beginning of `drawCombat`, reset zones:

```ts
this.enemyDropZones = new Map();
this.battlefieldDropZone = { x: layout.battlefield.x, y: layout.battlefield.y, w: layout.battlefield.w, h: layout.battlefield.h };
this.playerDropZone = { x: layout.leftPanel.x, y: layout.leftPanel.y, w: layout.leftPanel.w, h: layout.leftPanel.h };
this.handDropZone = { x: layout.hand.x, y: layout.hand.y, w: layout.hand.w, h: layout.hand.h };
```

Inside enemy loop after `anchors.enemies.set(...)`, add:

```ts
this.enemyDropZones.set(enemy.instanceId, { id: enemy.instanceId, x: x - 96, y: y - 138, w: 192, h: 300 });
```

In log panel, append turn transition message if present:

```ts
const logLines = combat.events.map((event) => event.message).slice(-8);
if (this.turnTransition) logLines.push(this.turnTransition.message);
logPanel.add(label(this, 14, 48, logLines.join("\n"), 13, "#d1d5db", layout.rightPanel.w - 28));
```

- [ ] **Step 4: Replace transparent card buttons with drag-aware card input**

In the hand loop, remove `this.button("card:...")` and call:

```ts
this.registerCardInput(cardView, card.instanceId, x, y, effectiveCardCost(this.dataModel, card) <= combat.player.energy && !this.turnTransition);
```

Add method:

```ts
private registerCardInput(cardView: Phaser.GameObjects.Container, cardInstanceId: string, x: number, y: number, enabled: boolean) {
  this.buttons.push({ id: `card:${cardInstanceId}`, label: "", x: x + CARD_WIDTH / 2, y: y + CARD_HEIGHT / 2, w: CARD_WIDTH, h: CARD_HEIGHT, enabled });
  if (!enabled) return;
  cardView.setSize(CARD_WIDTH, CARD_HEIGHT);
  cardView.setInteractive(new Phaser.Geom.Rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT), Phaser.Geom.Rectangle.Contains);
  this.input.setDraggable(cardView);
  cardView.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
    this.cardPointerDown = { cardInstanceId, x: pointer.x, y: pointer.y };
  });
  cardView.on("pointerup", (pointer: Phaser.Input.Pointer) => {
    const down = this.cardPointerDown;
    this.cardPointerDown = undefined;
    if (!down || down.cardInstanceId !== cardInstanceId || this.dragCard.active) return;
    if (Phaser.Math.Distance.Between(down.x, down.y, pointer.x, pointer.y) <= 8) this.selectOrPlayCard(cardInstanceId);
  });
  cardView.on("dragstart", () => this.beginCardDrag(cardInstanceId, x, y));
  cardView.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => this.updateCardDrag(cardView, cardInstanceId, dragX, dragY));
  cardView.on("dragend", (pointer: Phaser.Input.Pointer) => this.finishCardDrag(cardView, cardInstanceId, pointer.x, pointer.y));
}
```

- [ ] **Step 5: Add drag/drop methods**

Add methods:

```ts
private beginCardDrag(cardInstanceId: string, originX: number, originY: number) {
  const combat = this.engine.run.currentCombat;
  this.dragCard = {
    active: true,
    cardInstanceId,
    originX,
    originY,
    currentX: originX,
    currentY: originY,
    reasonIfBlocked: combat ? playabilityReason(this.dataModel, combat, cardInstanceId) : "沒有戰鬥。"
  };
  this.playSfx("audio:cardDragStart", 0.42);
}

private updateCardDrag(cardView: Phaser.GameObjects.Container, cardInstanceId: string, dragX: number, dragY: number) {
  if (this.dragCard.cardInstanceId !== cardInstanceId) return;
  cardView.setPosition(dragX, dragY);
  const drop = this.dropResultAt(dragX + CARD_WIDTH / 2, dragY + CARD_HEIGHT / 2);
  this.dragCard = {
    ...this.dragCard,
    currentX: dragX,
    currentY: dragY,
    validDropZone: drop.zone,
    hoverEnemyId: drop.enemyId
  };
  this.updateDragFeedback(drop);
}

private finishCardDrag(cardView: Phaser.GameObjects.Container, cardInstanceId: string, pointerX: number, pointerY: number) {
  if (this.dragCard.cardInstanceId !== cardInstanceId) return;
  const combat = this.engine.run.currentCombat;
  const drop = this.dropResultAt(pointerX, pointerY);
  this.clearDragFeedback();
  this.cardPointerDown = undefined;
  this.dragCard = { active: false };
  if (!combat) {
    this.render();
    return;
  }
  const resolved = resolveDraggedCardPlay(this.dataModel, combat, cardInstanceId, drop);
  if (!resolved.ok) {
    this.playSfx("audio:cardDropCancel", 0.48);
    this.dragCard = { active: false, reasonIfBlocked: resolved.reason };
    cardView.setPosition(this.buttons.find((button) => button.id === `card:${cardInstanceId}`)?.x ?? cardView.x, cardView.y);
    this.render();
    return;
  }
  playRunCard(this.engine, cardInstanceId, resolved.targetEnemyId, resolved.targetCardId);
  this.selected = undefined;
  this.playSfx("audio:cardDropPlay", 0.46);
  this.maybeBeginAutoEndTurn();
  this.render();
}

private dropResultAt(x: number, y: number): CardDropResult {
  for (const zone of this.enemyDropZones.values()) {
    if (pointInRect(x, y, zone)) return { zone: "enemy", enemyId: zone.id };
  }
  if (this.handDropZone && pointInRect(x, y, this.handDropZone)) return { zone: "hand" };
  if (this.playerDropZone && pointInRect(x, y, this.playerDropZone)) return { zone: "player" };
  if (this.battlefieldDropZone && pointInRect(x, y, this.battlefieldDropZone)) return { zone: "battlefield" };
  return { zone: "invalid" };
}
```

Add helper outside class:

```ts
function pointInRect(x: number, y: number, rect: DropRect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
```

- [ ] **Step 6: Add visual drag feedback and audio helper**

Add methods:

```ts
private updateDragFeedback(drop: CardDropResult) {
  if (!this.dragFeedback) {
    this.dragFeedback = this.add.graphics();
    this.root?.add(this.dragFeedback);
  }
  this.dragFeedback.clear();
  const color = drop.zone === "invalid" || drop.zone === "hand" ? 0xee4266 : 0x39d98a;
  const rect = drop.enemyId ? this.enemyDropZones.get(drop.enemyId) : drop.zone === "player" ? this.playerDropZone : drop.zone === "battlefield" ? this.battlefieldDropZone : undefined;
  if (!rect) return;
  this.dragFeedback.lineStyle(4, color, 0.78).strokeRect(rect.x, rect.y, rect.w, rect.h);
}

private clearDragFeedback() {
  this.dragFeedback?.destroy();
  this.dragFeedback = undefined;
}

private playSfx(key: string, volume = 0.5) {
  if (this.muted || !this.audioStarted) return;
  if (this.cache.audio.exists(key)) this.sound.play(key, { volume });
}
```

- [ ] **Step 7: Add turn transition methods and wire end turn**

Replace end-turn handler with:

```ts
this.button("end-turn", "結束回合", layout.endTurn.x, layout.endTurn.y, layout.endTurn.w, layout.endTurn.h, () => {
  this.beginTurnTransition("manual");
}, !this.turnTransition);
```

Add methods:

```ts
private maybeBeginAutoEndTurn() {
  const combat = this.engine.run.currentCombat;
  if (!combat || this.engine.run.mode !== "combat" || combat.phase !== "player") return;
  if (canAnyHandCardPlay(this.dataModel, combat)) return;
  this.beginTurnTransition("autoNoPlayableCards");
}

private beginTurnTransition(kind: TurnTransitionState["kind"]) {
  if (this.turnTransition || this.engine.run.mode !== "combat") return;
  const delayMs = kind === "manual" ? 240 : 650;
  const message = kind === "manual" ? "回合結束。" : "沒有可出的牌，自動結束回合。";
  this.playSfx(kind === "manual" ? "audio:cardDropPlay" : "audio:autoEndTurn", 0.5);
  const transition: TurnTransitionState = { kind, message, dueAt: this.virtualNow + delayMs };
  transition.timer = this.time.delayedCall(delayMs, () => this.resolvePendingTurnTransition());
  this.turnTransition = transition;
  this.selected = undefined;
  this.render();
}

private resolvePendingTurnTransition() {
  if (!this.turnTransition) return;
  if (this.virtualNow < this.turnTransition.dueAt && this.turnTransition.timer?.hasDispatched === false) return;
  this.turnTransition.timer?.remove(false);
  this.turnTransition = undefined;
  endRunTurn(this.engine);
  this.selected = undefined;
}
```

- [ ] **Step 8: Add combat event SFX and snapshot fields**

In `playCombatFx`, play:

```ts
if (event.type === "DAMAGE_DEALT") this.playSfx("audio:attackHit", 0.48);
if (event.type === "PLAYER_DAMAGED") this.playSfx("audio:enemyAttack", 0.48);
```

In `snapshot()`, add:

```ts
drag: this.dragCard,
turnTransition: this.turnTransition
  ? { kind: this.turnTransition.kind, message: this.turnTransition.message }
  : undefined,
```

Update `TextSnapshot` with `drag: DragCardState; turnTransition?: { kind: TurnTransitionState["kind"]; message: string };`.

- [ ] **Step 9: Verify build**

Run: `npm run build`

Expected: pass.

- [ ] **Step 10: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: add drag card interaction state"
```

### Task 4: E2E Drag Scenarios

**Files:**
- Modify: `tests/e2e/fullRunSmoke.mjs`

- [ ] **Step 1: Add drag helper functions**

Add below `playOneCardIfPossible`:

```js
async function dragButtonTo(page, buttonId, x, y) {
  const current = await state(page);
  const button = current.buttons.find((item) => item.id === buttonId);
  assert.ok(button, `Button not found: ${buttonId}`);
  assert.ok(button.enabled, `Button disabled: ${buttonId}`);
  await page.mouse.move(button.x, button.y);
  await page.mouse.down();
  await page.waitForTimeout(80);
  await page.mouse.move(x, y, { steps: 8 });
  await page.waitForTimeout(80);
  await page.mouse.up();
  await page.waitForTimeout(120);
  return state(page);
}

async function assertDragAttackAutoTargets(page) {
  let current = await state(page);
  const attack = current.combat.hand.find((card) => card.type === "attack" && card.cost <= current.combat.energy);
  if (!attack) return;
  const enemyBefore = current.combat.enemies.find((enemy) => enemy.hp > 0);
  assert.ok(enemyBefore, "Expected a living enemy before drag attack.");
  current = await dragButtonTo(page, `card:${attack.id}`, 620, 260);
  const enemyAfter = current.combat?.enemies.find((enemy) => enemy.id === enemyBefore.id);
  assert.ok(enemyAfter && enemyAfter.hp < enemyBefore.hp, "Dragging attack to battlefield should damage auto target.");
}

async function assertInvalidDragCancels(page) {
  let current = await state(page);
  const playable = current.combat.hand.find((card) => card.cost <= current.combat.energy);
  if (!playable) return;
  const beforeEnergy = current.combat.energy;
  const beforeHand = current.combat.hand.length;
  current = await dragButtonTo(page, `card:${playable.id}`, 1220, 120);
  assert.equal(current.combat.energy, beforeEnergy);
  assert.equal(current.combat.hand.length, beforeHand);
}
```

- [ ] **Step 2: Call drag assertions in the smoke flow**

After first combat screenshot and before `assertCombatHpTracksEnemyTurn(page)`, add:

```js
await assertInvalidDragCancels(page);
await assertDragAttackAutoTargets(page);
current = await state(page);
assert.equal(current.mode, "combat");
```

- [ ] **Step 3: Add auto-end-turn assertion**

Add helper:

```js
async function assertAutoEndTurnMessage(page) {
  let current = await state(page);
  for (let attempt = 0; attempt < 6 && current.mode === "combat" && !current.turnTransition; attempt += 1) {
    const playable = current.combat.hand.find((card) => card.cost <= current.combat.energy);
    if (!playable) break;
    const dropX = playable.type === "attack" ? 620 : 132;
    const dropY = playable.type === "attack" ? 260 : 210;
    current = await dragButtonTo(page, `card:${playable.id}`, dropX, dropY);
  }
  if (current.mode !== "combat") return;
  if (current.turnTransition?.kind === "autoNoPlayableCards") {
    assert.match(current.turnTransition.message, /自動結束回合/);
    await page.waitForTimeout(850);
    current = await state(page);
    assert.equal(current.turnTransition, undefined);
  }
}
```

Call it after `playOneCardIfPossible(page)`.

- [ ] **Step 4: Verify E2E fails before implementation or passes after Task 3**

Run: `npm run test:e2e`

Expected after Task 3: pass.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/fullRunSmoke.mjs
git commit -m "test: cover drag card play e2e"
```

### Task 5: Develop-Web-Game Verification And Backlog State

**Files:**
- Move: `backlogs/02-drag-drop-card-play-backlog.md` to `backlogs/done/02-drag-drop-card-play-backlog.md`
- Modify: `progress.md`

- [ ] **Step 1: Run full verification**

Run:

```bash
npm test
npm run build
npm run test:e2e
```

Expected: all pass.

- [ ] **Step 2: Start local dev server**

Run:

```bash
npm run dev -- --host 127.0.0.1 --port 5173
```

Expected: Vite serves `http://127.0.0.1:5173/`.

- [ ] **Step 3: Run develop-web-game client**

Run:

```bash
node /Users/rexchen/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js \
  --url 'http://127.0.0.1:5173/?e2e=1' \
  --actions-json '{"steps":[{"buttons":["left_mouse_button"],"frames":2,"mouse_x":814,"mouse_y":534},{"buttons":[],"frames":8},{"buttons":["left_mouse_button"],"frames":2,"mouse_x":108,"mouse_y":340},{"buttons":[],"frames":16},{"buttons":["left_mouse_button"],"frames":2,"mouse_x":746,"mouse_y":617},{"buttons":[],"frames":4},{"buttons":["left_mouse_button"],"frames":2,"mouse_x":620,"mouse_y":260},{"buttons":[],"frames":20}]}' \
  --iterations 1 \
  --pause-ms 250 \
  --screenshot-dir output/web-game-drag-drop-card-play
```

Expected:

- `output/web-game-drag-drop-card-play/state-0.json` shows `mode: "combat"`.
- `drag.active` is false after drop.
- screenshot shows combat scene with cards/enemy visible.
- no `errors-*.json` file exists.

- [ ] **Step 4: Inspect screenshot**

Open `output/web-game-drag-drop-card-play/shot-0.png` with `view_image`.

Expected: combat layout is readable; no obvious card overlap regression.

- [ ] **Step 5: Update progress and backlog**

Append to `progress.md`:

```md
## 2026-05-06 Drag Drop Card Play

- Implemented drag/drop card play for combat while preserving click fallback.
- Added auto enemy targeting for attack cards dropped on battlefield.
- Added no-playable-card auto end-turn transition messaging.
- Added distinct combat interaction audio cue keys.
- Verified with npm tests, build, E2E, and develop-web-game screenshot/state inspection.
```

Move backlog:

```bash
git mv backlogs/02-drag-drop-card-play-backlog.md backlogs/done/02-drag-drop-card-play-backlog.md
```

- [ ] **Step 6: Commit**

```bash
git add progress.md backlogs/done/02-drag-drop-card-play-backlog.md
git commit -m "docs: complete drag drop card play backlog"
```

### Task 6: Final Branch Verification

**Files:**
- No source changes unless verification finds a bug.

- [ ] **Step 1: Run final commands**

Run:

```bash
npm test
npm run build
npm run test:e2e
```

Expected: all pass.

- [ ] **Step 2: Check git status**

Run: `git status --short --branch`

Expected: clean feature branch except intentionally ignored/untracked files outside the worktree scope.

- [ ] **Step 3: Stop dev server**

Stop any Vite process started for port 5173.

Expected: `lsof -nP -iTCP:5173 -sTCP:LISTEN` returns no listener unless the user asks to keep it running.
