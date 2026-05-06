# Game Settings And Audio Entry Backlog

## Backlog ID

`game-settings-audio-entry`

## Worktree Size

小到中型，一個 worktree。

## Player Problem

目前右上角遊戲設定入口尚未完成，音訊控制也曾在 UI 調整中消失。玩家需要能在遊戲中找到設定入口，至少能控制聲音開關，並且這個入口不能和右上進度狀態互相遮擋。

## Scope

- 針對遊戲設定入口與音訊控制進行獨立 brainstorm/design spec。
- 設計右上角設定入口位置，和進度狀態區切出清楚邊界。
- 實作或整理音訊開關入口：
  - mute/unmute。
  - 顯示目前音訊狀態。
  - 保持 BGM/SFX 行為可測。
- 預留未來 Setting 面板入口，但 MVP 可只做最小可用設定層。
- 更新 `window.render_game_to_text()`，讓 E2E 可觀察設定/音訊狀態。

## Out Of Scope

- 不做完整選項頁，例如解析度、語言、鍵盤重綁。
- 不新增正式音樂素材。
- 不改戰鬥規則或 UI 五大區域的具體設計。

## Acceptance Criteria

- 玩家在戰鬥中能找到設定入口。
- 玩家能切換聲音開關，且狀態在 UI 上清楚。
- 設定/音訊入口不遮擋右上進度狀態。
- 音訊入口在 title/map/combat 等主要畫面規則一致，或明確只先支援 combat。
- E2E 能觀察 mute/unmute 狀態。

## Tests

- `npm test`
- `npm run build`
- `npm run test:e2e`
- Codex in-app browser 檢查設定入口位置、mute/unmute 操作、`window.render_game_to_text()`、console/page errors。

## Likely Files

- `docs/superpowers/specs/*game-settings-audio-entry-design.md`
- `docs/superpowers/plans/*game-settings-audio-entry-plan.md`
- `src/phaser/audio/*`
- `src/phaser/ui/*`
- `src/scenes/GameScene.ts`
- `tests/e2e/fullRunSmoke.mjs`

