import { describe, expect, test } from "vitest";
import { parseBackup } from "../src/domain/backup";
import { draw, evenSizes } from "../src/domain/draw";
import { exampleTournament } from "../src/domain/example";
import { buildKnockout } from "../src/domain/knockout";
import { groupMatches } from "../src/domain/roundRobin";
import { schedule } from "../src/domain/scheduler";
import { toIcs } from "../src/domain/ics";
import { DEFAULT_CONFIG } from "../src/domain/rules";
import { generateSlots } from "../src/domain/slots";
import type { Team } from "../src/domain/types";
import { validate } from "../src/domain/validate";

const team = (id: string, players = 6, unavailable: Team["unavailable"] = []): Team => ({
  id,
  name: id,
  players: Array.from({ length: players }, (_, i) => `p${i}`),
  unavailable,
  unavailableWeekly: [],
});

test("evenSizes splits as evenly as possible", () => {
  expect(evenSizes(10, 2)).toEqual([5, 5]);
  expect(evenSizes(11, 3)).toEqual([4, 4, 3]);
});

describe("validate", () => {
  test("team checks: count, names, squad size", () => {
    const issues = validate({ teams: [team("A", 5), { ...team("b"), name: "a" }], config: DEFAULT_CONFIG });
    expect(issues).toEqual([
      { code: "tooFewTeams", count: 2 },
      { code: "duplicateName", name: "a" },
      { code: "playerCount", team: "A", count: 5 },
    ]);
  });

  test("schedule checks: slot totals, per-team free slots, stale draw", () => {
    const teams = [team("a", 6, [{ start: "2026-11-01T00:00", end: "2026-11-01T23:59" }]), team("b"), team("c")];
    const slots = generateSlots([{ start: "2026-11-01T18:00", end: "2026-11-01T20:30" }], DEFAULT_CONFIG);
    const match = (id: string, h: string, a: string) => ({
      id, stage: "group" as const, groupId: "A", home: { teamId: h }, away: { teamId: a },
    });
    const matches = [match("1", "a", "b"), match("2", "a", "c"), match("3", "b", "c"), match("4", "b", "a")];
    const issues = validate({
      teams,
      config: DEFAULT_CONFIG,
      groups: [{ id: "A", name: "A", teamIds: ["a", "b"] }],
      matches,
      slots,
    });
    expect(issues).toEqual([
      { code: "drawStale" },
      { code: "notEnoughSlots", needed: 4, available: 3 },
      { code: "teamNotEnoughFreeSlots", team: "a", needed: 3, available: 0 },
    ]);
  });
});

test("ics: floating local times, escaping, CRLF, folding", () => {
  const ics = toIcs(
    [{ uid: "m1@t", start: "2026-11-01T18:00", end: "2026-11-01T18:45", summary: "A, B; C " + "x".repeat(80) }],
    new Date(Date.UTC(2026, 9, 20, 12, 0, 0)),
  );
  expect(ics).toContain("DTSTART:20261101T180000\r\n");
  expect(ics).toContain("DTEND:20261101T184500\r\n");
  expect(ics).toContain("DTSTAMP:20261020T120000Z\r\n");
  expect(ics).toContain("SUMMARY:A\\, B\\; C");
  expect(ics.split("\r\n").every((l) => l.length <= 75)).toBe(true);
  expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
});

describe("parseBackup", () => {
  test("round-trips data and fills missing fields with defaults", () => {
    const data = parseBackup(JSON.stringify({ teams: [{ id: "a", name: "A", players: [], unavailable: [] }], config: { seed: 9 } }));
    expect(data.teams[0]!.unavailableWeekly).toEqual([]);
    expect(data.config).toEqual({ ...DEFAULT_CONFIG, seed: 9 });
    expect(data.matches).toEqual([]);
  });

  test("rejects non-tournament files with a readable reason", () => {
    expect(() => parseBackup("not json")).toThrow("JSON");
    expect(() => parseBackup("[]")).toThrow("format");
    expect(() => parseBackup(JSON.stringify({ teams: [{ name: 1 }] }))).toThrow("équipe n°1");
    expect(() => parseBackup(JSON.stringify({ pitchWindows: [{ start: 1 }] }))).toThrow("terrain");
  });
});

test("example tournament validates and schedules completely", () => {
  const { teams, pitchWindows } = exampleTournament(new Date(2026, 9, 20));
  expect(validate({ teams, config: DEFAULT_CONFIG })).toEqual([]);
  const groups = draw(teams.map((x) => x.id), DEFAULT_CONFIG.seed);
  const matches = [...groups.flatMap(groupMatches), ...buildKnockout(groups, DEFAULT_CONFIG).matches];
  const slots = generateSlots(pitchWindows, DEFAULT_CONFIG);
  expect(validate({ teams, config: DEFAULT_CONFIG, groups, matches, slots })).toEqual([]);
  expect(schedule({ matches, slots, teams, groups, config: DEFAULT_CONFIG }).unplaced).toEqual([]);
});
