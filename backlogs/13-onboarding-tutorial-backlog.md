# Onboarding Tutorial Backlog

## Backlog ID

`gameplay-onboarding-tutorial`

## Worktree Size

中型，一個 worktree。

## Player Problem

新玩家不知道記憶、契約、Boss 對策的意義。現在只有一句開始說明，無法教會玩家如何操作與為何做選擇。

## Scope

- 第 1 場戰鬥加入最小教學提示：能量、手牌、敵人意圖、結束回合。
- 第一次獲得記憶時提示記憶系統。
- 第一次到休息點提示變異。
- 第一次遇到契約時提示收益/代價。
- 教學提示可關閉，且不阻擋 E2E quick mode。

## Out Of Scope

- 不做長篇劇情教學。
- 不做多語系系統，先中文。

## Acceptance Criteria

- 玩家第一局能理解基本操作。
- 提示不遮擋關鍵按鈕。
- 已看過的提示同一局不重複轟炸。

## Tests

- E2E 驗證提示出現與關閉。
- 截圖檢查提示位置。
- `render_game_to_text()` 暴露 active tutorial id。

## Likely Files

- `src/scenes/GameScene.ts`
- 新增 `src/phaser/ui/TutorialView.ts`
- `tests/e2e/fullRunSmoke.mjs`

