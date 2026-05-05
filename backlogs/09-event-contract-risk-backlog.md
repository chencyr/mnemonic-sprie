# Event Contract Risk Backlog

## Backlog ID

`gameplay-event-contract-risk`

## Worktree Size

中型，一個 worktree。

## Player Problem

契約是 MVP 的第二創新，但目前事件選項只像按鈕文字，缺乏「現在獲利、之後承擔」的張力。玩家不容易追蹤契約何時會觸發。

## Scope

- 事件畫面明確拆成 benefit / cost / trigger。
- Active contracts 常駐顯示剩餘次數與下一次觸發條件。
- 契約觸發時有提示與音效。
- Boss 前顯示空白契、玩家習慣對策等風險提醒。
- 加入事件結果畫面，不是點完直接回地圖。

## Out Of Scope

- 不新增大量事件。
- 不讓契約變成純懲罰。

## Acceptance Criteria

- 玩家簽約前能明確理解收益與代價。
- 契約觸發時玩家知道是自己先前選擇造成。
- Active contract 不會在 UI 中被藏起來。

## Tests

- 核心測試覆蓋每個契約觸發與剩餘次數。
- E2E 覆蓋簽契約、觸發、顯示狀態。
- 截圖檢查事件文案與按鈕不重疊。

## Likely Files

- `src/core/run/events.ts`
- `src/core/run/runEngine.ts`
- `src/scenes/GameScene.ts`
- `tests/core/runLoop.test.ts`

