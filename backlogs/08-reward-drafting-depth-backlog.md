# Reward Drafting Depth Backlog

## Backlog ID

`gameplay-reward-drafting`

## Worktree Size

中型，一個 worktree。

## Player Problem

戰鬥後三選一目前只是新增卡或跳過金幣。缺少卡牌稀有度、牌組關聯、記憶潛力、拿與不拿的策略比較。

## Scope

- 獎勵卡顯示稀有度、費用、類型、記憶 mutation keys。
- 根據目前牌組與近期打法給簡短提示，例如「可支援嗜血路線」。
- Elite 獎勵遺物選擇可見，不只是自動加入。
- Skip reward 可根據卡牌品質或契約狀態調整。

## Out Of Scope

- 不新增 30 張牌。
- 不重做掉落演算法成完整商業級權重。

## Acceptance Criteria

- 玩家能判斷三張卡的差異，而不是只看名字。
- Elite 後拿到遺物這件事有明確回饋。
- 跳過獎勵的收益清楚。

## Tests

- Rewards 單元測試覆蓋 normal/elite reward。
- E2E 覆蓋選卡、跳過、elite relic。
- 截圖檢查三張獎勵卡描述不重疊。

## Likely Files

- `src/core/run/rewards.ts`
- `src/scenes/GameScene.ts`
- `src/phaser/ui/RewardView.ts`
- `tests/core/runLoop.test.ts`

