# Combat Feedback Readability Backlog

## Backlog ID

`gameplay-combat-feedback`

## Worktree Size

中型，一個 worktree。集中在戰鬥畫面與事件回饋。

## Player Problem

玩家目前看得到 HP、能量、手牌，但不知道剛剛發生了什麼：傷害、格擋、記憶增加、擊殺、抽牌都只在小字 log 裡，缺乏即時回饋。

## Scope

- 傷害跳字、格擋跳字、記憶跳字。
- 敵人 HP bar、block shield、狀態 icon。
- 玩家 HP/block bar。
- 當回合已打出的牌短暫顯示在戰場中央。
- 戰鬥 log 改為「最近事件 ticker」，不依賴玩家閱讀整段文字。

## Out Of Scope

- 不改 AI 或牌效果。
- 不做完整戰鬥 replay。

## Acceptance Criteria

- 打出斬擊時，敵人附近出現傷害數字。
- 使用格擋時，玩家附近出現格擋數字。
- 記憶進度增加時，卡牌或玩家區有明確提示。
- 敵人死亡有消失/淡出回饋。

## Tests

- `render_game_to_text()` 暴露近期浮動文字事件。
- E2E 驗證打牌後出現 `DAMAGE_DEALT` 或視覺事件。
- 截圖檢查傷害、格擋、記憶提示不重疊。

## Likely Files

- `src/scenes/GameScene.ts`
- `src/phaser/fx/*`
- `src/core/combat/combatEngine.ts`

