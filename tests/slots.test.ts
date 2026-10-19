import { expect, test } from "vitest";
import { DEFAULT_CONFIG } from "../src/domain/rules";
import { generateSlots } from "../src/domain/slots";

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
