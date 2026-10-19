import { describe, expect, test } from "vitest";
import { draw } from "../src/domain/draw";
import { buildKnockout, knockoutSize, qualifiers, resolveTeam } from "../src/domain/knockout";
import { groupMatches } from "../src/domain/roundRobin";
import { DEFAULT_CONFIG } from "../src/domain/rules";
import { schedule } from "../src/domain/scheduler";
import { generateSlots } from "../src/domain/slots";
import type { Group, Match, Placeholder, TeamRef } from "../src/domain/types";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `t${i + 1}`);
const label = (ref: TeamRef): string => {
  if ("teamId" in ref) return ref.teamId;
  const p: Placeholder = ref.placeholder;
  switch (p.type) {
    case "groupPosition": return `${p.position}${p.groupId}`;
    case "bestRanked": return `best${p.position}#${p.rank}`;
    default: return `${p.type}:${p.matchId}`;
  }
};
const pairs = (ms: Match[], stage: string) => ms.filter((m) => m.stage === stage).map((m) => `${label(m.home)}-${label(m.away)}`);

describe("knockout size and qualifiers (CLAUDE.md table)", () => {
  test.each([
    [3, 2], [4, 2], [5, 4], [6, 4], [7, 4], [8, 4], [9, 8], [10, 8], [12, 8], [16, 8], [24, 16],
  ])("%i teams → %i in the knockout", (teams, size) => {
    expect(knockoutSize(draw(ids(teams), 1))).toBe(size);
  });

  test("9 teams: 3 winners, 3 runners-up, 2 best thirds", () => {
    const q = qualifiers(draw(ids(9), 1));
    expect(q.filter((p) => p.type === "groupPosition" && p.position === 1)).toHaveLength(3);
    expect(q.filter((p) => p.type === "groupPosition" && p.position === 2)).toHaveLength(3);
    expect(q.filter((p) => p.type === "bestRanked")).toEqual([
      { type: "bestRanked", position: 3, rank: 1 },
      { type: "bestRanked", position: 3, rank: 2 },
    ]);
  });
});

describe("buildKnockout", () => {
  test("2 groups → 1A-2B, 1B-2A, third place, final", () => {
    const { matches, bracket } = buildKnockout(draw(ids(8), 1), DEFAULT_CONFIG);
    expect(pairs(matches, "SF")).toEqual(["1A-2B", "1B-2A"]);
    expect(pairs(matches, "THIRD")).toEqual(["loser:SF1-loser:SF2"]);
    expect(pairs(matches, "FINAL")).toEqual(["winner:SF1-winner:SF2"]);
    expect(bracket.map((r) => r.stage)).toEqual(["SF", "THIRD", "FINAL"]);
    expect(buildKnockout(draw(ids(8), 1), { ...DEFAULT_CONFIG, thirdPlaceMatch: false }).matches).toHaveLength(3);
  });

  test("4 groups → same-group teams can only meet in the final", () => {
    const { matches } = buildKnockout(draw(ids(16), 1), DEFAULT_CONFIG);
    const qf = pairs(matches, "QF");
    expect(qf).toHaveLength(4);
    // QF winners meet in SF as (QF1,QF2) and (QF3,QF4): each half holds every group once.
    for (const half of [qf.slice(0, 2), qf.slice(2)]) {
      const groupsInHalf = half.join("-").split("-").map((s) => s.slice(1)).sort();
      expect(groupsInHalf).toEqual(["A", "B", "C", "D"]);
    }
  });

  test("single group of 4 → top 2 play the final; group of 5 → semis 1-4, 2-3", () => {
    expect(pairs(buildKnockout(draw(ids(4), 1), DEFAULT_CONFIG).matches, "FINAL")).toEqual(["1A-2A"]);
    expect(pairs(buildKnockout(draw(ids(5), 1), DEFAULT_CONFIG).matches, "SF")).toEqual(["1A-4A", "2A-3A"]);
  });
});

