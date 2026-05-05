# Shop And Rest Usability Backlog

## Backlog ID

`gameplay-shop-rest-usability`

## Worktree Size

中型，一個 worktree。

## Player Problem

商店與休息點目前只是基本按鈕。玩家不知道商品是否值得買、移除哪張牌、變異哪張牌，也缺少購買後回饋。

## Scope

- 商店商品卡片化，顯示卡牌/遺物效果、價格、是否可負擔。
- 移除牌流程改成選牌，而不是直接 pop 牌組最後一張。
- 休息點變成兩個清楚動作：回血、變異。
- 休息點變異沿用 memory backlog 的選牌 UI。
- 交易完成後保留商店畫面並更新 sold/金幣。

## Out Of Scope

- 不新增經濟系統。
- 不新增商人 NPC 動畫，除非 Phaser feel backlog 已完成。

## Acceptance Criteria

- 玩家能選擇要移除哪張牌。
- 買不起的商品清楚 disabled。
- 購買與回血都有即時回饋。

## Tests

- 核心測試覆蓋 buy card/relic/remove selected card。
- E2E 覆蓋買一件商品、離開商店。
- 截圖檢查商品卡不超出畫面。

## Likely Files

- `src/core/run/shop.ts`
- `src/core/run/runEngine.ts`
- `src/scenes/GameScene.ts`
- `src/phaser/ui/ShopView.ts`

