import assert from "node:assert/strict";
import { assertVisibleAssetPrefix, assertVisibleAssetRole, clickButton, firstEnabledButton, screenshot, state, withGamePage } from "./helpers.mjs";

const exploratory = {
  maxFullRunSteps: 80,
  maxNoOpChecks: 8,
  requiredScreens: new Set(["title", "map", "combat", "reward", "rest", "shop", "event", "victory"]),
  requiredActions: new Set(["playedCard", "mutated", "contract", "shopDecision", "boss"])
};

await withGamePage(async ({ page }) => {
  let current = await state(page);
  assert.equal(current.mode, "title");
  assert.ok(current.buttons.some((button) => button.id === "start"));
  assertVisibleAssetRole(current, "title", "title");
  await screenshot(page, "title");

  current = await clickButton(page, "start");
  assert.equal(current.mode, "map");
  assertVisibleAssetPrefix(current, "ui:node", "map");
  await screenshot(page, "map");

  current = await clickButton(page, firstEnabledButton(current, "map:").id);
  assert.equal(current.mode, "combat");
  assertVisibleAssetPrefix(current, "enemy:", "combat");
  assertVisibleAssetPrefix(current, "card:", "combat");
  assertVisibleAssetPrefix(current, "ui:intent", "combat");
  assertVisibleAssetRole(current, "combat-ui:background", "combat");
  assertNoCombatPanelSurfaceAssets(current);
  assert.equal(current.combatUi?.reference, "battle-design-proposal-3");
  assert.equal(current.turnActionUi?.state, "playerReady");
  assert.equal(current.turnActionUi?.labelAsset, "endTurnLabel");
  assert.equal(current.turnActionUi?.endTurnEnabled, true);
  for (const role of [
    "combat-ui:background",
    "combat-ui:turn-energy-frame",
    "combat-ui:energy-lightning-icon-0",
    "combat-ui:end-turn-button-plate",
    "combat-ui:end-turn-label"
  ]) {
    assert.ok(current.combatUi.assetRoles.includes(role), `combat UI snapshot should include ${role}`);
  }
  assertTurnActionStatusContentInsideFrame(current);
  assert.equal(current.audio?.currentMusic, "audio:combatBgm");
  await screenshot(page, "combat");
  exploratory.requiredScreens.add("combat");

  await assertInvalidDragCancels(page);
  await assertDragAttackAutoTargets(page);
  current = await state(page);
  assert.equal(current.mode, "combat");

  await assertCombatHpTracksEnemyTurn(page);
  current = await state(page);
  assert.equal(current.mode, "combat");

  current = await assertVictoryTransitionDelaysReward(page);
  assert.equal(current.mode, "reward");
  assert.equal(current.audio?.currentMusic, "audio:bgm");
  assertVisibleAssetPrefix(current, "card:", "reward");
  await screenshot(page, "reward");

  const visitedScreens = new Set(["title", "map", "combat", "reward"]);
  const visitedActions = new Set(["playedCard"]);
  for (let step = 0; step < exploratory.maxFullRunSteps; step += 1) {
    current = await state(page);
    visitedScreens.add(current.mode);
    assert.ok(current.buttons.length > 0 || current.mode === "victory", `No buttons in mode ${current.mode}`);
    assertNoInvalidNumbers(current);
    if (current.mode === "event") assertVisibleAssetPrefix(current, "event:", "event");
    if (current.mode === "shop") assert.ok(current.visibleAssets?.length > 0, "shop should render visible assets");
    if (current.mode === "rest") assertVisibleAssetRole(current, "rest", "rest");

    if (current.mode === "victory") break;
    if (current.mode === "map") {
      const next = chooseMapButton(current, visitedScreens);
      const selectedNode = new Map(current.map.nodes.map((node) => [`map:${node.id}`, node])).get(next.id);
      if (selectedNode?.type === "boss") visitedActions.add("boss");
      current = await clickButton(page, next.id);
    } else if (current.mode === "combat") {
      current = await clickButton(page, "auto-win");
    } else if (current.mode === "reward") {
      current = await clickButton(page, firstEnabledButton(current, "reward:").id);
    } else if (current.mode === "rest") {
      const mutate = current.buttons.find((button) => button.id === "rest:mutate" && button.enabled);
      if (mutate) {
        visitedActions.add("mutated");
        current = await clickButton(page, mutate.id);
      } else {
        current = await clickButton(page, "rest:heal");
      }
    } else if (current.mode === "shop") {
      const buyable = current.buttons.find((button) => button.id.startsWith("shop:shop-") && button.enabled);
      if (buyable) {
        visitedActions.add("shopDecision");
        await clickButton(page, buyable.id);
      }
      current = await clickButton(page, "shop:leave");
    } else if (current.mode === "event") {
      visitedActions.add("contract");
      current = await clickButton(page, firstEnabledButton(current, "event:").id);
    } else {
      throw new Error(`Unexpected mode: ${current.mode}`);
    }
  }

  current = await state(page);
  assert.equal(current.mode, "victory");
  assertVisibleAssetRole(current, "end", "victory");
  await screenshot(page, "victory");
  for (const screen of exploratory.requiredScreens) {
    assert.ok(visitedScreens.has(screen), `Screen was not reached: ${screen}`);
  }
  for (const action of exploratory.requiredActions) {
    assert.ok(visitedActions.has(action), `Action was not exercised: ${action}`);
  }

  await boundaryProbe(page);
});

