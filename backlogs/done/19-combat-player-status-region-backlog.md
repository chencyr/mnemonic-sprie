# Combat Player Status Region Backlog

## Backlog ID

`combat-player-status-region`

## Worktree Size

小型，一個 worktree。

## Player Problem

目前左上玩家狀態區已先改成黑色半透明區域，雖然可讀，但還只是暫時容器。玩家需要更清楚理解自身 HP、格擋、能量與牌組狀態，而且這個區域不能只是像 debug panel。

## Scope

- 針對左上玩家狀態區進行獨立 brainstorm/design spec。
- 設計玩家 HP、格擋、能量、牌組/棄牌/抽牌數的視覺層級。
- 決定是否繼續使用 Phaser 半透明區塊、重畫 UI 素材，或使用混合方式。
- 保持所有數值與文字由 Phaser 動態渲染，不嵌入圖片。
- 更新 `window.render_game_to_text()`，讓測試可觀察玩家狀態區必要資訊。

## Out Of Scope

- 不改核心戰鬥數值規則。
- 不改敵人、手牌、ticker、回合動作區。
- 不做完整設定頁或音訊設定。

## Acceptance Criteria

- 玩家能在一眼內理解目前 HP、格擋與能量。
- 玩家狀態區不遮擋背景、敵人或手牌。
- HP/格擋/能量變化時有清楚回饋，且不造成文字重疊。
- 若使用素材圖，素材規格與 prompt 必須寫入 `docs/assets/`。

## Tests

- `npm test`
- `npm run build`
- `npm run test:e2e`
- Codex in-app browser 檢查 combat screenshot、`window.render_game_to_text()`、console/page errors。

## Likely Files

- `docs/superpowers/specs/*combat-player-status-region-design.md`
- `docs/superpowers/plans/*combat-player-status-region-plan.md`
- `docs/assets/*`
- `src/phaser/ui/CombatSceneView.ts`
- `src/scenes/GameScene.ts`
- `tests/e2e/fullRunSmoke.mjs`

