import { RemoveButton } from "../components/RemoveButton";
import { TimeWindowForm } from "../components/TimeWindowForm";
import { slotMinutes } from "../domain/rules";
import { generateSlots } from "../domain/slots";
import { formatWindow, t } from "../i18n";
import { useTournament } from "../store/useTournament";

export function PitchPage() {
  const { pitchWindows, addPitchWindow, removePitchWindow, config } = useTournament();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">{t.pitch.title}</h2>
        <p className="text-sm text-slate-500">{t.pitch.intro(slotMinutes(config))}</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <TimeWindowForm onAddDated={addPitchWindow} />
      </div>
      {pitchWindows.length === 0 ? (
        <p className="text-slate-500">{t.pitch.empty}</p>
      ) : (
        <>
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {pitchWindows.map((w) => (
              <li key={`${w.start}-${w.end}`} className="flex items-center justify-between gap-4 px-4 py-2">
                <span className="first-letter:uppercase">{formatWindow(w)}</span>
                <span className="ml-auto text-sm text-slate-500">{t.pitch.slots(generateSlots([w], config).length)}</span>
                <RemoveButton onClick={() => removePitchWindow(w)} />
              </li>
            ))}
          </ul>
          <p className="font-medium">{t.pitch.total(generateSlots(pitchWindows, config).length)}</p>
        </>
      )}
    </div>
  );
}
