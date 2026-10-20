import { addMinutes, parseISO } from "date-fns";
import { useState } from "react";
import { CalendarGrid } from "../components/CalendarGrid";
import { CalendarList } from "../components/CalendarList";
import { IssueList } from "../components/IssueList";
import { ResultDialog } from "../components/ResultDialog";
import { toIcs } from "../domain/ics";
import { matchMinutes } from "../domain/rules";
import { generateSlots, toLocalIso } from "../domain/slots";
import type { Match } from "../domain/types";
import { isWarning, validate } from "../domain/validate";
import { download } from "../download";
import { matchTitle, t } from "../i18n";
import { useTeamRefs } from "../store/useTeamRefs";
import { useTournament } from "../store/useTournament";

const btn = "btn btn-quiet";

export function CalendarPage() {
  const { teams, groups, matches, slots, unplaced, warnings, pitchWindows, config, generateCalendar } = useTournament();
  const { resolve, nameOf, teamName } = useTeamRefs();
  const [view, setView] = useState<"list" | "grid">("list");
  const [teamFilter, setTeamFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  if (!groups.length) return <p className="text-ink/70">{t.calendar.needDraw}</p>;

  const issues = validate({ teams, config, groups, matches, slots: generateSlots(pitchWindows, config) });
  const blocked = issues.some((i) => !isWarning(i));
  const slotById = new Map(slots.map((s) => [s.id, s]));
  const slotOf = (m: Match) => slotById.get(m.slotId!)!;
  const placed = matches
    .filter((m) => m.slotId && slotById.has(m.slotId))
    .sort((a, b) => slotOf(a).start.localeCompare(slotOf(b).start) || slotOf(a).pitch - slotOf(b).pitch);
  const shown = teamFilter ? placed.filter((m) => [m.home, m.away].some((r) => resolve(r) === teamFilter)) : placed;
  const byId = new Map(matches.map((m) => [m.id, m]));
  const names = (ids: string[]) => ids.map(teamName).join(", ");

  const onGenerate = () => {
    if (matches.some((m) => m.result && m.slotId) && !confirm(t.calendar.confirmRegenerate)) return;
    generateCalendar();
  };

  const exportIcs = () => {
    const events = shown.map((m) => {
      const start = slotOf(m).start;
      return {
        uid: `${m.id}@tournoi-6v6`,
        start,
        end: toLocalIso(addMinutes(parseISO(start), matchMinutes(config))),
        summary: `${nameOf(m.home)} – ${nameOf(m.away)}`,
        description: matchTitle(m),
      };
    });
    download("calendrier.ics", toIcs(events, new Date()), "text/calendar");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="max-w-xl text-lg">{t.calendar.intro}</p>
        <button onClick={onGenerate} disabled={blocked} className="btn btn-primary min-h-14 px-8 text-lg">
          {slots.length ? t.calendar.regenerate : t.calendar.generate}
        </button>
      </div>
      <div className="print:hidden">
        <IssueList issues={issues} />
      </div>

      {unplaced.length > 0 && (
        <section className="bg-flag p-6 text-white">
          <h3 className="section-title mb-3">{t.calendar.unplacedTitle(unplaced.length)}</h3>
          <ul className="space-y-2">
            {unplaced.map((u) => {
              const m = byId.get(u.matchId);
              return (
                <li key={u.matchId}>
                  <strong>{m ? `${matchTitle(m)} · ${nameOf(m.home)} – ${nameOf(m.away)}` : u.matchId}</strong> :{" "}
                  {u.reason === "noCommonFreeSlot" ? t.calendar.noCommonFreeSlot(names(u.teamIds)) : t.calendar.noSlotLeft}
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {warnings.length > 0 && (
        <section className="bg-[#efe1c4] p-6 print:hidden">
          <h3 className="mb-3 text-xl font-bold">{t.calendar.warningsTitle}</h3>
          <ul className="space-y-2">
            {warnings.map((w) => {
              const m = byId.get(w.matchId);
              return (
                <li key={w.matchId}>
                  <strong>{m ? matchTitle(m) : w.matchId}</strong> : {t.calendar.warning(names(w.unavailableTeamIds))}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {placed.length === 0 ? (
        <p className="bg-turf p-6 text-lg">{t.calendar.empty}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <div className="flex">
              {(["list", "grid"] as const).map((v) => (
                <button
                  key={v}
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className="btn bg-white aria-pressed:bg-ink aria-pressed:text-white"
                >
                  {t.calendar[v]}
                </button>
              ))}
            </div>
            <select
              aria-label={t.calendar.filter}
              className="field"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
            >
              <option value="">{t.calendar.allTeams}</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <span className="ml-auto flex gap-2">
              <button className={btn} onClick={() => print()}>
                {t.calendar.print}
              </button>
              <button className={btn} onClick={exportIcs}>
                {t.calendar.ics}
              </button>
            </span>
          </div>
          <p className="text-ink/80 print:hidden">{t.calendar.hint}</p>
          {view === "list" ? (
            <CalendarList matches={shown} slotOf={slotOf} showPitch={config.pitches > 1} onSelect={setSelected} />
          ) : (
            <CalendarGrid matches={shown} slotOf={slotOf} onSelect={setSelected} />
          )}
        </>
      )}
      {selected && <ResultDialog matchId={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
