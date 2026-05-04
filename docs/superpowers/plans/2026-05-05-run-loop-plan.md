# Run Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the framework-neutral run loop: 12-floor map, node selection, rewards, shop, rest, events, and contracts.

**Architecture:** Add `src/core/run/` modules that wrap combat and progression state. The run engine owns deck, relics, gold, map position, active contracts, and current screen mode.

**Tech Stack:** TypeScript, Vitest, existing core combat/data/RNG modules.

---

## Files

- Create: `src/core/run/types.ts`
- Create: `src/core/run/mapGenerator.ts`
- Create: `src/core/run/runEngine.ts`
- Create: `src/core/run/rewards.ts`
- Create: `src/core/run/shop.ts`
- Create: `src/core/run/events.ts`
- Modify: `src/core/index.ts`
- Create: `tests/core/runLoop.test.ts`

## Tasks

### Task 1: Run Creation And Map

- [ ] Add `createRun(seed)` with Seeker starting deck, Broken Notes, 72 HP, 99 gold.
- [ ] Generate a 12-floor branching map matching the spec constraints.
- [ ] Test floor 1 normal combat, floor 12 Boss, rest floor range, late special floor, no three consecutive non-combat route.
- [ ] Commit: `feat: create run map`.

### Task 2: Node Selection

- [ ] Add `selectMapNode(run, nodeId)` to enter combat, event, rest, shop, or Boss.
- [ ] Test unreachable node rejection and current mode transitions.
- [ ] Commit: `feat: implement map node selection`.

### Task 3: Combat Rewards

- [ ] Add reward generation after normal and elite combat.
- [ ] Add `chooseCardReward`, `skipCardReward`, and relic reward handling.
- [ ] Test card reward adds to deck, skip grants gold, elite grants relic.
- [ ] Commit: `feat: implement combat rewards`.

### Task 4: Shop And Rest

- [ ] Add shop inventory, buy card, buy relic, remove card.
- [ ] Add rest heal and mutation entry point.
- [ ] Test gold spend, removed card, rest heal, and disabled mutation when no eligible card exists.
- [ ] Commit: `feat: implement shop and rest loop`.

### Task 5: Events And Contracts

- [ ] Add event option resolution for the 4 MVP events.
- [ ] Add active contract state and delayed trigger counters.
- [ ] Test Blood, Debt, Ink, and Blank contract creation/effects.
- [ ] Commit: `feat: implement event contracts`.

### Task 6: Verification

- [ ] Run `npm test -- tests/core/runLoop.test.ts`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
