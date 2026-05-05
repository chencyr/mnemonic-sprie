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
  assert.equal(current.audio?.currentMusic, "audio:combatBgm");
  await screenshot(page, "combat");
  exploratory.requiredScreens.add("combat");

  await assertCombatHpTracksEnemyTurn(page);
  current = await state(page);
  assert.equal(current.mode, "combat");

  await playOneCardIfPossible(page);
  current = await state(page);
  assert.equal(current.mode, "combat");
  assert.ok(current.combat.energy <= 3);

  current = await clickButton(page, "auto-win");
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
  let current = await state(page);
  for (let attempt = 0; attempt < exploratory.maxNoOpChecks; attempt += 1) {
    const attack = current.combat.hand.find((card) => card.type === "attack");
    if (attack) {
      await clickButton(page, `card:${attack.id}`);
      current = await state(page);
      const enemy = current.buttons.find((button) => button.id.startsWith("enemy:") && button.enabled);
      assert.ok(enemy, "Selected attack card should enable enemy targets.");
      await clickButton(page, enemy.id);
      return;
    }
    await clickButton(page, "end-turn");
    current = await state(page);
  }
  throw new Error("Could not draw an attack card during combat smoke.");
}

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
    }
  }
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
