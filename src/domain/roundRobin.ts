import type { Group, Match } from "./types";

/**
 * Round-robin fixtures for one group (circle method). With an odd team count a
 * dummy is added; whoever faces it rests that round.
 */
export function groupMatches(group: Group): Match[] {
  const teams: (string | null)[] = [...group.teamIds];
  if (teams.length % 2 === 1) teams.push(null);
  const n = teams.length;
  const matches: Match[] = [];

  for (let r = 0; r < n - 1; r++) {
    for (let i = 0; i < n / 2; i++) {
      const a = teams[i]!;
      const b = teams[n - 1 - i]!;
      if (a === null || b === null) continue;
      // Alternate the fixed team's side each round to balance home/away.
      const [home, away] = i === 0 && r % 2 === 1 ? [b, a] : [a, b];
      matches.push({
        id: `${group.id}-${r + 1}-${matches.length + 1}`,
        stage: "group",
        groupId: group.id,
        round: r + 1,
        home: { teamId: home },
        away: { teamId: away },
      });
    }
    // Keep teams[0] fixed, rotate the rest one step clockwise.
    teams.splice(1, 0, teams.pop()!);
  }
  return matches;
}
