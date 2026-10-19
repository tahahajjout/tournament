import { describe, expect, test } from "vitest";
import { groupMatches } from "../src/domain/roundRobin";
import type { Match } from "../src/domain/types";

const group = (n: number) => ({
  id: "A",
  name: "A",
  teamIds: Array.from({ length: n }, (_, i) => `t${i + 1}`),
});
const teamsOf = (m: Match) => [m.home, m.away].map((r) => ("teamId" in r ? r.teamId : ""));

describe.each([3, 4, 5, 6])("group of %i", (n) => {
  const matches = groupMatches(group(n));
  const rounds = n % 2 === 0 ? n - 1 : n;

  test("every pair meets exactly once", () => {
    expect(matches).toHaveLength((n * (n - 1)) / 2);
    const pairs = new Set(matches.map((m) => teamsOf(m).sort().join("-")));
    expect(pairs.size).toBe(matches.length);
  });

  test("each team plays at most once per round and rests correctly", () => {
    const { teamIds } = group(n);
    for (let r = 1; r <= rounds; r++) {
      const playing = matches.filter((m) => m.round === r).flatMap(teamsOf);
      expect(new Set(playing).size).toBe(playing.length);
      expect(playing).toHaveLength(n % 2 === 0 ? n : n - 1);
    }
    if (n % 2 === 1) {
      // Each team rests exactly once over the n rounds.
      for (const t of teamIds) {
        const restRounds = Array.from({ length: rounds }, (_, i) => i + 1).filter(
          (r) => !matches.some((m) => m.round === r && teamsOf(m).includes(t)),
        );
        expect(restRounds).toHaveLength(1);
      }
    }
  });

  test("home/away counts differ by at most 1 for every team", () => {
    for (const t of group(n).teamIds) {
      const home = matches.filter((m) => teamsOf(m)[0] === t).length;
      const away = matches.filter((m) => teamsOf(m)[1] === t).length;
      expect(Math.abs(home - away)).toBeLessThanOrEqual(1);
    }
  });
});
