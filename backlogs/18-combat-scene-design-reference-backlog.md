# Combat Scene Design Reference Backlog

## Backlog ID

`combat-scene-design-reference`

## Worktree Size

小型，一個 worktree。偏文件與設計整理，不直接實作遊戲功能。

## Player Problem

後續多份 backlog 都會修改戰鬥場景，但目前戰鬥 UI 設計稿尚未被整理成專案可引用的規格。若直接開始 `04`、`05`、`06` 等功能，容易讓回合節奏、敵人意圖、記憶顯示與教學提示各自採用不同版面邏輯，最後形成不一致的戰鬥 UI。

## Scope

- 盤點已加入 repo 的戰鬥場景設計稿：
  - `externals/battle-design-proposal-1.png`
  - `externals/battle-design-proposal-2.png`
  - `externals/battle-design-proposal-3.png`
  - `externals/battle-design-proposal-4.png`
- 產出一份戰鬥場景 UI reference spec，放在 `docs/superpowers/specs/`。
- 明確標記：
  - 哪一張設計稿作為主 layout 方向。
  - 哪些設計稿只取局部元素。
  - 玩家區、敵人區、手牌區、ticker/log、意圖/status、回合提示、記憶提示的版面規則。
  - 後續 `04`、`05`、`06`、`12`、`13` 應如何引用此 spec。
- 若需要，比對目前遊戲截圖與設計稿，列出 UI gap。

## Out Of Scope

- 不直接修改 `GameScene` 或 Phaser UI component。
- 不實作回合 sequence、敵人意圖 icon、記憶 UI、音效或教學。
- 不重新生成設計稿；若設計稿不足，只記錄缺口與後續素材需求。

## Acceptance Criteria

- `docs/superpowers/specs/` 中有一份可被後續 backlog 引用的 combat scene UI reference spec。
- spec 內明確列出四張 `battle-design-proposal` 的用途與取捨。
- spec 內定義戰鬥場景主要 UI 區塊與資訊優先序。
- spec 內列出對 `04-turn-flow-pacing`、`05-enemy-intent-status-clarity`、`06-memory-visibility-mutation`、`12-audio-gamefeel`、`13-onboarding-tutorial` 的影響。
- 不產生功能程式碼修改。

## Tests

- 檢查 spec 檔存在於 `docs/superpowers/specs/`。
- 檢查 spec 內有引用所有四張戰鬥設計稿。
- 檢查 spec 內沒有只留在對話中的待定主方向。
- 不需要跑 `npm test` / `npm run build`，除非本 backlog 被擴大到程式碼改動。

## Likely Files

- `docs/superpowers/specs/2026-05-06-combat-scene-design-reference-design.md`
- `backlogs/18-combat-scene-design-reference-backlog.md`
- `backlogs/00-index-backlog.md`
