import { useEffect, useRef, useState, type FormEvent } from "react";
import type { MatchResult } from "../domain/types";
import { matchTitle, t } from "../i18n";
import { useTeamRefs } from "../store/useTeamRefs";
import { useTournament } from "../store/useTournament";

const num = "field w-20 text-center font-display text-4xl leading-none tabular-nums";

/** Modal score entry. Knockout draws require a penalty shoot-out winner. */
export function ResultDialog({ matchId, onClose }: { matchId: string; onClose: () => void }) {
  const { matches, setResult } = useTournament();
  const { resolve, nameOf } = useTeamRefs();
  const ref = useRef<HTMLDialogElement>(null);
  const match = matches.find((m) => m.id === matchId);
  const r = match?.result;
  const [score, setScore] = useState({ home: r?.home ?? 0, away: r?.away ?? 0 });
  const [pens, setPens] = useState(r?.penalties ?? { home: 0, away: 0 });
  const [cards, setCards] = useState(r?.cards ?? { home: { yellow: 0, red: 0 }, away: { yellow: 0, red: 0 } });
  const [error, setError] = useState("");

  useEffect(() => ref.current?.showModal(), []);
  if (!match) return null;

  const close = () => ref.current?.close();
  const knockout = match.stage !== "group";
  const known = resolve(match.home) !== undefined && resolve(match.away) !== undefined;
  const tie = knockout && score.home === score.away;
  const hasCards = [cards.home, cards.away].some((c) => c.yellow || c.red);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (tie && pens.home === pens.away) return setError(t.result.penaltiesRequired);
    const result: MatchResult = { ...score };
    if (tie) result.penalties = pens;
    if (hasCards) result.cards = cards;
    setResult(match.id, result);
    close();
  };

  const side = (s: "home" | "away") => (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xl font-semibold">{nameOf(match[s])}</span>
      <input
        type="number"
        min={0}
        required
        aria-label={`${t.result.score} ${nameOf(match[s])}`}
        className={num}
        value={score[s]}
        onChange={(e) => setScore({ ...score, [s]: Math.max(0, e.target.valueAsNumber || 0) })}
      />
    </div>
  );

  return (
    <dialog ref={ref} onClose={onClose} className="m-auto w-[min(30rem,calc(100%-2rem))] p-0 text-ink shadow-2xl backdrop:bg-ink/70" /* taste-skill-ignore: modal dialog */>
      <form onSubmit={submit} className="space-y-5 bg-chalk p-6">
        <h2 className="section-title">{matchTitle(match)}</h2>
        {!known ? (
          <p className="text-ink/75">{t.result.unknownTeams}</p>
        ) : (
          <>
            {side("home")}
            {side("away")}
            {tie && (
              <fieldset className="space-y-2 bg-[#efe1c4] p-4">
                <legend className="float-left mb-2 w-full font-bold">{t.result.penalties}</legend>
                {(["home", "away"] as const).map((s) => (
                  <label key={s} className="flex items-center justify-between gap-3 font-semibold">
                    {nameOf(match[s])}
                    <input
                      type="number"
                      min={0}
                      className={num}
                      value={pens[s]}
                      onChange={(e) => setPens({ ...pens, [s]: Math.max(0, e.target.valueAsNumber || 0) })}
                    />
                  </label>
                ))}
              </fieldset>
            )}
            <details open={hasCards}>
              <summary className="font-semibold text-ink/80">{t.result.cards}</summary>
              <div className="mt-2 space-y-2">
                {(["home", "away"] as const).map((s) => (
                  <div key={s} className="flex flex-wrap items-center gap-3">
                    <span className="flex-1">{nameOf(match[s])}</span>
                    {(["yellow", "red"] as const).map((c) => (
                      <label key={c} className="flex items-center gap-1">
                        {t.result[c]}
                        <input
                          type="number"
                          min={0}
                          className="field w-16 text-center"
                          value={cards[s][c]}
                          onChange={(e) =>
                            setCards({ ...cards, [s]: { ...cards[s], [c]: Math.max(0, e.target.valueAsNumber || 0) } })
                          }
                        />
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </details>
            {error && <p className="text-sm text-flag">{error}</p>}
          </>
        )}
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          {r && (
            <button
              type="button"
              className="mr-auto font-semibold text-flag hover:underline"
              onClick={() => {
                setResult(match.id, undefined);
                close();
              }}
            >
              {t.result.clear}
            </button>
          )}
          <button type="button" className="btn btn-quiet" onClick={close}>
            {t.result.cancel}
          </button>
          {known && (
            <button className="btn btn-primary">
              {t.result.save}
            </button>
          )}
        </div>
      </form>
    </dialog>
  );
}
