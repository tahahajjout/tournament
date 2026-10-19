import { mulberry32, shuffle } from "./rng";
import type { Config, Group, Match, Standing, TieBreaker } from "./types";

const idOf = (ref: Match["home"]) => ("teamId" in ref ? ref.teamId : undefined);

/** Table rows for the given teams, counting only played matches between two of them. */
function tally(teamIds: string[], matches: Match[], config: Config): Map<string, Standing> {
  const rows = new Map<string, Standing>(
    teamIds.map((teamId) => [
      teamId,
      { teamId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, fairPlay: 0 },
    ]),
  );
  for (const m of matches) {
    const home = rows.get(idOf(m.home) ?? "");
    const away = rows.get(idOf(m.away) ?? "");
    if (!m.result || !home || !away) continue;
    const sides = [
      [home, m.result.home, m.result.away, m.result.cards?.home],
      [away, m.result.away, m.result.home, m.result.cards?.away],
    ] as const;
    for (const [row, scored, conceded, cards] of sides) {
      row.played++;
      row.goalsFor += scored;
      row.goalsAgainst += conceded;
      row.goalDifference = row.goalsFor - row.goalsAgainst;
      if (scored > conceded) row.won++;
      else if (scored === conceded) row.drawn++;
      else row.lost++;
      row.points += scored > conceded ? config.points.win : scored === conceded ? config.points.draw : config.points.loss;
      if (cards) row.fairPlay -= cards.yellow * config.fairPlayPenalty.yellow + cards.red * config.fairPlayPenalty.red;
    }
  }
  return rows;
}

/** Seeded drawing of lots: lower index wins. */
const lots = (teamIds: string[], seed: number) =>
  new Map(shuffle([...teamIds].sort(), mulberry32(seed)).map((id, i) => [id, i]));

/** Group table, sorted with the configured tie-breakers. Head-to-head criteria apply to the teams still tied. */
export function standings(group: Group, matches: Match[], config: Config): Standing[] {
  const played = matches.filter((m) => m.stage === "group" && m.groupId === group.id);
  const overall = tally(group.teamIds, played, config);
  const lot = lots(group.teamIds, config.seed);

  const rank = (ids: string[], criteria: TieBreaker[]): string[] => {
    const [c, ...rest] = criteria;
    if (ids.length < 2 || !c) return ids;
    const h2h = c.startsWith("headToHead") ? tally(ids, played, config) : undefined;
    const key = (id: string): number => {
      const o = overall.get(id)!;
      switch (c) {
        case "points": return o.points;
        case "headToHeadPoints": return h2h!.get(id)!.points;
        case "headToHeadGoalDifference": return h2h!.get(id)!.goalDifference;
        case "goalDifference": return o.goalDifference;
        case "goalsFor": return o.goalsFor;
        case "fairPlay": return o.fairPlay;
        case "lots": return -lot.get(id)!;
      }
    };
    const sorted = [...ids].sort((a, b) => key(b) - key(a));
    const out: string[] = [];
    let run: string[] = [];
    for (const id of sorted) {
      if (run.length && key(id) !== key(run[0]!)) {
        out.push(...rank(run, rest));
        run = [];
      }
      run.push(id);
    }
    return [...out, ...rank(run, rest)];
  };

  return rank(group.teamIds, config.tieBreakers).map((id) => overall.get(id)!);
}

/**
 * Rank teams from different groups (e.g. all third-placed teams). Uses per-match averages so
 * groups of different sizes compare fairly, then fair play, then seeded lots.
 */
export function rankAcrossGroups(rows: Standing[], config: Config): Standing[] {
  const avg = (n: number, r: Standing) => (r.played ? n / r.played : 0);
  const lot = lots(rows.map((r) => r.teamId), config.seed);
  return [...rows].sort(
    (a, b) =>
      avg(b.points, b) - avg(a.points, a) ||
      avg(b.goalDifference, b) - avg(a.goalDifference, a) ||
      avg(b.goalsFor, b) - avg(a.goalsFor, a) ||
      b.fairPlay - a.fairPlay ||
      lot.get(a.teamId)! - lot.get(b.teamId)!,
  );
}
