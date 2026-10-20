import type { Match, Slot } from "../domain/types";
import { formatDay, formatTime, matchTitle, t } from "../i18n";
import { Score } from "./Score";
import { StageBadge } from "./StageBadge";
import { TeamName } from "./TeamName";

type Props = { matches: Match[]; slotOf: (m: Match) => Slot; showPitch: boolean; onSelect: (id: string) => void };

/** Matches grouped by day, in time order, like a fixtures board. */
export function CalendarList({ matches, slotOf, showPitch, onSelect }: Props) {
  const days = [...new Set(matches.map((m) => slotOf(m).start.slice(0, 10)))];
  return (
    <div className="space-y-10">
      {days.map((day) => (
        <section key={day} className="break-inside-avoid">
          <h3 className="section-title mb-3 first-letter:uppercase">{formatDay(day)}</h3>
          <ul className="space-y-1">
            {matches
              .filter((m) => slotOf(m).start.startsWith(day))
              .map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => onSelect(m.id)}
                    className="grid w-full grid-cols-[4.5rem_1fr_auto] items-center gap-4 bg-white px-4 py-3 text-left transition-colors duration-150 hover:bg-pitch/10 sm:grid-cols-[4.5rem_13rem_1fr_auto]"
                  >
                    <span className="font-display text-3xl leading-none tabular-nums">
                      {formatTime(slotOf(m).start)}
                      {showPitch && <span className="block font-sans text-sm">{t.calendar.pitch(slotOf(m).pitch)}</span>}
                    </span>
                    <span className="hidden sm:block">
                      <StageBadge stage={m.stage} label={matchTitle(m)} />
                    </span>
                    <span className="min-w-0 text-lg font-semibold">
                      <TeamName teamRef={m.home} /> <span className="text-ink/50">–</span> <TeamName teamRef={m.away} />
                    </span>
                    <span className="text-lg">
                      <Score result={m.result} />
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
