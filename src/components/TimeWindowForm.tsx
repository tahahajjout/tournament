import { addDays, format, parseISO } from "date-fns";
import { useState, type FormEvent } from "react";
import type { TimeWindow, WeeklyWindow } from "../domain/types";
import { t, weekdayName } from "../i18n";

type Props = {
  onAddDated: (w: TimeWindow) => void;
  /** When set, offers "whole day" and "every week" options (team unavailability). */
  onAddWeekly?: (w: WeeklyWindow) => void;
};

const input = "rounded border border-slate-300 px-2 py-1 text-sm";
// Monday first, as on French calendars.
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

export function TimeWindowForm({ onAddDated, onAddWeekly }: Props) {
  const [weekly, setWeekly] = useState(false);
  const [wholeDay, setWholeDay] = useState(false);
  const [date, setDate] = useState("");
  const [weekday, setWeekday] = useState(1);
  const [from, setFrom] = useState("18:00");
  const [to, setTo] = useState("22:00");
  const [error, setError] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const [f, tt] = wholeDay ? ["00:00", "23:59"] : [from, to];
    if (tt <= f) return setError(t.common.endBeforeStart);
    setError("");
    if (weekly && onAddWeekly) onAddWeekly({ weekday, from: f, to: tt });
    else onAddDated({ start: `${date}T${f}`, end: `${date}T${tt}` });
    // Next window most likely starts the following day.
    if (!weekly && date) setDate(format(addDays(parseISO(date), 1), "yyyy-MM-dd"));
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      {onAddWeekly && (
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={weekly} onChange={(e) => setWeekly(e.target.checked)} />
          {t.common.weekly}
        </label>
      )}
      {weekly ? (
        <label className="flex flex-col text-xs text-slate-600">
          {t.common.weekday}
          <select className={input} value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
            {WEEKDAYS.map((d) => (
              <option key={d} value={d}>
                {weekdayName(d)}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="flex flex-col text-xs text-slate-600">
          {t.common.date}
          <input className={input} type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
      )}
      {onAddWeekly && (
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={wholeDay} onChange={(e) => setWholeDay(e.target.checked)} />
          {t.common.wholeDay}
        </label>
      )}
      {!wholeDay && (
        <>
          <label className="flex flex-col text-xs text-slate-600">
            {t.common.from}
            <input className={input} type="time" required value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="flex flex-col text-xs text-slate-600">
            {t.common.to}
            <input className={input} type="time" required value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </>
      )}
      <button className="rounded bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800">
        {t.common.add}
      </button>
      {error && <p className="w-full text-sm text-red-700">{error}</p>}
    </form>
  );
}
