# Combat Progress Status Region Backlog

## Backlog ID

`combat-progress-status-region`

## Worktree Size

小型，一個 worktree。

## Player Problem

目前右上進度狀態區使用黑色半透明區域顯示樓層、金幣、遺物與契約資訊，但它還不是完整遊戲 UI。玩家需要在戰鬥中快速知道目前爬塔進度與資源狀態，同時不和未來的設定/音訊入口衝突。

## Scope

- 針對右上進度狀態區進行獨立 brainstorm/design spec。
- 設計樓層、金幣、遺物數、契約狀態的排列與資訊密度。
- 明確切開進度狀態區與遊戲設定/音訊入口區的邊界。
- 決定是否保留 Phaser 半透明區塊、重畫 UI 素材，或使用混合方式。
- 保持所有文字與數字由 Phaser 動態渲染。

## Out Of Scope

- 不開發設定選單本體。
- 不改地圖節點、商店、事件或經濟規則。
- 不改玩家狀態、敵人、手牌、ticker、回合動作區。

## Acceptance Criteria

- 戰鬥中可清楚讀到樓層、金幣、遺物與契約狀態。
- 右上資訊不與設定/音訊入口重疊。
- 在小視窗或 E2E viewport 下文字不溢出。
- 若使用素材圖，素材規格與 prompt 必須寫入 `docs/assets/`。

## Tests

- `npm test`
- `npm run build`
- `npm run test:e2e`
- Codex in-app browser 檢查 combat screenshot、`window.render_game_to_text()`、console/page errors。

## Likely Files

- `docs/superpowers/specs/*combat-progress-status-region-design.md`
- `docs/superpowers/plans/*combat-progress-status-region-plan.md`
- `docs/assets/*`
- `src/phaser/ui/CombatSceneView.ts`
- `src/scenes/GameScene.ts`
- `tests/e2e/fullRunSmoke.mjs`

