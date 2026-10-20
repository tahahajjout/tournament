import { resolveTeam } from "../domain/knockout";
import type { TeamRef } from "../domain/types";
import { placeholderLabel, t } from "../i18n";
import { useTournament } from "./useTournament";

/** Resolve match sides to real teams (bracket progression) and to display names. */
export function useTeamRefs() {
  const { teams, groups, matches, config } = useTournament();
  const resolve = (ref: TeamRef) => resolveTeam(ref, groups, matches, config);
  const teamName = (id: string) => teams.find((x) => x.id === id)?.name ?? t.placeholder.tbd;
  const nameOf = (ref: TeamRef): string => {
    const id = resolve(ref);
    if (id) return teamName(id);
    return "placeholder" in ref ? placeholderLabel(ref.placeholder) : t.placeholder.tbd;
  };
  return { resolve, nameOf, teamName };
}
