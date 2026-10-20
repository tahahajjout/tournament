import { DEFAULT_CONFIG } from "./rules";
import type { AvailabilityWarning, Unplaced } from "./scheduler";
import type { Bracket, Config, Group, Match, Slot, Team, TimeWindow, WeeklyWindow } from "./types";

/** Everything that makes up a tournament; what the store persists and what JSON backups contain. */
export type TournamentData = {
  teams: Team[];
  pitchWindows: TimeWindow[];
  /** The painted weekly template used to fill pitch windows. */
  pitchWeek: WeeklyWindow[];
  config: Config;
  seeds: string[];
  groups: Group[];
  matches: Match[];
  bracket: Bracket;
  slots: Slot[];
  unplaced: Unplaced[];
  warnings: AvailabilityWarning[];
};

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isWindow = (v: unknown) => isObj(v) && typeof v.start === "string" && typeof v.end === "string";
const arr = (v: unknown, name: string): unknown[] => {
  if (v === undefined) return [];
  if (!Array.isArray(v)) throw new Error(`"${name}" doit être une liste`);
  return v;
};

/** Parse an imported backup. Throws an Error with a readable message when the file isn't a tournament. */
export function parseBackup(text: string): TournamentData {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("ce n'est pas du JSON");
  }
  if (!isObj(raw)) throw new Error("format inattendu");

  const teams = arr(raw.teams, "teams").map((t, i) => {
    if (!isObj(t) || typeof t.id !== "string" || typeof t.name !== "string") throw new Error(`équipe n°${i + 1} invalide`);
    const players = arr(t.players, "players");
    const unavailable = arr(t.unavailable, "unavailable");
    if (!players.every((p) => typeof p === "string") || !unavailable.every(isWindow)) {
      throw new Error(`équipe « ${t.name} » invalide`);
    }
    return { ...t, players, unavailable, unavailableWeekly: arr(t.unavailableWeekly, "unavailableWeekly") } as Team;
  });
  const pitchWindows = arr(raw.pitchWindows, "pitchWindows");
  if (!pitchWindows.every(isWindow)) throw new Error("créneaux du terrain invalides");

  return {
    teams,
    pitchWindows: pitchWindows as TimeWindow[],
    pitchWeek: arr(raw.pitchWeek, "pitchWeek") as WeeklyWindow[],
    config: { ...DEFAULT_CONFIG, ...(isObj(raw.config) ? raw.config : {}) },
    seeds: arr(raw.seeds, "seeds") as string[],
    groups: arr(raw.groups, "groups") as Group[],
    matches: arr(raw.matches, "matches") as Match[],
    bracket: arr(raw.bracket, "bracket") as Bracket,
    slots: arr(raw.slots, "slots") as Slot[],
    unplaced: arr(raw.unplaced, "unplaced") as Unplaced[],
    warnings: arr(raw.warnings, "warnings") as AvailabilityWarning[],
  };
}
