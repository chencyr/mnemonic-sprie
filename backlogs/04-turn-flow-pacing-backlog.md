# Turn Flow Pacing Backlog

## Backlog ID

`gameplay-turn-pacing`

## Worktree Size

小到中型，一個 worktree。

## Player Problem

目前結束回合後敵人行動和抽牌幾乎瞬間完成。玩家難以理解敵人做了什麼，也缺乏回合制卡牌遊戲需要的節奏。

## Scope

- 將 `endRunTurn` 拆成可視化 sequence：棄牌、敵人意圖執行、玩家受傷、抽牌、新回合。
- Phaser 層建立 action queue，不直接整畫面同步跳轉。
- 每個 phase 有短暫 label 或動畫。
- E2E quick mode 可以縮短或跳過等待。

## Out Of Scope

- 不重寫核心規則。
- 不做 replay/undo。

## Acceptance Criteria

- 點結束回合後，玩家看得出敵人攻擊或格擋。
- 新手能理解「敵人回合」與「玩家回合」交替。
- quick E2E 不因動畫等待變慢超過可接受範圍。

## Tests

- 核心測試維持即時解析。
- E2E 在 `?e2e=1` 下使用 fast animation config。
- 手動正常模式截圖或錄影檢查節奏。

## Likely Files

- `src/scenes/GameScene.ts`
- `src/core/combat/combatEngine.ts`
- `tests/e2e/fullRunSmoke.mjs`

