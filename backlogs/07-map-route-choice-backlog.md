# Map Route Choice Backlog

## Backlog ID

`gameplay-map-route-choice`

## Worktree Size

中型，一個 worktree。

## Player Problem

目前地圖每層幾乎全連，節點像棋盤，路線選擇壓力不強。Roguelike 爬塔需要讓玩家看出「這條路會遇到什麼風險與機會」。

## Scope

- 改成有限連線，不是每個節點都連到下一層所有節點。
- 路線預覽：選中節點時高亮未來 2-3 層可能路線。
- 節點 icon 使用現有資產，而不是單字文字。
- 顯示目前所在位置與已完成路徑。
- 保證至少一條可通關路線，且休息/商店/事件分布合理。

## Out Of Scope

- 不新增地圖存檔。
- 不做大型 procedural map editor。

## Acceptance Criteria

- 每次選節點都像策略選擇，而不是任意點。
- 玩家能看出哪條路較多戰鬥、哪條路較多事件或商店。
- 地圖在 1280x720 下不擁擠。

## Tests

- Map generator 單元測試覆蓋可達性與分布。
- E2E 完整通關仍能找到 Boss。
- 截圖檢查節點與連線可讀。

## Likely Files

- `src/core/run/mapGenerator.ts`
- `src/scenes/GameScene.ts`
- `src/phaser/ui/MapView.ts`
- `tests/core/runLoop.test.ts`

