# Combat Ticker Region Backlog

## Backlog ID

`combat-ticker-region`

## Worktree Size

小到中型，一個 worktree。

## Player Problem

目前右側戰況 ticker 已能顯示戰鬥訊息，但黑色半透明容器只是臨時可讀方案。玩家需要能理解最近發生的傷害、格擋、記憶、抽牌、死亡與系統訊息，而且訊息節奏要配合戰鬥動畫。

## Scope

- 針對右側戰況區進行獨立 brainstorm/design spec。
- 設計 ticker 訊息分類、優先順序、顯示數量與消退規則。
- 決定是否加入小 icon、顏色標記、訊息分組或簡短動畫。
- 決定是否保留 Phaser 半透明區塊、重畫 UI 素材，或使用混合方式。
- 確保 ticker 與中央 combat feedback 不互相重複或搶焦點。

## Out Of Scope

- 不重寫核心戰鬥事件模型，除非是為了暴露必要訊息。
- 不改玩家狀態、進度狀態、手牌、敵人或回合動作區。
- 不做完整 battle log 歷史檢視器。

## Acceptance Criteria

- 玩家能看懂最近 3 到 5 個重要戰鬥事件。
- 傷害、格擋、記憶、抽牌、死亡、系統訊息有可辨識差異。
- Ticker 不遮擋敵人、手牌或結束回合控制。
- `window.render_game_to_text()` 能觀察 ticker 狀態。

## Tests

- `npm test`
- `npm run build`
- `npm run test:e2e`
- Codex in-app browser 檢查出牌、格擋、敵人死亡時的 ticker 畫面與 console/page errors。

## Likely Files

- `docs/superpowers/specs/*combat-ticker-region-design.md`
- `docs/superpowers/plans/*combat-ticker-region-plan.md`
- `docs/assets/*`
- `src/phaser/fx/combatFeedback.ts`
- `src/phaser/ui/CombatSceneView.ts`
- `src/scenes/GameScene.ts`
- `tests/e2e/fullRunSmoke.mjs`

