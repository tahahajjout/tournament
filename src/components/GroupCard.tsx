import type { Group } from "../domain/types";
import { t } from "../i18n";
import { useTeamRefs } from "../store/useTeamRefs";
import { StarIcon } from "./StarIcon";

/** A drawn group; teams not yet revealed by the draw animation show as an empty line. */
export function GroupCard({ group, isRevealed, seeds }: { group: Group; isRevealed: (id: string) => boolean; seeds: string[] }) {
  const { teamName } = useTeamRefs();
  return (
    <article className="bg-white">
      <h3 className="flex items-end justify-between bg-pitch px-5 pt-3 pb-2 text-white">
        <span className="font-display text-2xl leading-none">{t.groupWord}</span>
        <span className="font-display text-7xl leading-[0.8]">{group.name}</span>
      </h3>
      <ol>
        {group.teamIds.map((id, i) => (
          <li key={id} className={`flex h-14 items-center gap-3 px-5 text-lg ${i % 2 ? "bg-turf/50" : ""}`}>
            {isRevealed(id) ? (
              <>
                <span className="animate-[fadein_.35s_ease-out] font-semibold">{teamName(id)}</span>
                {seeds.includes(id) && (
                  <span title={t.draw.seeds} className="text-[#c99a06]">
                    <StarIcon />
                  </span>
                )}
              </>
            ) : (
              <span className="h-3 w-32 bg-turf" aria-hidden />
            )}
          </li>
        ))}
      </ol>
    </article>
  );
}
