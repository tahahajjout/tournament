import { useState } from "react";
import { BracketMatch } from "../components/BracketMatch";
import { ResultDialog } from "../components/ResultDialog";
import { t } from "../i18n";
import { useTournament } from "../store/useTournament";

export function BracketPage() {
  const { bracket, matches, slots } = useTournament();
  const [selected, setSelected] = useState<string | null>(null);
  if (!bracket.length) return <p className="bg-turf p-6 text-lg">{t.bracket.empty}</p>;

  const card = (id: string) => {
    const m = matches.find((x) => x.id === id);
    if (!m) return null;
    return <BracketMatch key={id} match={m} slot={slots.find((s) => s.id === m.slotId)} onSelect={() => setSelected(id)} />;
  };
  const rounds = bracket.filter((r) => r.stage !== "THIRD");
  const third = bracket.find((r) => r.stage === "THIRD");

  return (
    <div className="space-y-10">
      <p className="text-ink/80 print:hidden">{t.calendar.hint}</p>
      <div className="flex gap-8 overflow-x-auto pb-4">
        {rounds.map((r) => (
          <section key={r.stage} className="flex shrink-0 flex-col">
            <h3 className="section-title mb-4">{t.roundTitles[r.stage]}</h3>
            {/* justify-around lines each round up between the two matches that feed it */}
            <div className="flex flex-1 flex-col justify-around gap-4">{r.matchIds.map(card)}</div>
          </section>
        ))}
      </div>
      {third && (
        <section>
          <h3 className="section-title mb-4">{t.roundTitles.THIRD}</h3>
          {third.matchIds.map(card)}
        </section>
      )}
      {selected && <ResultDialog matchId={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
