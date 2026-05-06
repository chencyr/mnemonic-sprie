# 遊玩優化 Backlog Index

目的：把目前 MVP 中「像網頁 UI、遊戲手感不足、資訊回饋不夠」的問題切成可獨立開 worktree 的 backlog。每份 backlog 都應該能在一個 feature branch/worktree 中完成、測試、合併。

## Backlog ID

`gameplay-backlog-management`

## Worktree Size

小型，一個 worktree。只維護 backlog 結構、優先順序與狀態，不實作遊戲功能。

## Player Problem

若遊玩優化沒有被拆成可執行單位，後續會重新落回「一次大改全部」的狀態，難以測試、難以回滾，也不容易比較每次修改是否真的改善遊玩。

## Scope

- 維護 `backlogs/*-backlog.md` 清單。
- 調整優先順序與依賴關係。
- 將已完成、取消、拆分、合併的 backlog 留下決策紀錄。

## Out Of Scope

- 不在 index 中實作具體功能。
- 不把單項 backlog 寫成過大的 umbrella epic。

## 建議執行順序

1. `17-overall-game-ui-redesign-backlog.md`
2. `01-phaser-game-feel-backlog.md`
3. `02-drag-drop-card-play-backlog.md`
4. `03-combat-feedback-readability-backlog.md`
5. `18-combat-scene-ui-implementation-backlog.md`
6. `19-combat-player-status-region-backlog.md`
7. `20-combat-progress-status-region-backlog.md`
8. `21-combat-ticker-region-backlog.md`
9. `22-combat-turn-action-region-backlog.md`
10. `23-combat-hand-region-backlog.md`
11. `24-combat-enemy-arena-region-backlog.md`
12. `25-game-settings-audio-entry-backlog.md`
13. `04-turn-flow-pacing-backlog.md`
14. `05-enemy-intent-status-clarity-backlog.md`
15. `06-memory-visibility-mutation-backlog.md`
16. `07-map-route-choice-backlog.md`
17. `08-reward-drafting-depth-backlog.md`
18. `09-event-contract-risk-backlog.md`
19. `10-shop-rest-usability-backlog.md`
20. `11-balance-difficulty-curve-backlog.md`
21. `12-audio-gamefeel-backlog.md`
22. `13-onboarding-tutorial-backlog.md`
23. `14-save-run-session-backlog.md`
24. `15-accessibility-responsive-backlog.md`
25. `16-e2e-exploration-coverage-backlog.md`

## 共通 Definition Of Done

- 不破壞 `npm test`、`npm run build`、`npm run test:e2e`。
- 更新 `window.render_game_to_text()`，讓 E2E 能觀察新增狀態。
- 若改 UI，至少產生並人工檢查 title/map/combat 或相關畫面截圖。
- 若改核心規則，新增或更新 Vitest。
- 若改互動流程，新增或更新 E2E。

## Acceptance Criteria

- 每個遊玩優化項目都有獨立 `*-backlog.md`。
- 每份 backlog 都有 ID、worktree 大小、範圍、驗收條件與測試方式。
- 執行順序能反映依賴關係。

## Tests

- `find backlogs -maxdepth 1 -type f -name '*-backlog.md' | sort`
- 檢查每份 backlog 是否包含 `Backlog ID`、`Worktree Size`、`Acceptance Criteria`、`Tests`。
