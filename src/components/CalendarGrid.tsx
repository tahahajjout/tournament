import type { Match, Slot } from "../domain/types";
import { formatShortDay, formatTime, t } from "../i18n";
import { Score } from "./Score";
import { STAGE_STYLE } from "./StageBadge";
import { TeamName } from "./TeamName";

type Props = { matches: Match[]; slotOf: (m: Match) => Slot; onSelect: (id: string) => void };

/** Time × date grid, coloured by stage. */
export function CalendarGrid({ matches, slotOf, onSelect }: Props) {
  const days = [...new Set(matches.map((m) => slotOf(m).start.slice(0, 10)))];
  const times = [...new Set(matches.map((m) => formatTime(slotOf(m).start)))].sort();
  const at = (day: string, time: string) =>
    matches.filter((m) => slotOf(m).start.startsWith(day) && formatTime(slotOf(m).start) === time);

  return (
    <div className="overflow-x-auto bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white p-2 text-left text-xs text-ink/70">{t.calendar.time}</th>
            {days.map((d) => (
              <th key={d} className="min-w-44 p-3 text-left font-display text-2xl font-normal first-letter:uppercase">
                {formatShortDay(d)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {times.map((time) => (
            <tr key={time} className="even:bg-chalk/60">
              <td className="sticky left-0 bg-white p-3 align-top font-display text-2xl tabular-nums">{time}</td>
              {days.map((d) => (
                <td key={d} className="space-y-1 p-1 align-top">
                  {at(d, time).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onSelect(m.id)}
                      className={`block w-full px-2 py-1.5 text-left text-sm transition-[filter] duration-150 hover:brightness-95 ${STAGE_STYLE[m.stage]}`}
                    >
                      <TeamName teamRef={m.home} />
                      <br />
                      <TeamName teamRef={m.away} />
                      {m.result && (
                        <span className="float-right">
                          <Score result={m.result} />
                        </span>
                      )}
                    </button>
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