describe("resolveTeam", () => {
  const groups: Group[] = [
    { id: "A", name: "A", teamIds: ["a1", "a2", "a3"] },
    { id: "B", name: "B", teamIds: ["b1", "b2", "b3"] },
    { id: "C", name: "C", teamIds: ["c1", "c2", "c3"] },
  ];
  // Score each group so that x1 > x2 > x3, with thirds differing by goals conceded.
  const results: Record<string, [number, number]> = {
    "a1-a2": [1, 0], "a1-a3": [1, 0], "a2-a3": [1, 0],
    "b1-b2": [1, 0], "b1-b3": [3, 0], "b2-b3": [3, 0],
    "c1-c2": [1, 0], "c1-c3": [2, 0], "c2-c3": [2, 0],
  };
  const groupStage = groups.flatMap(groupMatches).map((m) => {
    const [h, a] = [label(m.home), label(m.away)];
    const r = results[`${h}-${a}`] ?? [...results[`${a}-${h}`]!].reverse();
    return { ...m, result: { home: r[0]!, away: r[1]! } };
  });

  test("9 teams: best thirds ranked across groups (a3 -2, c3 -4, b3 -6)", () => {
    const best = (rank: number): TeamRef => ({ placeholder: { type: "bestRanked", position: 3, rank } });
    expect([1, 2, 3].map((r) => resolveTeam(best(r), groups, groupStage, DEFAULT_CONFIG))).toEqual(["a3", "c3", "b3"]);
    const gp: TeamRef = { placeholder: { type: "groupPosition", groupId: "B", position: 1 } };
    expect(resolveTeam(gp, groups, groupStage, DEFAULT_CONFIG)).toBe("b1");
  });

  test("undecided until the group is finished", () => {
    const gp: TeamRef = { placeholder: { type: "groupPosition", groupId: "A", position: 1 } };
    const unfinished = groupStage.map((m, i) => (i === 0 ? { ...m, result: undefined } : m));
    expect(resolveTeam(gp, groups, unfinished, DEFAULT_CONFIG)).toBeUndefined();
  });

  test("winner/loser follow results, penalties decide a draw", () => {
    const sf: Match = { id: "SF1", stage: "SF", home: { teamId: "a1" }, away: { teamId: "b1" } };
    const w: TeamRef = { placeholder: { type: "winner", matchId: "SF1" } };
    const l: TeamRef = { placeholder: { type: "loser", matchId: "SF1" } };
    const at = (result?: Match["result"]) => [{ ...sf, result }];
    expect(resolveTeam(w, groups, at(), DEFAULT_CONFIG)).toBeUndefined();
    expect(resolveTeam(w, groups, at({ home: 0, away: 2 }), DEFAULT_CONFIG)).toBe("b1");
    expect(resolveTeam(l, groups, at({ home: 0, away: 2 }), DEFAULT_CONFIG)).toBe("a1");
    expect(resolveTeam(w, groups, at({ home: 1, away: 1 }), DEFAULT_CONFIG)).toBeUndefined();
    expect(resolveTeam(w, groups, at({ home: 1, away: 1, penalties: { home: 4, away: 3 } }), DEFAULT_CONFIG)).toBe("a1");
  });
});

test("end to end: 9 teams drawn, fixtures + knockout scheduled with the final last", () => {
  const groups = draw(ids(9), 3);
  const knockout = buildKnockout(groups, DEFAULT_CONFIG);
  const windows = [1, 2, 3, 4, 5].map((d) => ({ start: `2026-11-0${d}T14:00`, end: `2026-11-0${d}T22:20` }));
  const slots = generateSlots(windows, DEFAULT_CONFIG);
  const result = schedule({
    matches: [...groups.flatMap(groupMatches), ...knockout.matches],
    slots,
    teams: ids(9).map((id) => ({ id, name: id, players: [], unavailable: [] })),
    groups,
    config: DEFAULT_CONFIG,
  });
  expect(result.unplaced).toEqual([]);
  const start = (m: Match) => slots.find((s) => s.id === m.slotId)!.start;
  const final = result.matches.find((m) => m.id === "FINAL")!;
  expect(result.matches.every((m) => m === final || start(m) < start(final))).toBe(true);
});
