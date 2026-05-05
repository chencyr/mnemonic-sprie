# Phaser Game Feel Backlog

## Backlog ID

`gameplay-phaser-feel`

## Worktree Size

中型，一個 worktree。主要集中在 Phaser 表現層，不改核心規則。

## Player Problem

目前畫面雖然跑在 Phaser Canvas 裡，但互動像靜態網頁：切畫面是整個重繪、沒有動畫節奏、沒有卡牌/敵人/場景動感。玩家會懷疑這不是遊戲。

## Scope

- 加入 Scene/Container 層級的 enter/exit transition。
- 卡牌、敵人、按鈕、獎勵出現時使用 Phaser tweens。
- 打牌、受傷、勝利、失敗加入 camera flash/shake。
- 重要狀態變化加入簡短 motion，例如 HP 扣除、金幣增加、獎勵卡浮入。
- 建立共用 `src/phaser/fx/` helper，避免每個畫面手寫動畫。

## Out Of Scope

- 不改戰鬥規則。
- 不新增大量素材。
- 不做骨骼動畫或 sprite sheet 動畫。

## Acceptance Criteria

- 從 title 到 map、map 到 combat、combat 到 reward 有可見轉場。
- 打出攻擊牌時敵人有 shake/flash 或 hit tween。
- 獲得獎勵時卡牌不是瞬間跳出，而是有進場動畫。
- E2E 仍可穩定點擊，不因 tween 導致座標失效。

## Tests

- `npm test`
- `npm run build`
- `npm run test:e2e`
- 手動截圖檢查 title、map、combat、reward。

## Likely Files

- `src/scenes/GameScene.ts`
- `src/phaser/ui/*`
- 新增 `src/phaser/fx/*`

