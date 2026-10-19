import { describe, expect, test } from "vitest";
import { mulberry32, shuffle } from "../src/domain/rng";
import { DEFAULT_CONFIG, matchMinutes, slotMinutes } from "../src/domain/rules";

describe("rng", () => {
  test("same seed gives same sequence, values in [0,1)", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });

  test("shuffle is a reproducible permutation and does not mutate input", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const s1 = shuffle(input, mulberry32(7));
    expect(s1).toEqual(shuffle(input, mulberry32(7)));
    expect([...s1].sort((x, y) => x - y)).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

test("default slot is 45 min match + 5 min buffer", () => {
  expect(matchMinutes(DEFAULT_CONFIG)).toBe(45);
  expect(slotMinutes(DEFAULT_CONFIG)).toBe(50);
});
