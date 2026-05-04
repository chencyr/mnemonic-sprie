# Combat Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement framework-neutral combat rules for Mnemonic Spire.

**Architecture:** Add pure TypeScript combat state and commands under `src/core/combat/`. The engine consumes card/enemy definitions from `loadGameData()`, uses the existing effect registry ids, and emits domain events for Phaser.

**Tech Stack:** TypeScript, Vitest, existing `src/core` data/types/RNG/effect scaffolding.

---

## Files

- Create: `src/core/combat/types.ts`
- Create: `src/core/combat/createCombat.ts`
- Create: `src/core/combat/combatEngine.ts`
- Create: `src/core/combat/cardEffects.ts`
- Modify: `src/core/index.ts`
- Create: `tests/core/combatEngine.test.ts`

## Tasks

### Task 1: Combat State

- [ ] Add combat types for player, enemies, piles, hand, card instances, statuses, events, and selected targets.
- [ ] Test that a new combat starts with 3 energy, 72 HP, 5 cards in hand, draw/discard piles, and 1-3 enemies.
- [ ] Commit: `feat: add combat state creation`.

### Task 2: Card Play

- [ ] Add `playCard(combat, cardInstanceId, targetId?)`.
- [ ] Implement these MVP effects: Strike, Guard, Pierce, Sweep, Recall.
- [ ] Test energy spend, single-target damage, all-enemy damage, block gain, card movement to discard, and invalid target rejection.
- [ ] Commit: `feat: implement core card play`.

### Task 3: Turn Flow

- [ ] Add `endPlayerTurn(combat)` and `startPlayerTurn(combat)`.
- [ ] Enemy actions resolve from visible intent.
- [ ] Block and status durations follow the spec.
- [ ] Test player end turn, enemy damage, draw next hand, victory, and defeat.
- [ ] Commit: `feat: implement combat turn flow`.

### Task 4: Effect Coverage

- [ ] Implement remaining MVP card effects as data-driven handlers in `cardEffects.ts`.
- [ ] Register them in `registerCombatEffects()`.
- [ ] Test all 15 card effect ids resolve to non-placeholder behavior.
- [ ] Commit: `feat: implement MVP card effects`.

### Task 5: Verification

- [ ] Run `npm test -- tests/core/combatEngine.test.ts`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
