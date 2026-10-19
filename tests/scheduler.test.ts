import { addMinutes, areIntervalsOverlapping, parseISO } from "date-fns";
import { describe, expect, test } from "vitest";
import { groupMatches } from "../src/domain/roundRobin";
import { DEFAULT_CONFIG } from "../src/domain/rules";
import { schedule, type ScheduleInput } from "../src/domain/scheduler";
import { generateSlots } from "../src/domain/slots";
import type { Group, Match, Team, TimeWindow } from "../src/domain/types";

const team = (id: string, unavailable: TimeWindow[] = []): Team => ({ id, name: id, players: [], unavailable });
const day = (d: number, from: string, to: string): TimeWindow => ({
  start: `2026-11-0${d}T${from}`,
  end: `2026-11-0${d}T${to}`,
});
const gp = (groupId: string, position: number) => ({ placeholder: { type: "groupPosition" as const, groupId, position } });
const ko = (type: "winner" | "loser", matchId: string) => ({ placeholder: { type, matchId } });

const teamsOf = (m: Match) => [m.home, m.away].flatMap((r) => ("teamId" in r ? [r.teamId] : []));

/** Asserts every hard constraint on the placed matches of a result. */
function checkHardConstraints(input: ScheduleInput, matches: Match[]) {
  const slotById = new Map(input.slots.map((s) => [s.id, s]));
  const placed = matches.filter((m) => m.slotId);
  expect(new Set(placed.map((m) => m.slotId)).size).toBe(placed.length);

  for (const t of input.teams) {
    const own = placed.filter((m) => teamsOf(m).includes(t.id)).map((m) => slotById.get(m.slotId!)!);
    for (const s of own) {
      for (const w of t.unavailable) {
        expect(areIntervalsOverlapping(
          { start: parseISO(w.start), end: parseISO(w.end) },
          { start: parseISO(s.start), end: parseISO(s.end) },
        )).toBe(false);
      }
      const others = own.filter((o) => o !== s);
      for (const o of others) {
        const restEnd = addMinutes(parseISO(o.end), input.config.minRestMinutes);
        const apart = parseISO(s.start) >= restEnd || addMinutes(parseISO(s.end), input.config.minRestMinutes) <= parseISO(o.start);
        expect(apart).toBe(true);
      }
      expect(own.filter((o) => o.start.slice(0, 10) === s.start.slice(0, 10)).length).toBeLessThanOrEqual(
        input.config.maxMatchesPerTeamPerDay,
      );
    }
  }
}

function eightTeams(unavailable: Record<string, TimeWindow[]> = {}): ScheduleInput {
  const groups: Group[] = [
    { id: "A", name: "A", teamIds: ["a1", "a2", "a3", "a4"] },
    { id: "B", name: "B", teamIds: ["b1", "b2", "b3", "b4"] },
  ];
  const matches: Match[] = [
    ...groups.flatMap(groupMatches),
    { id: "SF1", stage: "SF", home: gp("A", 1), away: gp("B", 2) },
    { id: "SF2", stage: "SF", home: gp("B", 1), away: gp("A", 2) },
    { id: "THIRD", stage: "THIRD", home: ko("loser", "SF1"), away: ko("loser", "SF2") },
    { id: "FINAL", stage: "FINAL", home: ko("winner", "SF1"), away: ko("winner", "SF2") },
  ];
  const windows = [1, 2, 3, 4].map((d) => day(d, "14:00", "22:20"));
  return {
    matches,
    slots: generateSlots(windows, DEFAULT_CONFIG),
    teams: groups.flatMap((g) => g.teamIds).map((id) => team(id, unavailable[id])),
    groups,
    config: DEFAULT_CONFIG,
  };
}