async function playOneCardIfPossible(page) {
  let current = await waitForTurnReady(page);
  for (let attempt = 0; attempt < exploratory.maxNoOpChecks; attempt += 1) {
    const nonAttack = current.combat.hand.find((card) => card.type !== "attack" && card.cost <= current.combat.energy);
    if (nonAttack) {
      await clickButton(page, `card:${nonAttack.id}`);
      return;
    }
    const attack = current.combat.hand.find((card) => card.type === "attack");
    if (attack) {
      await clickButton(page, `card:${attack.id}`);
      current = await state(page);
      const enemy = current.buttons.find((button) => button.id.startsWith("enemy:") && button.enabled);
      assert.ok(enemy, "Selected attack card should enable enemy targets.");
      await clickButton(page, enemy.id);
      return;
    }
    current = await endTurnAndWait(page);
  }
  throw new Error("Could not draw an attack card during combat smoke.");
}

async function assertVictoryTransitionDelaysReward(page) {
  await page.evaluate(() => {
    const scene = window.mnemonicSpireScene;
    const combat = scene.engine.run.currentCombat;
    const enemy = combat.enemies[0];
    const strike = combat.cards.find((card) => card.cardId === "strike");
    if (!strike) throw new Error("Missing strike card for victory transition scenario.");
    strike.memory.bloodthirst = 3;
    combat.enemies = [
      {
        ...enemy,
        instanceId: "transition-target",
        state: "alive",
        hp: 4,
        maxHp: 8,
        block: 0,
        statuses: {},
        intent: { id: "attack", type: "attack", amount: 6, weight: 1 }
      }
    ];
    combat.phase = "player";
    combat.player.energy = 3;
    combat.hand = [strike.instanceId];
    combat.drawPile = [];
    combat.discardPile = [];
    scene.turnTransition = undefined;
    scene.victoryTransition = undefined;
    scene.render();
  });

  let current = await state(page);
  const strike = current.combat.hand.find((card) => card.cardId === "strike");
  assert.ok(strike, "Victory transition scenario should expose a strike card.");
  const targetButton = current.buttons.find((button) => button.id === "enemy:transition-target");
  assert.ok(targetButton, "Victory transition scenario should expose target enemy coordinates.");
  current = await dragButtonTo(page, `card:${strike.id}`, targetButton.x, targetButton.y - 120);

  assert.equal(current.mode, "combat");
  assert.equal(current.combat.phase, "victory");
  assert.equal(current.combat.enemies[0].state, "dead");
  assert.equal(current.combat.enemies[0].presentationState, "dying");
  assert.deepEqual(current.combatEnemyArena.pendingDeathTransitions, ["transition-target"]);
  assert.equal(current.combatEnemyArena.victoryBlockedByEnemyTransitions, true);
  assert.ok(current.feedback?.center?.some((item) => item.type === "death"), "Enemy death should surface as center combat feedback.");
  assert.ok(current.feedback?.ticker?.some((item) => item.type === "death"), "Enemy death should surface in combat ticker.");
  assert.ok(current.victoryTransition, "Victory should wait for death presentation.");
  assert.equal(current.turnActionUi?.state, "victoryPresentation");
  assert.equal(current.reward, undefined);
  assert.ok(!current.buttons.find((button) => button.id === "end-turn")?.enabled, "End turn should be disabled during victory presentation.");
  assert.ok(!current.buttons.find((button) => button.id === "auto-win")?.enabled, "Test win shortcut should be disabled during victory presentation.");

  await page.waitForTimeout(25);
  current = await state(page);
  assert.equal(current.mode, "combat");
  assert.equal(current.combat.enemies[0].presentationState, "dying");
  assert.equal(current.combatEnemyArena.victoryBlockedByEnemyTransitions, true);
  assert.ok(current.victoryTransition, "Reward should not appear before the death presentation finishes.");

  await page.waitForTimeout(180);
  current = await state(page);
  assert.equal(current.mode, "reward");
  assert.equal(current.victoryTransition, undefined);
  return current;
}

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
  const enemyBefore = current.combat.enemies.find((enemy) => enemy.state === "alive");
  assert.ok(enemyBefore, "Expected a living enemy before drag attack.");
  current = await clickButton(page, `card:${attack.id}`);
  assert.ok(current.visibleAssets?.some((asset) => asset.role === "combat-ui:enemy-platform"), "combat should render enemy platform assets.");
  assert.ok(current.visibleAssets?.some((asset) => asset.role === "combat-ui:target-ring"), "combat should render target ring assets when targeting.");
  current = await dragButtonTo(page, `card:${attack.id}`, 620, 260);
  const enemyAfter = current.combat?.enemies.find((enemy) => enemy.id === enemyBefore.id);
  assert.ok(enemyAfter && enemyAfter.hp < enemyBefore.hp, "Dragging attack to battlefield should damage auto target.");
  assert.ok(current.feedback?.active?.some((item) => item.type === "damage" && item.anchor === "enemy"), "Dragging attack should create enemy damage feedback.");
  assert.ok(current.feedback?.ticker?.some((item) => item.type === "damage"), "Dragging attack should create ticker damage feedback.");
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
    assert.equal(current.turnActionUi?.state, "autoEndingNoPlayableCards");
    assert.equal(current.turnActionUi?.labelAsset, "enemyTurnLabel");
    assert.equal(current.turnActionUi?.endTurnEnabled, false);
    assert.equal(current.turnActionUi?.endTurnDisabledReason, undefined);
    await page.waitForTimeout(850);
    current = await state(page);
    assert.equal(current.turnTransition, undefined);
  }
}

