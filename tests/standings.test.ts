import { describe, expect, test } from "vitest";
import { DEFAULT_CONFIG } from "../src/domain/rules";
import { rankAcrossGroups, standings } from "../src/domain/standings";
import type { Config, Group, Match, MatchResult } from "../src/domain/types";

let n = 0;
const played = (groupId: string, home: string, away: string, h: number, a: number, extra: Partial<MatchResult> = {}): Match => ({
  id: `m${++n}`,
  stage: "group",
  groupId,
  home: { teamId: home },
  away: { teamId: away },
  result: { home: h, away: a, ...extra },
});
const order = (g: Group, ms: Match[], config = DEFAULT_CONFIG) => standings(g, ms, config).map((s) => s.teamId);

describe("standings", () => {
  const A: Group = { id: "A", name: "A", teamIds: ["a", "b", "c", "d"] };

  test("points, goals and W/D/L are tallied; unplayed and other-group matches ignored", () => {
    const ms = [
      played("A", "a", "b", 2, 0),
      played("A", "c", "d", 1, 1),
      played("B", "a", "x", 9, 0),
      { id: "u", stage: "group", groupId: "A", home: { teamId: "a" }, away: { teamId: "c" } } as Match,
    ];
    const table = standings(A, ms, DEFAULT_CONFIG);
    expect(table[0]).toMatchObject({ teamId: "a", played: 1, won: 1, points: 3, goalsFor: 2, goalDifference: 2 });
    expect(table.find((s) => s.teamId === "c")).toMatchObject({ drawn: 1, points: 1 });
    expect(table.at(-1)).toMatchObject({ teamId: "b", lost: 1, points: 0 });
  });

  test("head-to-head beats overall goal difference", () => {
    // a and b both on 6 pts; b has the better GD overall, but a beat b.
    const ms = [
      played("A", "a", "b", 1, 0),
      played("A", "a", "c", 0, 1),
      played("A", "a", "d", 1, 0),
      played("A", "b", "c", 5, 0),
      played("A", "b", "d", 5, 0),
      played("A", "c", "d", 0, 0),
    ];
    expect(order(A, ms).slice(0, 2)).toEqual(["a", "b"]);
    const gdFirst: Config = { ...DEFAULT_CONFIG, tieBreakers: ["points", "goalDifference", "lots"] };
    expect(order(A, ms, gdFirst).slice(0, 2)).toEqual(["b", "a"]);
  });

  test("three-way tie resolved by head-to-head mini-table among the tied teams", () => {
    // a, b, c all 6 pts (circular wins), d 0 pts. Mini-table GD: a +2, b 0, c -2 — even though c has the best overall GD.
    const ms = [
      played("A", "a", "b", 3, 0),
      played("A", "b", "c", 3, 0),
      played("A", "c", "a", 1, 0),
      played("A", "a", "d", 1, 0),
      played("A", "b", "d", 1, 0),
      played("A", "c", "d", 9, 0),
    ];
    expect(order(A, ms)).toEqual(["a", "b", "c", "d"]);
  });

  test("fair play then seeded lots break full ties", () => {
    const B: Group = { id: "B", name: "B", teamIds: ["p", "q"] };
    const ms = [played("B", "p", "q", 1, 1, { cards: { home: { yellow: 0, red: 1 }, away: { yellow: 2, red: 0 } } })];
    const table = standings(B, ms, DEFAULT_CONFIG);
    expect(table.map((s) => [s.teamId, s.fairPlay])).toEqual([["q", -2], ["p", -3]]);

    const clean = [played("B", "p", "q", 0, 0)];
    const seeds = new Set(Array.from({ length: 20 }, (_, seed) => order(B, clean, { ...DEFAULT_CONFIG, seed })[0]));
    expect(seeds).toEqual(new Set(["p", "q"])); // lots actually vary with the seed…
    expect(order(B, clean)).toEqual(order(B, clean)); // …and are reproducible
  });
});

describe("rankAcrossGroups", () => {
  test("compares points per match when group sizes differ", () => {
    const row = (teamId: string, played: number, points: number, goalDifference = 0) => ({
      teamId, played, points, goalDifference, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, fairPlay: 0,
    });
    // y and z (3 pts in 2 matches = 1.5/match) rank above x (4 pts in 3 = 1.33); z wins on goal difference.
    const ranked = rankAcrossGroups([row("x", 3, 4), row("y", 2, 3), row("z", 2, 3, 2)], DEFAULT_CONFIG);
    expect(ranked.map((r) => r.teamId)).toEqual(["z", "y", "x"]);
  });
});
