import { addWeeks, format, parseISO, startOfWeek } from "date-fns";
import { useState } from "react";
import { RemoveButton } from "../components/RemoveButton";
import { TimeWindowForm } from "../components/TimeWindowForm";
import { WeekGrid } from "../components/WeekGrid";
import { slotMinutes } from "../domain/rules";
import { expandWeekly, generateSlots } from "../domain/slots";
import { formatDay, formatWindow, t } from "../i18n";
import { useTournament } from "../store/useTournament";

const today = () => format(new Date(), "yyyy-MM-dd");

export function PitchPage() {
  const { pitchWindows, pitchWeek, setPitchWeek, addPitchWindows, removePitchWindow, clearPitchWindows, config } = useTournament();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(() => format(addWeeks(new Date(), 4), "yyyy-MM-dd"));

  const preview = from && to ? expandWeekly(pitchWeek, from, to) : [];
  const weeks = [...new Set(pitchWindows.map((w) => format(startOfWeek(parseISO(w.start), { weekStartsOn: 1 }), "yyyy-MM-dd")))];
  const weekOf = (w: { start: string }) => format(startOfWeek(parseISO(w.start), { weekStartsOn: 1 }), "yyyy-MM-dd");

  return (
    <div className="grid gap-x-12 gap-y-14 lg:grid-cols-[minmax(0,26rem)_1fr]">
      <div className="space-y-12">
        <section className="space-y-5">
          <h2 className="section-title">{t.week.title}</h2>
          <p>{t.week.pitchIntro}</p>
          <WeekGrid value={pitchWeek} onChange={setPitchWeek} />
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col text-sm font-semibold">
              {t.week.from}
              <input type="date" className="field" value={from} onChange={(e) => setFrom(e.target.value)} />
            </label>
            <label className="flex flex-col text-sm font-semibold">
              {t.week.to}
              <input type="date" className="field" value={to} onChange={(e) => setTo(e.target.value)} />
            </label>
          </div>
          <button className="btn btn-primary w-full" disabled={!preview.length} onClick={() => addPitchWindows(preview)}>
            {t.week.fill(preview.length)}
          </button>
        </section>
        <section className="space-y-4">
          <h2 className="section-title">{t.week.oneByOne}</h2>
          <TimeWindowForm onAddDated={(w) => addPitchWindows([w])} />
        </section>
      </div>

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="section-title">{t.pitch.title}</h2>
            <p className="mt-2">{t.pitch.intro(slotMinutes(config))}</p>
          </div>
          {pitchWindows.length > 0 && (
            <button className="btn btn-quiet" onClick={() => confirm(t.week.confirmClearAll) && clearPitchWindows()}>
              {t.week.clearAll}
            </button>
          )}
        </div>
        {pitchWindows.length === 0 ? (
          <p className="bg-turf p-6 text-lg">{t.pitch.empty}</p>
        ) : (
          <>
            <p className="font-display text-5xl leading-none text-pitch">{t.pitch.total(generateSlots(pitchWindows, config).length)}</p>
            {weeks.map((week) => (
              <div key={week}>
                <h3 className="mb-2 text-lg font-bold">{t.week.weekOf(formatDay(week))}</h3>
                <ul className="space-y-1">
                  {pitchWindows
                    .filter((w) => weekOf(w) === week)
                    .map((w) => (
                      <li key={`${w.start}-${w.end}`} className="flex flex-wrap items-center gap-x-4 bg-white px-4 py-2.5">
                        <span className="first-letter:uppercase">{formatWindow(w)}</span>
                        <span className="ml-auto font-semibold text-pitch">{t.pitch.slots(generateSlots([w], config).length)}</span>
                        <RemoveButton onClick={() => removePitchWindow(w)} />
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </>
        )}
      </section>
    </div>
  );
}
