import { describe, expect, it } from "vitest";
import { createRng, pickWeighted, shuffle } from "../../src/core";

describe("deterministic RNG", () => {
  it("returns the same sequence for the same seed", () => {
    const a = createRng(12345);
    const b = createRng(12345);

    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });

  it("shuffles deterministically without mutating input", () => {
    const input = ["a", "b", "c", "d"];
    const output = shuffle(input, createRng(7));

    expect(input).toEqual(["a", "b", "c", "d"]);
    expect(output).toEqual(shuffle(input, createRng(7)));
    expect(output).not.toEqual(input);
  });

  it("picks weighted entries deterministically", () => {
    const result = pickWeighted(
      [
        { value: "low", weight: 1 },
        { value: "high", weight: 9 }
      ],
      createRng(3)
    );

    expect(result).toBe("high");
  });
});
