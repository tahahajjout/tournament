import { addMinutes, areIntervalsOverlapping, format, parseISO } from "date-fns";
import type { Config, Group, Match, Slot, Stage, Team, TeamRef } from "./types";

export type Unplaced = {
  matchId: string;
  /** noCommonFreeSlot: the known teams are never free at the same time. noSlotLeft: no slot left that respects rest/day/order rules. */
  reason: "noCommonFreeSlot" | "noSlotLeft";
  teamIds: string[];
};
/** A placeholder match was put in a slot where some of the teams that could fill it are unavailable. */
export type AvailabilityWarning = { matchId: string; unavailableTeamIds: string[] };
export type ScheduleResult = { matches: Match[]; unplaced: Unplaced[]; warnings: AvailabilityWarning[] };

export type ScheduleInput = { matches: Match[]; slots: Slot[]; teams: Team[]; groups: Group[]; config: Config };

const STAGE_ORDER: Record<Stage, number> = { group: 0, R16: 1, QF: 2, SF: 3, THIRD: 4, FINAL: 5 };
/** A team plays at most one match per knockout level; third place and final share one. */
const LEVEL: Record<Stage, number> = { group: 0, R16: 1, QF: 2, SF: 3, THIRD: 4, FINAL: 4 };
const MAX_NODES = 5000;

type S = Slot & { startMs: number; endMs: number; restEndMs: number; day: string };
type Info = {
  match: Match;
  /** Every team that could play this match. */
  teams: string[];
  /** Teams known for sure (group matches, resolved knockout matches). */
  concrete: string[];
  /** Allowed slots, best first: concrete teams free, then fewest unavailable possible teams. */
  candidates: S[];
  deps: { id: string; rest: boolean }[];
};

/**
 * Assign matches to slots: backtracking, most-constrained match first, bounded by MAX_NODES.
 * If no full schedule is found, the deepest partial one is completed greedily and the rest reported as unplaced.
 * Deterministic: same input → same output.
 */
