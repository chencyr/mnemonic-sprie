# Combat Turn Action Region Backlog

## Backlog ID

`combat-turn-action-region`

## Worktree Size

小到中型，一個 worktree。

## Player Problem

目前右下回合動作區用黑色半透明容器放置回合數、能量與結束回合按鈕，但還沒有完整的遊戲操作感。玩家需要明確知道現在能不能行動、為什麼自動結束回合、以及按下結束回合後進入哪個階段。

## Scope

- 針對右下回合動作區進行獨立 brainstorm/design spec。
- 設計主動結束回合、自動結束回合、敵人階段、抽牌階段等訊息入口。
- 明確和 `04-turn-flow-pacing` 的責任邊界：本 backlog 處理 UI 區域呈現，`04` 處理回合流程 sequence。
- 決定是否保留 Phaser 半透明區塊、重畫 UI 素材，或使用混合方式。
- 確保 `?e2e=1` 的 `測試勝利` 不再與正常回合動作互相干擾。

## Out Of Scope

- 不完整實作 `04-turn-flow-pacing` 的 action queue。
- 不改卡牌費用或能量規則。
- 不改玩家狀態、進度狀態、敵人、手牌或 ticker 區。

## Acceptance Criteria

- 玩家能清楚看到目前回合、可用能量與主要行動按鈕。
- 主動結束回合與自動結束回合能呈現不同訊息。
- 在無可出牌時，自動結束回合不會讓玩家覺得突然跳轉。
- E2E quick controls 不影響一般玩家操作區。

## Tests

- `npm test`
- `npm run build`
- `npm run test:e2e`
- Codex in-app browser 檢查一般結束回合、自動結束回合、`?e2e=1` quick control 位置與 console/page errors。

## Likely Files

- `docs/superpowers/specs/*combat-turn-action-region-design.md`
- `docs/superpowers/plans/*combat-turn-action-region-plan.md`
- `docs/assets/*`
- `src/phaser/ui/CombatSceneView.ts`
- `src/scenes/GameScene.ts`
- `tests/e2e/fullRunSmoke.mjs`

