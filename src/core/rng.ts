export interface Rng {
  next(): number;
  nextInt(maxExclusive: number): number;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  return {
    next() {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    },
    nextInt(maxExclusive: number) {
      if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
        throw new Error(`maxExclusive must be a positive integer, got ${maxExclusive}`);
      }
      return Math.floor(this.next() * maxExclusive);
    }
  };
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = rng.nextInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickWeighted<T>(items: readonly { value: T; weight: number }[], rng: Rng): T {
  if (items.length === 0) {
    throw new Error("Cannot pick from an empty weighted list");
  }

  const total = items.reduce((sum, item) => {
    if (item.weight <= 0) {
      throw new Error(`Weight must be positive, got ${item.weight}`);
    }
    return sum + item.weight;
  }, 0);

  let roll = rng.next() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) {
      return item.value;
    }
  }

  return items[items.length - 1].value;
}
