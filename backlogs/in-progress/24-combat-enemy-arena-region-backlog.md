# Combat Enemy Arena Region Backlog

## Backlog ID

`combat-enemy-arena-region`

## Worktree Size

中型，一個 worktree。

## Player Problem

目前正中央敵人區已經能呈現敵人、意圖、HP、死亡半透明狀態與目標選取，但整體舞台感還不足。玩家需要清楚分辨可攻擊敵人、死亡敵人、敵人意圖、敵人行動與戰鬥勝利判定，而不是只看見幾個 sprite 疊在背景上。

## Scope

- 針對中央敵人區進行獨立 brainstorm/design spec。
- 設計敵人站位、平台、target ring、alive/dead 狀態視覺、死亡過場與不可攻擊狀態。
- 明確敵人狀態機在 UI 的呈現規則：
  - alive 可被攻擊，可行動。
  - dead 不可被攻擊，不可行動，保持死亡樣貌。
- 確保狀態轉換效果完成後，才進入下一階段判定，例如 victory。
- 檢查單敵、多敵、Boss、精英的版面。

## Out Of Scope

- 不改敵人 AI 或平衡。
- 不完整實作 `05-enemy-intent-status-clarity` 的所有狀態 icon。
- 不改玩家狀態、手牌、ticker 或回合動作區。

## Acceptance Criteria

- Alive/dead 狀態在畫面上清楚不同。
- Dead 敵人不會在下回合變回實體。
- Dead 敵人不可被攻擊、不可行動。
- 最後敵人死亡後，死亡過場完成才進入勝利階段。
- 多敵人站位不重疊，意圖與 HP 可讀。

## Tests

- `npm test`
- `npm run build`
- `npm run test:e2e`
- Codex in-app browser 檢查攻擊、死亡 1 秒過場、dead state 保持、多敵目標選取與 console/page errors。

## Likely Files

- `docs/superpowers/specs/*combat-enemy-arena-region-design.md`
- `docs/superpowers/plans/*combat-enemy-arena-region-plan.md`
- `docs/assets/*`
- `src/core/combat/*`
- `src/phaser/ui/EnemyView.ts`
- `src/phaser/ui/CombatSceneView.ts`
- `src/scenes/GameScene.ts`
- `tests/e2e/fullRunSmoke.mjs`

