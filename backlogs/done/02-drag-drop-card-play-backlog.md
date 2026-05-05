# Drag Drop Card Play Backlog

## Backlog ID

`gameplay-card-drag-drop`

## Worktree Size

中型，一個 worktree。改 Phaser 互動層與 E2E。

## Player Problem

目前出牌流程是「點卡，再點目標」，可玩但像表單操作。卡牌遊戲應該要能拖牌、懸停、釋放到敵人或場域，手感才直覺。

## Scope

- 卡牌 GameObject 支援 drag start / drag / drop。
- 拖曳攻擊牌到敵人上方時，高亮可攻擊目標。
- 自身/無目標牌可拖到玩家區或戰場中央釋放。
- 拖曳取消時卡牌回到手牌位置。
- 保留點擊模式作為 fallback，避免行動裝置或 E2E 不穩。
- `render_game_to_text()` 增加目前 drag/hover/selected 狀態。

## Out Of Scope

- 不改卡牌效果。
- 不做複雜物理碰撞。
- 不做多指觸控。

## Acceptance Criteria

- 攻擊牌拖到敵人上釋放會出牌。
- 拖到空白區會回手牌，不消耗能量。
- 防禦/技能牌有合理釋放區。
- 低能量卡牌不可拖出牌，UI 清楚顯示不可用。

## Tests

- E2E 覆蓋點擊 fallback。
- 新增 Playwright drag path 測試。
- 手動測試快速拖動、取消拖動、拖到錯誤目標。

## Likely Files

- `src/scenes/GameScene.ts`
- `src/phaser/ui/CardView.ts`
- `tests/e2e/fullRunSmoke.mjs`