async function assertCombatHpTracksEnemyTurn(page) {
  let current = await waitForTurnReady(page);
  assert.ok(Number.isFinite(current.combat.playerHp), "combat snapshot should include playerHp");
  assert.ok(Number.isFinite(current.combat.playerMaxHp), "combat snapshot should include playerMaxHp");
  const beforeHp = current.combat.playerHp;

  current = await endTurnAndWait(page);
  assert.equal(current.mode, "combat");
  assert.ok(Number.isFinite(current.combat.playerHp), "combat playerHp should remain finite after enemy turn");
  assert.ok(current.combat.playerHp <= beforeHp, "enemy turn should not increase combat player HP");

  const damageEvent = current.combat.events.find((event) => event.type === "PLAYER_DAMAGED");
  if (damageEvent && damageEvent.payload?.damage > 0) {
    assert.ok(current.combat.playerHp < beforeHp, "combat playerHp should decrease when PLAYER_DAMAGED has positive damage");
    assert.ok(current.feedback?.active?.some((item) => item.type === "damage" && item.anchor === "player"), "Enemy turn should create player damage feedback.");
  }
}

async function endTurnAndWait(page) {
  let current = await clickButton(page, "end-turn");
  if (current.turnTransition) {
    await page.waitForTimeout(350);
    current = await state(page);
  }
  return current;
}

async function waitForTurnReady(page) {
  let current = await state(page);
  if (current.turnTransition) {
    await page.waitForTimeout(850);
    current = await state(page);
  }
  return current;
}

