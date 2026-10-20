import type { WeeklyWindow } from "./types";

/** Weekly availability painted on a grid: one square = one weekday × one time step. Key "weekday|HH:mm". */
export type CellKey = `${number}|${string}`;

const toMin = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const toHhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
/** A square ending at midnight is stored as 23:59 so it stays on the same day. */
const endOf = (min: number) => (min >= 24 * 60 ? "23:59" : toHhmm(min));

/** Start times of the grid rows, e.g. 08:00, 08:30 … 23:30. */
export function gridTimes(from = "08:00", to = "24:00", step = 30): string[] {
  const out: string[] = [];
  for (let m = toMin(from); m + step <= toMin(to); m += step) out.push(toHhmm(m));
  return out;
}

export const cellKey = (weekday: number, time: string): CellKey => `${weekday}|${time}`;

/** Squares → weekly windows, merging consecutive squares of the same day into one range. */
export function cellsToWindows(cells: Iterable<CellKey>, step = 30): WeeklyWindow[] {
  const byDay = new Map<number, number[]>();
  for (const k of cells) {
    const [d, time] = k.split("|");
    byDay.set(Number(d), [...(byDay.get(Number(d)) ?? []), toMin(time!)]);
  }
  const out: WeeklyWindow[] = [];
  for (const [weekday, starts] of [...byDay].sort((a, b) => ((a[0] + 6) % 7) - ((b[0] + 6) % 7))) {
    starts.sort((a, b) => a - b);
    let from = starts[0]!;
    let prev = from;
    for (const s of [...starts.slice(1), Infinity]) {
      if (s === prev + step) {
        prev = s;
        continue;
      }
      out.push({ weekday, from: toHhmm(from), to: endOf(prev + step) });
      from = prev = s;
    }
  }
  return out;
}

/** Weekly windows → the grid squares they fully cover. */
export function windowsToCells(windows: WeeklyWindow[], times: string[], step = 30): Set<CellKey> {
  const cells = new Set<CellKey>();
  for (const w of windows) {
    const to = w.to === "23:59" ? 24 * 60 : toMin(w.to);
    for (const time of times) {
      if (toMin(time) >= toMin(w.from) && toMin(time) + step <= to) cells.add(cellKey(w.weekday, time));
    }
  }
  return cells;
}