describe("schedule", () => {
  test("8 teams, 2 groups, plenty of slots → full schedule, knockouts after groups, final last", () => {
    const input = eightTeams({ a1: [day(1, "00:00", "23:59")], b3: [day(2, "14:00", "18:00")] });
    const { matches, unplaced, warnings } = schedule(input);
    expect(unplaced).toEqual([]);
    expect(warnings).toEqual([]);
    expect(matches.every((m) => m.slotId)).toBe(true);
    checkHardConstraints(input, matches);

    const start = (id: string) => input.slots.find((s) => s.id === matches.find((m) => m.id === id)!.slotId)!.start;
    const lastGroup = matches.filter((m) => m.stage === "group").map((m) => start(m.id)).sort().at(-1)!;
    expect(start("SF1") > lastGroup && start("SF2") > lastGroup).toBe(true);
    for (const m of matches) if (m.id !== "FINAL") expect(start("FINAL") > start(m.id)).toBe(true);
  });

  test("6 teams where two teams share no free slot → clear conflict for that match only", () => {
    const groups: Group[] = [
      { id: "A", name: "A", teamIds: ["t1", "t2", "t3"] },
      { id: "B", name: "B", teamIds: ["t4", "t5", "t6"] },
    ];
    const input: ScheduleInput = {
      matches: groups.flatMap(groupMatches),
      slots: generateSlots([day(1, "18:00", "23:00"), day(2, "18:00", "23:00")], DEFAULT_CONFIG),
      teams: [
        team("t1", [day(1, "00:00", "23:59")]),
        team("t2", [day(2, "00:00", "23:59")]),
        ...["t3", "t4", "t5", "t6"].map((id) => team(id)),
      ],
      groups,
      config: DEFAULT_CONFIG,
    };
    const { matches, unplaced } = schedule(input);
    expect(unplaced).toHaveLength(1);
    expect(unplaced[0]!.reason).toBe("noCommonFreeSlot");
    expect([...unplaced[0]!.teamIds].sort()).toEqual(["t1", "t2"]);
    expect(matches.filter((m) => m.slotId)).toHaveLength(5);
    checkHardConstraints(input, matches);
  });

  test("not enough slots → best partial schedule plus noSlotLeft for the rest", () => {
    const group: Group = { id: "A", name: "A", teamIds: ["t1", "t2", "t3", "t4"] };
    const input: ScheduleInput = {
      matches: groupMatches(group),
      slots: generateSlots([day(1, "18:00", "20:30")], DEFAULT_CONFIG),
      teams: group.teamIds.map((id) => team(id)),
      groups: [group],
      config: DEFAULT_CONFIG,
    };
    const { matches, unplaced } = schedule(input);
    // 3 slots, but slot 3 could only host the slot-1 pair again (everyone else needs rest) → 2 is the maximum.
    expect(matches.filter((m) => m.slotId)).toHaveLength(2);
    expect(unplaced).toHaveLength(4);
    expect(unplaced.every((u) => u.reason === "noSlotLeft")).toBe(true);
    checkHardConstraints(input, matches);
  });

  test("placeholder with no slot where every possible team is free → best slot + warning", () => {
    const group: Group = { id: "A", name: "A", teamIds: ["t1", "t2", "t3", "t4"] };
    const input: ScheduleInput = {
      matches: [...groupMatches(group), { id: "FINAL", stage: "FINAL", home: gp("A", 1), away: gp("A", 2) }],
      slots: generateSlots(
        [day(1, "18:00", "23:00"), day(2, "18:00", "23:00"), day(3, "18:00", "19:00")],
        DEFAULT_CONFIG,
      ),
      teams: [
        team("t1", [day(3, "00:00", "23:59")]),
        team("t2", [day(1, "21:00", "23:59"), day(2, "21:00", "23:59")]),
        team("t3"),
        team("t4"),
      ],
      groups: [group],
      config: DEFAULT_CONFIG,
    };
    const { matches, unplaced, warnings } = schedule(input);
    expect(unplaced).toEqual([]);
    expect(matches.find((m) => m.id === "FINAL")!.slotId).toBe("2026-11-03T18:00#1");
    expect(warnings).toEqual([{ matchId: "FINAL", unavailableTeamIds: ["t1"] }]);
  });

  test("same input → identical calendar", () => {
    const input = eightTeams({ a2: [day(2, "00:00", "23:59")] });
    expect(schedule(input)).toEqual(schedule(input));
  });
});
