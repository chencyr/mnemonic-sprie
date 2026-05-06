# Combat Hand Region Backlog

## Backlog ID

`combat-hand-region`

## Worktree Size

中型，一個 worktree。

## Player Problem

目前正下方手牌區使用黑色半透明容器承載卡牌，卡牌已能點擊與拖曳，但手牌區仍缺少完整卡牌遊戲的手感與可讀性。玩家需要清楚知道哪些卡可出、哪些不可出、拖曳目標在哪裡，以及卡片不能變形。

## Scope

- 針對正下方手牌區進行獨立 brainstorm/design spec。
- 設計手牌排列、hover、drag lift、drop hint、可出牌/不可出牌狀態。
- 確保卡片圖片依素材描述維持比例，不被拉伸或壓扁。
- 決定是否保留 Phaser 半透明區塊、重畫 UI 素材，或使用混合方式。
- 檢查單張、多張、滿手牌時的版面邊界。

## Out Of Scope

- 不新增卡牌規則或新卡。
- 不改敵人、玩家狀態、進度狀態、ticker 或回合動作區。
- 不做完整 deck/discard browser。

## Acceptance Criteria

- 卡牌在手牌區不變形，文字與主要美術可讀。
- 可出牌與不可出牌狀態清楚。
- 拖曳與點擊出牌都可靠。
- 單敵、多敵、攻擊牌、非攻擊牌都能合理處理目標。
- 手牌區不遮擋 `測試勝利` 或回合動作區。

## Tests

- `npm test`
- `npm run build`
- `npm run test:e2e`
- Codex in-app browser 檢查 click play、drag play、invalid drag cancel、手牌多寡與 console/page errors。

## Likely Files

- `docs/superpowers/specs/*combat-hand-region-design.md`
- `docs/superpowers/plans/*combat-hand-region-plan.md`
- `docs/assets/*`
- `src/phaser/ui/CardView.ts`
- `src/phaser/ui/CombatSceneView.ts`
- `src/scenes/GameScene.ts`
- `tests/e2e/fullRunSmoke.mjs`

