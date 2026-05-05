# E2E Exploration Coverage Backlog

## Backlog ID

`gameplay-e2e-exploration`

## Worktree Size

小到中型，一個 worktree。

## Player Problem

目前 E2E 已能跑完整 quick-run，但探索範圍仍偏固定。未來改動畫、拖曳、商店、事件後，需要更系統化的探索式測試來及早抓到無法執行、邏輯 bug、UI 失效。

## Scope

- 建立多 seed quick-run matrix。
- 探索參數外部化：最大步數、必經畫面、必測行為、viewport。
- 截圖命名與保留規則固定。
- Console error、不可點擊按鈕、NaN/負數狀態、卡死畫面統一 fail。
- 加入失敗時輸出最後 `render_game_to_text()`。

## Out Of Scope

- 不取代單元測試。
- 不做長時間 soak test。

## Acceptance Criteria

- E2E 可用一個指令跑至少 3 個 seed。
- 失敗時能快速知道卡在哪個 mode、哪個 button、哪個 state。
- 視覺截圖覆蓋 title/map/combat/reward/rest/shop/event/boss/victory。

## Tests

- `npm run test:e2e`
- 新增 `npm run test:e2e:explore`
- 故意破壞一個按鈕時，E2E 能給出可定位的失敗訊息。

## Likely Files

- `tests/e2e/fullRunSmoke.mjs`
- `tests/e2e/helpers.mjs`
- `package.json`

