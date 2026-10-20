import { freeChecker } from "./slots";
import type { Config, Group, Match, Slot, Team } from "./types";

export type Issue =
  | { code: "tooFewTeams"; count: number }
  | { code: "emptyName" }
  | { code: "duplicateName"; name: string }
  | { code: "playerCount"; team: string; count: number }
  | { code: "drawStale" }
  | { code: "notEnoughSlots"; needed: number; available: number }
  | { code: "teamNotEnoughFreeSlots"; team: string; needed: number; available: number };

/** Warnings are shown but don't block; every other issue does. */
export const isWarning = (i: Issue) => i.code === "playerCount";

type Input = { teams: Team[]; config: Config; groups?: Group[]; matches?: Match[]; slots?: Slot[] };

/** Checks before drawing (teams only) or before scheduling (pass groups, matches and slots too). */
export function validate({ teams, config, groups, matches, slots }: Input): Issue[] {
  const issues: Issue[] = [];
  if (teams.length < 3) issues.push({ code: "tooFewTeams", count: teams.length });
  if (teams.some((t) => !t.name.trim())) issues.push({ code: "emptyName" });
  const seen = new Set<string>();
  for (const t of teams) {
    const key = t.name.trim().toLocaleLowerCase("fr");
    if (key && seen.has(key)) issues.push({ code: "duplicateName", name: t.name.trim() });
    seen.add(key);
  }
  for (const t of teams) {
    if (t.players.length < config.playersOnPitch || t.players.length > config.maxSquadSize) {
      issues.push({ code: "playerCount", team: t.name, count: t.players.length });
    }
  }

  if (groups) {
    const drawn = new Set(groups.flatMap((g) => g.teamIds));
    if (drawn.size !== teams.length || teams.some((t) => !drawn.has(t.id))) issues.push({ code: "drawStale" });
  }

  if (matches && slots) {
    if (slots.length < matches.length) {
      issues.push({ code: "notEnoughSlots", needed: matches.length, available: slots.length });
    }
    for (const t of teams) {
      const needed = matches.filter(
        (m) => m.stage === "group" && [m.home, m.away].some((r) => "teamId" in r && r.teamId === t.id),
      ).length;
      const isFree = freeChecker(t, slots);
      // Several pitches at the same time still count as one chance to play.
      const available = new Set(slots.filter(isFree).map((s) => s.start)).size;
      if (available < needed) issues.push({ code: "teamNotEnoughFreeSlots", team: t.name, needed, available });
    }
  }
  return issues;
}
