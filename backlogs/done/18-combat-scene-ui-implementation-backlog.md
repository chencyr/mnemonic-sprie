# Combat Scene UI Implementation Backlog

## Backlog ID

`combat-scene-ui-implementation`

## Worktree Size

中型，一個 worktree。這是實作型 backlog，會修改 Phaser 戰鬥場景 UI 與相關元件。

## Player Problem

目前戰鬥場景雖然已經有基本可玩流程、拖曳出牌、死亡狀態與分層戰鬥回饋，但整體版面仍偏工程 UI。專案已經有戰鬥場景設計稿，玩家應該看到更接近設計稿的戰鬥畫面，而不是只把設計稿當 reference 存放。

如果不先把戰鬥場景 UI 落到 Phaser，後續 `04` 回合節奏、`05` 敵人意圖、`06` 記憶 UI、`12` 音效手感、`13` 教學提示都會建立在錯的畫面結構上，後面容易重工。

## Scope

- 先透過 brainstorm 選定戰鬥場景主設計稿，候選包含：
  - `externals/battle-design-proposal-1.png`
  - `externals/battle-design-proposal-2.png`
  - `externals/battle-design-proposal-3.png`
  - `externals/battle-design-proposal-4.png`
- 產出 combat scene UI implementation spec，放在 `docs/superpowers/specs/`。
- 產出 implementation plan，放在 `docs/superpowers/plans/`。
- 依設計稿重做戰鬥場景 Phaser UI：
  - 玩家資訊區：HP、能量、格擋、牌組/棄牌資訊。
  - 戰場區：敵人站位、敵人卡面/角色呈現、死亡狀態呈現。
  - 敵人意圖與狀態顯示位置，但不必完整實作 `05` 的 icon/status 系統。
  - 手牌區：卡牌排列、可出牌狀態、拖曳 drop zone 與 hover feedback。
  - 右側 ticker / combat feedback 區。
  - 結束回合、quick test 控制按鈕的位置與層級。
- 保留既有戰鬥功能：
  - 點擊出牌。
  - 拖曳出牌。
  - 自動選敵。
  - 無可出牌時自動結束回合。
  - 敵人 alive/dead 狀態。
  - 1 秒死亡到勝利過場。
  - `window.render_game_to_text()` 可觀測狀態。
- 每次有意義 UI 改動後，使用 develop-web-game 流程檢查瀏覽器畫面。

## Out Of Scope

- 不重新設計整個遊戲的 map/reward/shop/rest/event UI。
- 不新增核心戰鬥規則。
- 不完整實作 `04-turn-flow-pacing` 的 action sequence。
- 不完整實作 `05-enemy-intent-status-clarity` 的所有 icon/status 細節。
- 不完整實作 `06-memory-visibility-mutation` 的記憶變異 UI。
- 不新增新卡牌、新敵人或新數值平衡。
- 不重新生成設計稿；若設計稿不足，只在 spec 中記錄缺口。

## Acceptance Criteria

- 戰鬥場景截圖與選定的設計稿有明確版面對應，而不是目前的工程 panel layout。
- 玩家區、敵人區、手牌區、ticker/feedback、結束回合控制都有設計稿對應的位置與層級。
- 既有戰鬥互動不退化：
  - 可點擊/拖曳出牌。
  - 攻擊牌可拖到敵人或戰場並自動選敵。
  - 非攻擊牌可拖到玩家區或戰場。
  - 死亡敵人不可被攻擊、不可行動，且保持死亡樣貌。
  - 最後敵人死亡後仍需等待死亡過場才進 reward。
- `window.render_game_to_text()` 保留必要狀態，E2E 不因 UI 重排而失去可觀測性。
- 手動或 Playwright 截圖確認：
  - 戰鬥開始畫面。
  - 出牌造成傷害。
  - 格擋或記憶 feedback。
  - 敵人死亡過場。
- 沒有 console/page errors。

## Tests

- `npm test`
- `npm run build`
- `npm run test:e2e`
- develop-web-game 驗證：
  - 使用 `$WEB_GAME_CLIENT` 或等效 Playwright client 驅動本機遊戲。
  - 檢查 screenshot。
  - 檢查 `window.render_game_to_text()`。
  - 檢查 console/page errors。
- 手動 Playwright 場景：
  - start -> map -> combat。
  - drag attack to battlefield。
  - drag guard/self card to player or battlefield。
  - force enemy death and verify 1 秒 victory transition。

## Likely Files

- `docs/superpowers/specs/2026-05-06-combat-scene-ui-implementation-design.md`
- `docs/superpowers/plans/2026-05-06-combat-scene-ui-implementation-plan.md`
- `src/scenes/GameScene.ts`
- `src/phaser/ui/CardView.ts`
- `src/phaser/ui/EnemyView.ts`
- `src/phaser/ui/HudView.ts`
- `src/phaser/ui/uiTheme.ts`
- `src/phaser/ui/uiPrimitives.ts`
- `src/phaser/fx/combatFeedback.ts`
- `tests/e2e/fullRunSmoke.mjs`
- `progress.md`
