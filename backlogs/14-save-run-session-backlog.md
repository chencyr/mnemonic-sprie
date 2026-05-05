# Save Run Session Backlog

## Backlog ID

`gameplay-save-session`

## Worktree Size

中型，一個 worktree。

## Player Problem

MVP 可每局重新開始，但玩家關掉頁面就失去進度。若一局接近 20 分鐘，至少需要瀏覽器 session 級保存，避免中途刷新全丟。

## Scope

- 將 `RunState` serialize 到 localStorage。
- 每次進入新節點、戰鬥勝利、獎勵選擇、休息/商店/事件後保存。
- Title 畫面提供「繼續上一局」與「新遊戲」。
- 版本不相容時自動忽略舊存檔並提示。

## Out Of Scope

- 不做雲端存檔。
- 不做多 slot。
- 不保證跨重大資料表變更相容。

## Acceptance Criteria

- 刷新頁面後可以繼續同一局。
- 通關或死亡後清除/封存該局。
- `?e2e=1` 可選擇關閉存檔避免測試污染。

## Tests

- 核心 serialize/deserialize 單元測試。
- E2E 覆蓋刷新後繼續。
- 測試 corrupted localStorage 不會 crash。

## Likely Files

- `src/core/run/types.ts`
- `src/core/run/runEngine.ts`
- `src/scenes/GameScene.ts`
- 新增 `src/core/run/saveGame.ts`

