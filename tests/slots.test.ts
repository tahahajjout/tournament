import { describe, expect, test } from "vitest";
import { DEFAULT_CONFIG } from "../src/domain/rules";
import { expandWeekly, freeChecker, generateSlots } from "../src/domain/slots";

test("50-min slots, partial slot at the end dropped", () => {
  const slots = generateSlots([{ start: "2026-11-01T18:00", end: "2026-11-01T21:00" }], DEFAULT_CONFIG);
  expect(slots.map((s) => [s.start, s.end])).toEqual([
    ["2026-11-01T18:00", "2026-11-01T18:50"],
    ["2026-11-01T18:50", "2026-11-01T19:40"],
    ["2026-11-01T19:40", "2026-11-01T20:30"],
  ]);
});

test("window exactly fitting slots keeps the last one; buffer changes slot length", () => {
  expect(generateSlots([{ start: "2026-11-01T18:00", end: "2026-11-01T19:40" }], DEFAULT_CONFIG)).toHaveLength(2);
  const noBuffer = { ...DEFAULT_CONFIG, bufferMinutes: 0 };
  expect(generateSlots([{ start: "2026-11-01T18:00", end: "2026-11-01T19:30" }], noBuffer)).toHaveLength(2);
});

test("one slot per pitch, sorted, overlapping windows not duplicated", () => {
  const slots = generateSlots(
    [
      { start: "2026-11-02T18:00", end: "2026-11-02T18:50" },
      { start: "2026-11-01T18:00", end: "2026-11-01T18:50" },
      { start: "2026-11-01T18:00", end: "2026-11-01T18:50" },
    ],
    { ...DEFAULT_CONFIG, pitches: 2 },
  );
  expect(slots.map((s) => s.id)).toEqual([
    "2026-11-01T18:00#1",
    "2026-11-01T18:00#2",
    "2026-11-02T18:00#1",
    "2026-11-02T18:00#2",
  ]);
});

describe("weekly templates", () => {
  // 2026-11-03 is a Tuesday (getDay 2), 2026-11-07 a Saturday (6).
  const template = [
    { weekday: 2, from: "18:00", to: "22:00" },
    { weekday: 6, from: "10:00", to: "12:00" },
  ];

  test("expandWeekly fills every matching date in the range", () => {
    expect(expandWeekly(template, "2026-11-01", "2026-11-14")).toEqual([
      { start: "2026-11-03T18:00", end: "2026-11-03T22:00" },
      { start: "2026-11-07T10:00", end: "2026-11-07T12:00" },
      { start: "2026-11-10T18:00", end: "2026-11-10T22:00" },
      { start: "2026-11-14T10:00", end: "2026-11-14T12:00" },
    ]);
    expect(expandWeekly(template, "2026-11-14", "2026-11-01")).toEqual([]);
  });

  test("a team with weekly availability is only free fully inside it", () => {
    const team = { id: "t", name: "t", players: [], unavailable: [], unavailableWeekly: [], availableWeekly: [template[0]!] };
    const slots = generateSlots(
      [
        { start: "2026-11-03T21:00", end: "2026-11-03T23:00" }, // Tuesday: 21:00 fits, 21:50 overruns 22:00
        { start: "2026-11-04T18:00", end: "2026-11-04T19:00" }, // Wednesday: not in the template
      ],
      DEFAULT_CONFIG,
    );
    const free = freeChecker(team, slots);
    expect(slots.map((s) => [s.start, free(s)])).toEqual([
      ["2026-11-03T21:00", true],
      ["2026-11-03T21:50", false],
      ["2026-11-04T18:00", false],
    ]);
    expect(freeChecker({ ...team, availableWeekly: [] }, slots)(slots[2]!)).toBe(true);
  });
});
