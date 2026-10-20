import { rankAcrossGroups, standings } from "./standings";
import type { Bracket, Config, Group, KnockoutStage, Match, MatchResult, Placeholder, TeamRef } from "./types";

/**
 * Knockout size. One group: top 2 → final (top 4 → semis from 5 teams).
 * Several groups: largest power of 2 ≤ 3 × groups (winners, runners-up, then best thirds),
 * e.g. 2 groups → 4, 3–5 groups → 8, 6–10 groups → 16.
 */
export function knockoutSize(groups: Group[]): number {
  if (groups.length === 1) return groups[0]!.teamIds.length >= 5 ? 4 : 2;
  return 2 ** Math.floor(Math.log2(3 * groups.length));
}

/** Qualifiers in seeding order: all winners, all runners-up, …, then the best of the next position to fill. */
export function qualifiers(groups: Group[]): Placeholder[] {
  const size = knockoutSize(groups);
  const out: Placeholder[] = [];
  for (let position = 1; out.length < size; position++) {
    const eligible = groups.filter((g) => g.teamIds.length >= position);
    if (out.length + eligible.length <= size) {
      out.push(...eligible.map((g): Placeholder => ({ type: "groupPosition", groupId: g.id, position })));
    } else {
      for (let rank = 1; out.length < size; rank++) out.push({ type: "bestRanked", position, rank });
    }
  }
  return out;
}

/** Standard seeded bracket order: seed 1 and seed 2 can only meet in the final. [1, 8, 4, 5, 2, 7, 3, 6] for 8. */
const seedOrder = (size: number): number[] => {
  let order = [1];
  while (order.length < size) order = order.flatMap((s) => [s, order.length * 2 + 1 - s]);
  return order;
};

/** Round (1 = first round) in which bracket positions a and b would meet. */
const meetingRound = (a: number, b: number): number => {
  let r = 0;
  while (a !== b) [a, b, r] = [a >> 1, b >> 1, r + 1];
  return r;
};

const STAGE_BY_SIZE: Record<number, KnockoutStage> = { 16: "R16", 8: "QF", 4: "SF", 2: "FINAL" };

/**
 * Knockout matches with placeholders, plus the bracket layout. Group winners take the top seeds;
 * every other qualifier goes to the free seed that keeps it away from its own group's teams the longest.
 */
export function buildKnockout(groups: Group[], config: Config): { matches: Match[]; bracket: Bracket } {
  const qs = qualifiers(groups);
  const size = qs.length;
  const order = seedOrder(size);
  const positionOfSeed = (seed: number) => order.indexOf(seed);

  // seat[seed - 1] = qualifier
  const seat: (Placeholder | undefined)[] = Array(size).fill(undefined);
  const groupOf = (p: Placeholder | undefined) => (p?.type === "groupPosition" ? p.groupId : undefined);
  for (const q of qs) {
    let best = -1;
    let bestScore = -1;
    for (let seed = 1; seed <= size; seed++) {
      if (seat[seed - 1]) continue;
      if (q.type === "groupPosition" && q.position === 1) {
        best = seed; // winners in group order on the top seeds
        break;
      }
      const sameGroup = seat.flatMap((p, i) => (p && groupOf(p) && groupOf(p) === groupOf(q) ? [i + 1] : []));
      const score = Math.min(Infinity, ...sameGroup.map((s) => meetingRound(positionOfSeed(s), positionOfSeed(seed))));
      if (score > bestScore) [best, bestScore] = [seed, score];
    }
    seat[best - 1] = q;
  }
  // ponytail: best-ranked qualifiers' groups are unknown at build time, so one may meet its own group winner early.

  const matches: Match[] = [];
  const bracket: Bracket = [];
  let refs: TeamRef[] = order.map((seed) => ({ placeholder: seat[seed - 1]! }));
  let semis: Match[] = [];
  while (refs.length >= 2) {
    const stage = STAGE_BY_SIZE[refs.length]!;
    const round: Match[] = [];
    for (let i = 0; i < refs.length; i += 2) {
      round.push({
        id: stage === "FINAL" ? "FINAL" : `${stage}${i / 2 + 1}`,
        stage,
        home: refs[i]!,
        away: refs[i + 1]!,
      });
    }
    if (stage === "SF") semis = round;
    matches.push(...round);
    bracket.push({ stage, matchIds: round.map((m) => m.id) });
    refs = round.map((m) => ({ placeholder: { type: "winner", matchId: m.id } }));
  }
  if (config.thirdPlaceMatch && semis.length === 2) {
    const third: Match = {
      id: "THIRD",
      stage: "THIRD",
      home: { placeholder: { type: "loser", matchId: semis[0]!.id } },
      away: { placeholder: { type: "loser", matchId: semis[1]!.id } },
    };
    matches.splice(matches.length - 1, 0, third);
    bracket.splice(bracket.length - 1, 0, { stage: "THIRD", matchIds: ["THIRD"] });
  }
  return { matches, bracket };
}

/**
 * The concrete team behind a reference, or undefined while it is still undecided
 * (group not finished, match not played, or draw without penalties).
 */
export function resolveTeam(ref: TeamRef, groups: Group[], matches: Match[], config: Config): string | undefined {
  if ("teamId" in ref) return ref.teamId;
  const p = ref.placeholder;
  const groupDone = (g: Group) =>
    matches.filter((m) => m.stage === "group" && m.groupId === g.id).every((m) => m.result);

  switch (p.type) {
    case "groupPosition": {
      const g = groups.find((x) => x.id === p.groupId);
      return g && groupDone(g) ? standings(g, matches, config)[p.position - 1]?.teamId : undefined;
    }
    case "bestRanked": {
      if (!groups.every(groupDone)) return undefined;
      const atPosition = groups.flatMap((g) => standings(g, matches, config)[p.position - 1] ?? []);
      return rankAcrossGroups(atPosition, config)[p.rank - 1]?.teamId;
    }
    case "winner":
    case "loser": {
      const m = matches.find((x) => x.id === p.matchId);
      const won = winnerSide(m?.result);
      if (!m || !won) return undefined;
      const side = (won === "home") === (p.type === "winner") ? m.home : m.away;
      return resolveTeam(side, groups, matches, config);
    }
  }
}

/** Which side won, counting penalties; undefined for no result or a draw. */
export function winnerSide(r: MatchResult | undefined): "home" | "away" | undefined {
  if (!r) return undefined;
  const [h, a] = r.home !== r.away ? [r.home, r.away] : r.penalties ? [r.penalties.home, r.penalties.away] : [0, 0];
  return h > a ? "home" : h < a ? "away" : undefined;
}
