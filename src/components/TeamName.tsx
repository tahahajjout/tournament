import type { TeamRef } from "../domain/types";
import { useTeamRefs } from "../store/useTeamRefs";

/** Team name, or the placeholder ("1er du groupe A") in italics while it isn't decided. */
export function TeamName({ teamRef, bold = false }: { teamRef: TeamRef; bold?: boolean }) {
  const { resolve, nameOf } = useTeamRefs();
  const known = resolve(teamRef) !== undefined;
  return <span className={known ? (bold ? "font-bold" : "") : "italic text-ink/70"}>{nameOf(teamRef)}</span>;
}
