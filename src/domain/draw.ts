import { mulberry32, shuffle } from "./rng";
import type { Group } from "./types";

/**
 * Group sizes for a team count: as many groups of 4 as possible, the rest of 3.
 * Never groups of 2; a single group when splitting would create one (5 teams → 1 × 5).
 */
export function groupSizes(teamCount: number): number[] {
  if (teamCount < 3) throw new Error("At least 3 teams are required");
  const groups = Math.ceil(teamCount / 4);
  const base = Math.floor(teamCount / groups);
  if (base < 3) return [teamCount];
  const extra = teamCount % groups;
  return Array.from({ length: groups }, (_, i) => base + (i < extra ? 1 : 0));
}

export type DrawOptions = {
  /** Manual override of group sizes; must sum to the team count. */
  sizes?: number[];
  /** Seeding pots (pot 1 first). Teams in the same pot go to different groups when possible. Unlisted teams form the last pot. */
  pots?: string[][];
};

/** Seeded draw: shuffle each pot, then deal teams round the groups in turn. */
export function draw(teamIds: string[], seed: number, options: DrawOptions = {}): Group[] {
  const sizes = options.sizes ?? groupSizes(teamIds.length);
  if (sizes.reduce((a, b) => a + b, 0) !== teamIds.length) {
    throw new Error("Group sizes must add up to the number of teams");
  }

  const pots = options.pots ?? [];
  const potted = new Set(pots.flat());
  const rand = mulberry32(seed);
  const order = [...pots, teamIds.filter((id) => !potted.has(id))].flatMap((pot) => shuffle(pot, rand));

  const groups: Group[] = sizes.map((_, i) => {
    const letter = String.fromCharCode(65 + i);
    return { id: letter, name: letter, teamIds: [] };
  });
  let g = 0;
  for (const teamId of order) {
    while (groups[g]!.teamIds.length >= sizes[g]!) g = (g + 1) % groups.length;
    groups[g]!.teamIds.push(teamId);
    g = (g + 1) % groups.length;
  }
  return groups;
}