export function schedule({ matches, slots, teams, groups, config }: ScheduleInput): ScheduleResult {
  const byId = new Map(matches.map((m) => [m.id, m]));
  const possible = (ref: TeamRef): string[] => {
    if ("teamId" in ref) return [ref.teamId];
    const p = ref.placeholder;
    switch (p.type) {
      case "groupPosition":
        return groups.find((g) => g.id === p.groupId)?.teamIds ?? [];
      case "bestRanked":
        return groups.filter((g) => g.teamIds.length >= p.position).flatMap((g) => g.teamIds);
      case "winner":
      case "loser": {
        const m = byId.get(p.matchId);
        return m ? [...new Set([...possible(m.home), ...possible(m.away)])] : [];
      }
    }
  };

  const ss: S[] = slots.map((s) => ({
    ...s,
    startMs: parseISO(s.start).getTime(),
    endMs: parseISO(s.end).getTime(),
    restEndMs: addMinutes(parseISO(s.end), config.minRestMinutes).getTime(),
    day: format(parseISO(s.start), "yyyy-MM-dd"),
  }));
  const unavailability = new Map(
    teams.map((t) => [t.id, t.unavailable.map((w) => ({ start: parseISO(w.start), end: parseISO(w.end) }))]),
  );
  const isUnavailable = (teamId: string, s: S) =>
    (unavailability.get(teamId) ?? []).some((w) => areIntervalsOverlapping(w, { start: s.startMs, end: s.endMs }));

  const ordered = [...matches].sort(
    (a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage] || (a.round ?? 0) - (b.round ?? 0),
  );
  const infos = ordered.map((m): Info => {
    const concrete = [m.home, m.away].flatMap((r) => ("teamId" in r ? [r.teamId] : []));
    const all = [...new Set([...possible(m.home), ...possible(m.away)])];
    const unavailableCount = new Map(ss.map((s) => [s.id, all.filter((t) => isUnavailable(t, s)).length]));
    const dir = m.stage === "FINAL" ? -1 : 1; // final as late as possible, everything else as early as possible
    const candidates = ss
      .filter((s) => concrete.every((t) => !isUnavailable(t, s)))
      .sort((a, b) => unavailableCount.get(a.id)! - unavailableCount.get(b.id)! || dir * (a.startMs - b.startMs));
    const deps =
      m.stage === "group"
        ? []
        : ordered
            .filter((o) => STAGE_ORDER[o.stage] < STAGE_ORDER[m.stage])
            .map((o) => ({ id: o.id, rest: !(m.stage === "FINAL" && o.stage === "THIRD") }));
    return { match: m, teams: all, concrete, candidates, deps };
  });
  const infoById = new Map(infos.map((i) => [i.match.id, i]));

  let assigned = new Map<string, S>();
  let used = new Set<string>();
  const unplaced = new Map<string, Unplaced>();
  for (const i of infos) {
    if (i.candidates.length === 0) {
      unplaced.set(i.match.id, { matchId: i.match.id, reason: "noCommonFreeSlot", teamIds: i.concrete });
    }
  }

  const fits = (info: Info, s: S): boolean => {
    for (const [id, o] of assigned) {
      const other = infoById.get(id)!;
      const shared = info.concrete.some((t) => other.concrete.includes(t));
      if (shared && s.startMs < o.restEndMs && o.startMs < s.restEndMs) return false;
    }
    for (const t of info.teams) {
      let groupMatches = info.match.stage === "group" ? 1 : 0;
      const levels = new Set(info.match.stage === "group" ? [] : [LEVEL[info.match.stage]]);
      for (const [id, o] of assigned) {
        const other = infoById.get(id)!;
        if (o.day !== s.day || !other.teams.includes(t)) continue;
        if (other.match.stage === "group") groupMatches++;
        else levels.add(LEVEL[other.match.stage]);
      }
      if (groupMatches + levels.size > config.maxMatchesPerTeamPerDay) return false;
    }
    return true;
  };

  /** Valid slots for a match now, or null if it waits on an unscheduled dependency. */
  const valid = (info: Info): S[] | null => {
    let earliest = -Infinity;
    for (const d of info.deps) {
      const s = assigned.get(d.id);
      if (!s) {
        if (unplaced.has(d.id)) continue;
        return null;
      }
      earliest = Math.max(earliest, d.rest ? s.restEndMs : s.endMs);
    }
    return info.candidates.filter((s) => !used.has(s.id) && s.startMs >= earliest && fits(info, s));
  };

  const pick = (): { info: Info; slots: S[] } | null => {
    let best: { info: Info; slots: S[] } | null = null;
    for (const info of infos) {
      if (assigned.has(info.match.id) || unplaced.has(info.match.id)) continue;
      const v = valid(info);
      if (v && (!best || v.length < best.slots.length)) best = { info, slots: v };
    }
    return best;
  };

  let nodes = 0;
  let deepest = new Map(assigned);
  const dfs = (): boolean => {
    if (++nodes > MAX_NODES) return false;
    const next = pick();
    if (!next) return true;
    if (assigned.size > deepest.size) deepest = new Map(assigned);
    for (const s of next.slots) {
      assigned.set(next.info.match.id, s);
      used.add(s.id);
      if (dfs()) return true;
      assigned.delete(next.info.match.id);
      used.delete(s.id);
      if (nodes > MAX_NODES) return false;
    }
    return false;
  };

  if (!dfs()) {
    // ponytail: greedy completion of the deepest partial; maximising placed matches would need a real optimiser.
    assigned = deepest;
    used = new Set([...assigned.values()].map((s) => s.id));
    for (let next = pick(); next; next = pick()) {
      const id = next.info.match.id;
      const s = next.slots[0];
      if (s) {
        assigned.set(id, s);
        used.add(s.id);
      } else {
        unplaced.set(id, { matchId: id, reason: "noSlotLeft", teamIds: next.info.teams });
      }
    }
  }

  const warnings: AvailabilityWarning[] = [];
  for (const info of infos) {
    const s = assigned.get(info.match.id);
    const unavailableTeamIds = s ? info.teams.filter((t) => isUnavailable(t, s)) : [];
    if (unavailableTeamIds.length) warnings.push({ matchId: info.match.id, unavailableTeamIds });
  }

  return {
    matches: matches.map(({ slotId: _, ...m }) => {
      const s = assigned.get(m.id);
      return s ? { ...m, slotId: s.id } : m;
    }),
    unplaced: infos.flatMap((i) => unplaced.get(i.match.id) ?? []),
    warnings,
  };
}
