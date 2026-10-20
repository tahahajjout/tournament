import { StandingsTable } from "../components/StandingsTable";
import { qualifiers } from "../domain/knockout";
import { rankAcrossGroups, standings } from "../domain/standings";
import { t } from "../i18n";
import { useTournament } from "../store/useTournament";

export function StandingsPage() {
  const { groups, matches, config } = useTournament();
  if (!groups.length) return <p className="bg-turf p-6 text-lg">{t.standings.empty}</p>;

  const qs = qualifiers(groups);
  const tables = groups.map((g) => ({ group: g, rows: standings(g, matches, config) }));
  // Positions that may qualify through a cross-group ranking (e.g. best thirds) → how many places.
  const best = new Map<number, number>();
  for (const q of qs) if (q.type === "bestRanked") best.set(q.position, (best.get(q.position) ?? 0) + 1);

  return (
    <div className="space-y-10">
      <p className="flex flex-wrap gap-x-6 gap-y-2">
        <span className="flex items-center gap-2"><span className="h-4 w-4 bg-pitch" />{t.standings.qualified}</span>
        {best.size > 0 && <span className="flex items-center gap-2"><span className="h-4 w-4 bg-[#efe1c4]" />{t.standings.maybe}</span>}
      </p>
      <div className="grid gap-8 lg:grid-cols-2">
        {tables.map(({ group, rows }) => (
          <StandingsTable
            key={group.id}
            title={t.group(group.name)}
            rows={rows}
            mark={(i) =>
              qs.some((q) => q.type === "groupPosition" && q.groupId === group.id && q.position === i + 1)
                ? "qualified"
                : best.has(i + 1)
                  ? "maybe"
                  : undefined
            }
          />
        ))}
      </div>
      {[...best].map(([position, places]) => (
        <StandingsTable
          key={position}
          title={t.standings.bestTitle(position)}
          note={t.standings.bestHint(places)}
          rows={rankAcrossGroups(tables.flatMap((x) => x.rows[position - 1] ?? []), config)}
          mark={(i) => (i < places ? "qualified" : undefined)}
        />
      ))}
    </div>
  );
}
