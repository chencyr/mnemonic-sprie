# Enemy Intent And Status Clarity Backlog

## Backlog ID

`gameplay-intent-status-clarity`

## Worktree Size

小型，一個 worktree。

## Player Problem

敵人意圖目前只是文字。玩家很難快速判斷下一回合會受多少傷害、敵人是否會上狀態、自己身上有哪些弱化。

## Scope

- 意圖 icon 化：攻擊、格擋、debuff、mixed。
- 顯示數字與 tooltip/簡短說明。
- 玩家與敵人狀態用 icon + 層數呈現。
- `vulnerable`、`weak`、`frail`、`spikes` 統一中文顯示。

## Out Of Scope

- 不新增新狀態。
- 不改敵人 AI。

## Acceptance Criteria

- 玩家不用讀長句就能知道敵人下回合行動。
- 狀態層數變化可見。
- 文字不壓到敵人圖或按鈕。

## Tests

- 戰鬥截圖檢查 intent 與 status。
- 核心測試驗證 status tick 不變。
- E2E 驗證 intent 資料仍在 text state 中。

## Likely Files

- `src/scenes/GameScene.ts`
- `src/phaser/ui/EnemyView.ts`
- `src/data/assets.json`

