import { addMinutes, format, isAfter, parseISO } from "date-fns";
import { slotMinutes } from "./rules";
import type { Config, Slot, TimeWindow } from "./types";

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