async function boundaryProbe(page) {
  let current = await clickButton(page, "restart");
  assert.equal(current.mode, "title");
  current = await clickButton(page, "mute");
  assert.equal(current.mode, "title");
  current = await clickButton(page, "mute");
  assert.equal(current.mode, "title");
  current = await clickButton(page, "start");
  assert.equal(current.mode, "map");
  assert.ok(current.buttons.filter((button) => button.id.startsWith("map:") && button.enabled).length >= 1);
  current = await clickButton(page, firstEnabledButton(current, "map:").id);
  if (current.mode === "combat") await assertAutoEndTurnMessage(page);
}

function assertNoInvalidNumbers(current) {
  assert.ok(Number.isFinite(current.run.hp), "HP should be finite");
  assert.ok(current.run.hp >= 0, "HP should not be negative");
  assert.ok(current.run.gold >= 0, "gold should not be negative");
  if (current.combat) {
    assert.ok(current.combat.energy >= 0, "energy should not be negative");
    assert.ok(Number.isFinite(current.combat.playerHp), "combat player HP should be finite");
    assert.ok(current.combat.playerHp >= 0, "combat player HP should not be negative");
    assert.ok(current.combat.playerHp <= current.combat.playerMaxHp, "combat player HP should not exceed max HP");
    for (const enemy of current.combat.enemies) {
      assert.ok(enemy.hp >= 0, `enemy HP should not be negative: ${enemy.id}`);
      assert.ok(["alive", "dead"].includes(enemy.state), `enemy state should be lifecycle state: ${enemy.id}`);
    }
  }
}

function assertNoCombatPanelSurfaceAssets(current) {
  const removedRoles = new Set(["combat-ui:player-panel", "combat-ui:top-resource", "combat-ui:ticker-panel", "combat-ui:hand-tray", "combat-ui:turn-device"]);
  const stillRendered = current.visibleAssets?.filter((asset) => removedRoles.has(asset.role)) ?? [];
  assert.deepEqual(stillRendered, [], "combat status/progress/ticker/action/hand regions should use black translucent Phaser regions, not UI image assets.");
}

function assertTurnActionStatusContentInsideFrame(current) {
  const layout = current.turnActionLayout;
  assert.ok(layout?.statusFrame, "combat snapshot should expose turn action status frame bounds");
  assert.ok(layout?.statusContent?.turnText, "combat snapshot should expose turn action turn text bounds");
  assert.ok(layout?.statusContent?.energyText, "combat snapshot should expose turn action energy text bounds");
  assert.ok(Array.isArray(layout?.statusContent?.energyIcons), "combat snapshot should expose turn action energy icon bounds");

  assertBoundsInside(layout.statusContent.turnText, layout.statusFrame, "turn action turn text");
  assertBoundsInside(layout.statusContent.energyText, layout.statusFrame, "turn action energy text");
  for (const [index, icon] of layout.statusContent.energyIcons.entries()) {
    assertBoundsInside(icon, layout.statusFrame, `turn action energy icon ${index}`);
  }
}

function assertBoundsInside(inner, outer, label) {
  assert.ok(inner.x >= outer.x, `${label} left should stay inside status frame`);
  assert.ok(inner.y >= outer.y, `${label} top should stay inside status frame`);
  assert.ok(inner.x + inner.w <= outer.x + outer.w, `${label} right should stay inside status frame`);
  assert.ok(inner.y + inner.h <= outer.y + outer.h, `${label} bottom should stay inside status frame`);
}

function chooseMapButton(current, visitedScreens) {
  const nodesById = new Map(current.map.nodes.map((node) => [`map:${node.id}`, node]));
  const buttons = current.buttons.filter((button) => button.id.startsWith("map:") && button.enabled);
  const missingPriority = [
    ["event", "event"],
    ["rest", "rest"],
    ["shop", "shop"],
    ["combat", "eliteCombat"]
  ];
  for (const [screen, type] of missingPriority) {
    if (!visitedScreens.has(screen)) {
      const button = buttons.find((item) => nodesById.get(item.id)?.type === type);
      if (button) return button;
    }
  }
  return buttons.find((item) => nodesById.get(item.id)?.type === "boss") ?? buttons[0] ?? firstEnabledButton(current, "map:");
}
