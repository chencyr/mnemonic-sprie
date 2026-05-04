# Memory Systems Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement physical card memory tracking, mutation, relic triggers, and Boss habit countermeasures.

**Architecture:** Extend combat/run core state with card instance memory and recent combat analytics. Keep mutation results data-driven and testable without Phaser.

**Tech Stack:** TypeScript, Vitest, existing core combat/run/data modules.

---

## Files

- Create: `src/core/memory/memoryRules.ts`
- Create: `src/core/memory/mutations.ts`
- Create: `src/core/relics/relicEngine.ts`
- Create: `src/core/boss/habitAnalysis.ts`
- Modify: `src/core/combat/combatEngine.ts`
- Modify: `src/core/run/runEngine.ts`
- Modify: `src/core/index.ts`
- Create: `tests/core/memorySystems.test.ts`

## Tasks

### Task 1: Memory Triggers

- [ ] Track Bloodthirst, Desperation, Grudge, Obsession, and Witness on physical card instances.
- [ ] Test each threshold from the spec.
- [ ] Commit: `feat: track card memory triggers`.

### Task 2: Mutations

- [ ] Add mutation eligibility and `mutateCard(run, cardInstanceId, memoryType)`.
- [ ] Implement hand-authored variants for Strike, Guard, Recall, and Memory Blade plus modular affixes for other cards.
- [ ] Test single major mutation limit and variant id preservation.
- [ ] Commit: `feat: implement card mutation`.

### Task 3: Relic Triggers

- [ ] Implement Broken Notes, Neon Nail, Sticker Charm, Old Ticket Stub, Broken Recorder.
- [ ] Test each relic trigger in isolation.
- [ ] Commit: `feat: implement MVP relic effects`.

### Task 4: Boss Habit Analysis

- [ ] Track recent 3 combat summaries.
- [ ] Add Boss countermeasure selection and explicit reveal event.
- [ ] Test attack, defense, skill, many-card, zero-cost, and retain tendencies.
- [ ] Commit: `feat: implement boss habit countermeasures`.

### Task 5: Verification

- [ ] Run `npm test -- tests/core/memorySystems.test.ts`.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
