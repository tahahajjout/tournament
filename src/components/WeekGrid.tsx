import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { WeeklyWindow } from "../domain/types";
import { cellKey, cellsToWindows, gridTimes, windowsToCells, type CellKey } from "../domain/weekGrid";
import { formatWeekly, t, weekdayName } from "../i18n";

// Monday first, as on French calendars.
const DAYS = [1, 2, 3, 4, 5, 6, 0];
const TIMES = gridTimes();

type Props = { value: WeeklyWindow[]; onChange: (v: WeeklyWindow[]) => void };

/**
 * A week as squares (days × half-hours). Click a square to toggle it, or press and drag to paint several:
 * the first square decides whether the drag fills or clears. Arrow keys + Space work too.
 */
export function WeekGrid({ value, onChange }: Props) {
  const cells = useMemo(() => windowsToCells(value, TIMES), [value]);
  const [draft, setDraft] = useState<Set<CellKey> | null>(null);
  const [focus, setFocus] = useState<CellKey>(cellKey(1, "18:00"));
  const paint = useRef<{ fill: boolean; cells: Set<CellKey> } | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const commit = useRef(onChange);
  commit.current = onChange;
  const shown = draft ?? cells;

  useEffect(() => {
    const end = () => {
      if (!paint.current) return;
      commit.current(cellsToWindows(paint.current.cells));
      paint.current = null;
      setDraft(null);
    };
    addEventListener("pointerup", end);
    addEventListener("pointercancel", end);
    return () => {
      removeEventListener("pointerup", end);
      removeEventListener("pointercancel", end);
    };
  }, []);

  const paintCell = (k: CellKey) => {
    const p = paint.current;
    if (!p || p.cells.has(k) === p.fill) return;
    p.cells = new Set(p.cells);
    if (p.fill) p.cells.add(k);
    else p.cells.delete(k);
    setDraft(p.cells);
  };
  const start = (e: PointerEvent, k: CellKey) => {
    e.preventDefault();
    paint.current = { fill: !shown.has(k), cells: new Set(shown) };
    setFocus(k);
    paintCell(k);
  };
  // Pointer capture keeps touch events on the first square, so find the square under the finger instead.
  const move = (e: PointerEvent) => {
    if (!paint.current) return;
    const k = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.dataset.cell;
    if (k) paintCell(k as CellKey);
  };
  const key = (e: KeyboardEvent, d: number, time: string) => {
    const [di, ti] = [DAYS.indexOf(d), TIMES.indexOf(time)];
    const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const next = new Set(shown);
      const k = cellKey(d, time);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      onChange(cellsToWindows(next));
    } else if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key]!;
      const nd = DAYS[Math.min(6, Math.max(0, di + dx))]!;
      const nt = TIMES[Math.min(TIMES.length - 1, Math.max(0, ti + dy))]!;
      setFocus(cellKey(nd, nt));
      grid.current?.querySelector<HTMLElement>(`[data-cell="${cellKey(nd, nt)}"]`)?.focus();
    }
  };

  return (
    <div className="space-y-3">
      <div
        ref={grid}
        role="grid"
        aria-label={t.week.gridLabel}
        className="grid grid-cols-[2.75rem_repeat(7,minmax(0,1fr))] gap-[3px] select-none"
        onPointerMove={move}
      >
        <span />
        {DAYS.map((d) => (
          <span key={d} className="pb-1 text-center text-sm font-bold first-letter:uppercase">
            {weekdayName(d).slice(0, 3)}
          </span>
        ))}
        {TIMES.map((time) => (
          <div key={time} role="row" className="contents">
            <span className={`-mt-2 pr-1 text-right text-xs tabular-nums ${time.endsWith(":00") ? "" : "invisible"}`}>
              {time.slice(0, 2)}h
            </span>
            {DAYS.map((d) => {
              const k = cellKey(d, time);
              const on = shown.has(k);
              return (
                <button
                  key={k}
                  type="button"
                  role="gridcell"
                  data-cell={k}
                  aria-pressed={on}
                  aria-label={`${weekdayName(d)} ${time}`}
                  tabIndex={k === focus ? 0 : -1}
                  onPointerDown={(e) => start(e, k)}
                  onKeyDown={(e) => key(e, d, time)}
                  className={`h-6 touch-none transition-colors duration-100 ${
                    on ? "bg-pitch hover:bg-pitch-dark" : "bg-turf hover:bg-pitch/30"
                  } ${time.endsWith(":00") ? "mt-[3px]" : ""}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="min-w-0 flex-1 text-ink/80">{value.length ? value.map(formatWeekly).join(" · ") : t.week.gridEmpty}</p>
        {value.length > 0 && (
          <button type="button" className="btn btn-quiet min-h-9 px-3" onClick={() => onChange([])}>
            {t.week.gridClear}
          </button>
        )}
      </div>
    </div>
  );
}
