import type { Standing } from "../domain/types";
import { t } from "../i18n";
import { useTeamRefs } from "../store/useTeamRefs";

export type RowMark = "qualified" | "maybe" | undefined;

type Props = { title: string; rows: Standing[]; mark: (index: number) => RowMark; note?: string };

const MARK_STYLE = { qualified: "bg-pitch/12 [&>td:first-child]:bg-pitch [&>td:first-child]:text-white", maybe: "bg-[#efe1c4]/60 [&>td:first-child]:bg-[#efe1c4]" };

export function StandingsTable({ title, rows, mark, note }: Props) {
  const { teamName } = useTeamRefs();
  const c = t.standings.cols;
  const showFairPlay = rows.some((r) => r.fairPlay !== 0);
  const cols = [c.played, c.won, c.drawn, c.lost, c.gf, c.ga, c.gd, c.pts, ...(showFairPlay ? [c.fp] : [])];

  return (
    <section className="break-inside-avoid overflow-x-auto bg-white">
      <h3 className="section-title px-5 pt-5">{title}</h3>
      {note && <p className="mt-1 px-5 text-ink/80">{note}</p>}
      <table className="mt-4 w-full tabular-nums">
        <thead className="text-sm text-ink/75">
          <tr>
            <th className="w-8 px-2 py-1 text-center">{c.pos}</th>
            <th className="px-2 py-1 text-left">{c.team}</th>
            {cols.map((h) => (
              <th key={h} className="w-10 px-1 py-1 text-center">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const m = mark(i);
            return (
            <tr key={r.teamId} className={m ? MARK_STYLE[m] : i % 2 ? "bg-chalk/60" : ""}>
              <td className="w-10 py-2.5 text-center font-display text-xl leading-none">{i + 1}</td>
              <td className="px-3 py-2.5 font-semibold">{teamName(r.teamId)}</td>
              {[r.played, r.won, r.drawn, r.lost, r.goalsFor, r.goalsAgainst, r.goalDifference, r.points].map((v, k) => (
                <td key={k} className={`px-1 py-2.5 text-center ${k === 7 ? "font-display text-2xl leading-none" : ""}`}>
                  {k === 6 && v > 0 ? `+${v}` : v}
                </td>
              ))}
              {showFairPlay && <td className="px-1 py-1.5 text-center">{r.fairPlay}</td>}
            </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
