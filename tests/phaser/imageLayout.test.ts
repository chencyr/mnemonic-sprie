import { describe, expect, it } from "vitest";
import { coverCrop, coverFrame } from "../../src/phaser/ui/imageLayout";

describe("coverFrame", () => {
  it("preserves tall card art aspect ratio when covering a short hand art frame", () => {
    const placement = coverFrame({
      sourceWidth: 1024,
      sourceHeight: 1536,
      frameX: 8,
      frameY: 8,
      frameWidth: 116,
      frameHeight: 88,
      focusY: 0.32
    });

    expect(placement.displayWidth).toBeCloseTo(116, 5);
    expect(placement.displayHeight).toBeCloseTo(174, 5);
    expect(placement.displayHeight / placement.displayWidth).toBeCloseTo(1536 / 1024, 5);
    expect(placement.y - placement.displayHeight / 2).toBeLessThan(8);
    expect(placement.y + placement.displayHeight / 2).toBeGreaterThan(8 + 88);
  });

  it("does not crop when source and frame aspect ratios match", () => {
    const placement = coverFrame({
      sourceWidth: 1024,
      sourceHeight: 1536,
      frameX: 0,
      frameY: 0,
      frameWidth: 120,
      frameHeight: 180
    });

    expect(placement.displayWidth).toBeCloseTo(120, 5);
    expect(placement.displayHeight).toBeCloseTo(180, 5);
    expect(placement.x).toBeCloseTo(60, 5);
    expect(placement.y).toBeCloseTo(90, 5);
  });

  it("crops a vertical card image instead of stretching it into the card frame", () => {
    const crop = coverCrop({
      sourceWidth: 1024,
      sourceHeight: 1536,
      frameWidth: 116,
      frameHeight: 168,
      focusY: 0.3
    });

    expect(crop.width / crop.height).toBeCloseTo(116 / 168, 5);
    expect(crop.width).toBe(1024);
    expect(crop.height).toBeLessThanOrEqual(1536);
    expect(crop.y).toBeGreaterThanOrEqual(0);
    expect(crop.y + crop.height).toBeLessThanOrEqual(1536);
  });
});
