# Memory Visibility And Mutation Backlog

## Backlog ID

`gameplay-memory-ux`

## Worktree Size

中型，一個 worktree。這是本遊戲核心賣點，優先級高。

## Player Problem

卡牌記憶是主創新，但目前記憶只用短文字 `血0 絕0...` 顯示。玩家不容易理解哪張牌快變異、為什麼得到記憶、變異後差異是什麼。

## Scope

- 卡牌上顯示記憶 sticker 或小徽章。
- 記憶條/閾值顯示，例如 `嗜血 2/3`。
- 戰鬥中獲得記憶時，在卡牌上播動畫。
- 休息點變異畫面列出可變異牌與可選記憶方向。
- 變異前後效果差異可比較。

## Out Of Scope

- 不新增大量新變異。
- 不改記憶閾值，除非 balance backlog 處理。

## Acceptance Criteria

- 玩家能一眼知道哪些牌有記憶進度。
- 休息點可以明確選牌、選變異，而不是自動選第一張。
- 變異後卡名、描述、效果變化清楚。

## Tests

- 核心測試覆蓋指定 memoryType 變異。
- E2E 覆蓋休息點選定一張牌變異。
- 截圖檢查卡牌記憶資訊不擠壓卡圖。

## Likely Files

- `src/core/memory/*`
- `src/scenes/GameScene.ts`
- `src/phaser/ui/CardView.ts`
- `tests/core/memorySystems.test.ts`
- `tests/e2e/fullRunSmoke.mjs`

