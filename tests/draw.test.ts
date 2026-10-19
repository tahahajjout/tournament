import { describe, expect, test } from "vitest";
import { draw, groupSizes } from "../src/domain/draw";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `t${i + 1}`);

describe("groupSizes", () => {
  test.each([
    [3, [3]],
    [4, [4]],
    [5, [5]],
    [6, [3, 3]],
    [7, [4, 3]],
    [8, [4, 4]],
    [9, [3, 3, 3]],
    [10, [4, 3, 3]],
    [12, [4, 4, 4]],
    [16, [4, 4, 4, 4]],
  ])("%i teams → %j", (n, sizes) => {
    expect(groupSizes(n)).toEqual(sizes);
  });

  test("never creates groups of 2 or 5+ beyond 5 teams", () => {
    for (let n = 6; n <= 32; n++) {
      for (const s of groupSizes(n)) expect([3, 4]).toContain(s);
    }
  });

  test("rejects fewer than 3 teams", () => {
    expect(() => groupSizes(2)).toThrow();
  });
});

describe("draw", () => {
  test("9 teams → 3 groups of 3 containing every team once", () => {
    const groups = draw(ids(9), 1);
    expect(groups.map((g) => g.id)).toEqual(["A", "B", "C"]);
    expect(groups.map((g) => g.teamIds.length)).toEqual([3, 3, 3]);
    expect(groups.flatMap((g) => g.teamIds).sort()).toEqual(ids(9).sort());
  });

  test("same seed → identical draw; different seed → different draw", () => {
    expect(draw(ids(12), 5)).toEqual(draw(ids(12), 5));
    expect(draw(ids(12), 5)).not.toEqual(draw(ids(12), 6));
  });

  test("pot teams land in different groups", () => {
    for (let seed = 0; seed < 50; seed++) {
      const groups = draw(ids(16), seed, { pots: [["t1", "t2", "t3", "t4"]] });
      const seeded = groups.map((g) => g.teamIds.filter((t) => ["t1", "t2", "t3", "t4"].includes(t)).length);
      expect(seeded).toEqual([1, 1, 1, 1]);
    }
  });

  test("manual sizes override, and must add up", () => {
    expect(draw(ids(10), 1, { sizes: [5, 5] }).map((g) => g.teamIds.length)).toEqual([5, 5]);
    expect(() => draw(ids(10), 1, { sizes: [4, 4] })).toThrow();
  });
});
