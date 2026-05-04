# Integration And E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify the complete MVP path through automated browser smoke tests and fix integration issues.

**Architecture:** Use Playwright and the existing web game client to exercise real browser flows. E2E asserts both visual state and `render_game_to_text()` state.

**Tech Stack:** Playwright, Phaser 3, Vite dev server, Vitest core tests.

---

## Files

- Create: `tests/e2e/fullRunSmoke.test.ts`
- Create: `tests/e2e/helpers.ts`
- Modify: `package.json`
- Modify: `src/core` and `src/phaser` only for fixes found by E2E.

## Tasks

### Task 1: E2E Harness

- [ ] Add `test:e2e` script.
- [ ] Add helper to start Vite, open page, and read `render_game_to_text()`.
- [ ] Test start screen loads with no console errors.
- [ ] Commit: `test: add browser e2e harness`.

### Task 2: Combat Smoke

- [ ] E2E starts a run, enters first combat, plays Strike on an enemy, ends turn.
- [ ] Assert hand/energy/enemy HP update in `render_game_to_text()`.
- [ ] Commit: `test: add combat browser smoke`.

### Task 3: Run Loop Smoke

- [ ] E2E wins a simple combat using deterministic test mode.
- [ ] Choose reward, move on map, visit rest/event/shop screens.
- [ ] Commit: `test: add run loop browser smoke`.

### Task 4: Full MVP Smoke

- [ ] Add deterministic quick-run mode for E2E only.
- [ ] Complete a 12-floor route with at least one mutation, one contract, one shop decision, and Boss reveal.
- [ ] Assert final win state.
- [ ] Commit: `test: add full run smoke`.

### Task 5: Final Verification

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Run `npm run test:e2e`.
- [ ] Run browser screenshot review and inspect latest screenshots.
