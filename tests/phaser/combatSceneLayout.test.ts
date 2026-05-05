import { describe, expect, it } from "vitest";
import { combatLayout, handCardPose } from "../../src/phaser/ui/CombatSceneView";

describe("combat scene layout", () => {
  it("keeps primary combat regions inside the 1280x720 viewport", () => {
    const regions = [
      combatLayout.playerPanel,
      combatLayout.topResource,
      combatLayout.battlefield,
      combatLayout.ticker,
      combatLayout.handTray,
      combatLayout.turnDevice
    ];

    for (const region of regions) {
      expect(region.x).toBeGreaterThanOrEqual(0);
      expect(region.y).toBeGreaterThanOrEqual(0);
      expect(region.x + region.w).toBeLessThanOrEqual(1280);
      expect(region.y + region.h).toBeLessThanOrEqual(720);
    }
  });

  it("places five hand cards in a proposal-3 style arc without leaving the hand tray", () => {
    const poses = Array.from({ length: 5 }, (_, index) => handCardPose(index, 5));

    expect(poses.map((pose) => Math.round(pose.rotation * 100) / 100)).toEqual([-0.1, -0.05, 0, 0.05, 0.1]);
    for (const pose of poses) {
      expect(pose.x).toBeGreaterThanOrEqual(combatLayout.handTray.x);
      expect(pose.x + pose.w).toBeLessThanOrEqual(combatLayout.handTray.x + combatLayout.handTray.w);
      expect(pose.y).toBeGreaterThanOrEqual(combatLayout.handTray.y - 20);
      expect(pose.y + pose.h).toBeLessThanOrEqual(720);
    }
  });
});
