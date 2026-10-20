import { addMinutes, areIntervalsOverlapping, eachDayOfInterval, format, getDay, isAfter, isBefore, parseISO } from "date-fns";
import { slotMinutes } from "./rules";
import type { Config, Slot, Team, TimeWindow, WeeklyWindow } from "./types";

export const toLocalIso = (d: Date): string => format(d, "yyyy-MM-dd'T'HH:mm");

/** Cut pitch availability windows into consecutive slots (one per pitch); partial slots at a window's end are dropped. */
export function generateSlots(windows: TimeWindow[], config: Config): Slot[] {
  const len = slotMinutes(config);
  const slots = new Map<string, Slot>(); // keyed by id so overlapping windows don't duplicate slots
  for (const w of windows) {
    const end = parseISO(w.end);
    for (let start = parseISO(w.start); !isAfter(addMinutes(start, len), end); start = addMinutes(start, len)) {
      for (let pitch = 1; pitch <= config.pitches; pitch++) {
        const iso = toLocalIso(start);
        slots.set(`${iso}#${pitch}`, { id: `${iso}#${pitch}`, start: iso, end: toLocalIso(addMinutes(start, len)), pitch });
      }
    }
  }
  return [...slots.values()].sort((a, b) => a.start.localeCompare(b.start) || a.pitch - b.pitch);
}

/** Weekly rules as concrete windows on the given dates ("yyyy-MM-dd"). */
const onDays = (rules: WeeklyWindow[], days: string[]): TimeWindow[] =>
  days.flatMap((d) =>
    rules.filter((w) => getDay(parseISO(d)) === w.weekday).map((w) => ({ start: `${d}T${w.from}`, end: `${d}T${w.to}` })),
  );

/** A weekly template ("every Tuesday 18:00–22:00") turned into windows for every matching date from → to (inclusive). */
export function expandWeekly(rules: WeeklyWindow[], from: string, to: string): TimeWindow[] {
  if (from > to) return [];
  const days = eachDayOfInterval({ start: parseISO(from), end: parseISO(to) }).map((d) => format(d, "yyyy-MM-dd"));
  return onDays(rules, days).sort((a, b) => a.start.localeCompare(b.start));
}

/**
 * Predicate "is this team free during this slot?": not in any unavailable window (dated or weekly) and,
 * when the team only gave weekly availability, entirely inside one of those windows.
 */
export function freeChecker(team: Team, slots: Slot[]): (slot: Slot) => boolean {
  const days = [...new Set(slots.map((s) => s.start.slice(0, 10)))];
  const interval = (w: TimeWindow) => ({ start: parseISO(w.start), end: parseISO(w.end) });
  const busy = [...team.unavailable, ...onDays(team.unavailableWeekly, days)].map(interval);
  const available = onDays(team.availableWeekly ?? [], days).map(interval);
  const restricted = (team.availableWeekly ?? []).length > 0;
  return (s) => {
    const slot = interval(s);
    if (busy.some((w) => areIntervalsOverlapping(w, slot))) return false;
    return !restricted || available.some((w) => !isBefore(slot.start, w.start) && !isAfter(slot.end, w.end));
  };
}
