import { expect, test } from "vitest";
import { cellKey, cellsToWindows, gridTimes, windowsToCells, type CellKey } from "../src/domain/weekGrid";

test("grid rows every 30 min from 08:00 to 23:30", () => {
  const times = gridTimes();
  expect(times[0]).toBe("08:00");
  expect(times.at(-1)).toBe("23:30");
  expect(times).toHaveLength(32);
});

test("consecutive squares merge into ranges; gaps split them; midnight stays on the day", () => {
  const cells: CellKey[] = [
    cellKey(2, "18:30"), cellKey(2, "18:00"), cellKey(2, "19:00"), // Tue 18:00–19:30
    cellKey(2, "21:00"), // Tue 21:00–21:30 (gap before)
    cellKey(0, "23:30"), // Sun 23:30–midnight
    cellKey(1, "08:00"), // Mon first
  ];
  expect(cellsToWindows(cells)).toEqual([
    { weekday: 1, from: "08:00", to: "08:30" },
    { weekday: 2, from: "18:00", to: "19:30" },
    { weekday: 2, from: "21:00", to: "21:30" },
    { weekday: 0, from: "23:30", to: "23:59" },
  ]);
});

test("round trip windows → squares → windows", () => {
  const windows = [
    { weekday: 6, from: "10:00", to: "18:00" },
    { weekday: 0, from: "22:00", to: "23:59" },
  ];
  expect(cellsToWindows(windowsToCells(windows, gridTimes()))).toEqual(windows);
  // A range not aligned on the grid keeps only the squares it fully covers.
  expect([...windowsToCells([{ weekday: 2, from: "18:15", to: "19:00" }], gridTimes())]).toEqual(["2|18:30"]);
});
