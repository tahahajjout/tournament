import { useState, type FormEvent } from "react";
import type { Team } from "../domain/types";
import { formatWeekly, formatWindow, t } from "../i18n";
import { useTournament } from "../store/useTournament";
import { RemoveButton } from "./RemoveButton";
import { TimeWindowForm } from "./TimeWindowForm";
import { WeekGrid } from "./WeekGrid";

const sub = "mb-3 text-lg font-bold";

export function TeamCard({ team, duplicateName }: { team: Team; duplicateName: boolean }) {
  const { teams, updateTeam, removeTeam, config } = useTournament();
  const [player, setPlayer] = useState("");
  const full = team.players.length >= config.maxSquadSize;
  const available = team.availableWeekly ?? [];

  const addPlayer = (e: FormEvent) => {
    e.preventDefault();
    if (!player.trim() || full) return;
    updateTeam(team.id, { players: [...team.players, player.trim()] });
    setPlayer("");
  };
  const applyToAll = () => {
    if (!confirm(t.week.confirmApplyToAll(team.name))) return;
    for (const other of teams) updateTeam(other.id, { availableWeekly: available });
  };

  return (
    <article className="bg-white">
      <div className="flex items-center gap-4 bg-ink px-6 py-3 text-white">
        <label className="sr-only" htmlFor={`name-${team.id}`}>
          {t.teams.name}
        </label>
        <input
          id={`name-${team.id}`}
          className="min-w-0 flex-1 bg-transparent font-display text-4xl leading-none focus:bg-white/10"
          value={team.name}
          onChange={(e) => updateTeam(team.id, { name: e.target.value })}
        />
        <button
          type="button"
          className="text-sm font-semibold text-white/80 hover:text-white hover:underline"
          onClick={() => confirm(t.teams.confirmRemove(team.name)) && removeTeam(team.id)}
        >
          {t.common.remove}
        </button>
      </div>
      {duplicateName && <p className="bg-flag px-6 py-2 font-semibold text-white">{t.teams.duplicateName}</p>}

      <div className="grid gap-10 p-6 lg:grid-cols-3">
        <section>
          <h3 className={sub}>{t.teams.players(team.players.length, config.maxSquadSize)}</h3>
          <ol className="mb-3 space-y-1">
            {team.players.map((p, i) => (
              <li key={i} className="flex items-center gap-3 bg-turf px-3 py-2">
                <span className="w-5 font-display text-xl leading-none text-pitch">{i + 1}</span>
                <span className="flex-1">{p}</span>
                <RemoveButton onClick={() => updateTeam(team.id, { players: team.players.filter((_, j) => j !== i) })} />
              </li>
            ))}
          </ol>
          {!full && (
            <form onSubmit={addPlayer} className="flex gap-2">
              <input
                className="field min-w-0 flex-1"
                placeholder={t.teams.playerPlaceholder}
                aria-label={t.teams.playerPlaceholder}
                value={player}
                onChange={(e) => setPlayer(e.target.value)}
              />
              <button className="btn btn-quiet">{t.common.add}</button>
            </form>
          )}
          {team.players.length < config.playersOnPitch && (
            <p className="mt-3 font-semibold text-flag">{t.teams.tooFewPlayers(config.playersOnPitch)}</p>
          )}
        </section>

        <section>
          <h3 className={sub}>{t.week.teamTitle}</h3>
          <p className="mb-3 text-ink/80">
            {available.length ? available.map(formatWeekly).join(" · ") : t.teams.anytime}
          </p>
          <details>
            <summary className="btn btn-quiet w-full">{t.teams.editWeek}</summary>
            <div className="mt-3 space-y-3">
              <p className="text-sm text-ink/80">{t.week.teamIntro}</p>
              <WeekGrid value={available} onChange={(v) => updateTeam(team.id, { availableWeekly: v })} />
              {teams.length > 1 && (
                <button type="button" className="btn btn-quiet w-full" onClick={applyToAll}>
                  {t.week.applyToAll}
                </button>
              )}
            </div>
          </details>
        </section>

        <section>
          <h3 className={sub}>{t.teams.unavailable}</h3>
          {team.unavailable.length + team.unavailableWeekly.length === 0 && (
            <p className="mb-3 text-ink/80">{t.teams.noUnavailable}</p>
          )}
          <ul className="mb-4 space-y-1">
            {team.unavailableWeekly.map((w, i) => (
              <li key={`w${i}`} className="flex items-center justify-between gap-3 bg-flag/10 px-3 py-2">
                <span className="first-letter:uppercase">{formatWeekly(w)}</span>
                <RemoveButton
                  onClick={() => updateTeam(team.id, { unavailableWeekly: team.unavailableWeekly.filter((_, j) => j !== i) })}
                />
              </li>
            ))}
            {team.unavailable.map((w, i) => (
              <li key={`d${i}`} className="flex items-center justify-between gap-3 bg-flag/10 px-3 py-2">
                <span className="first-letter:uppercase">{formatWindow(w)}</span>
                <RemoveButton onClick={() => updateTeam(team.id, { unavailable: team.unavailable.filter((_, j) => j !== i) })} />
              </li>
            ))}
          </ul>
          <details>
            <summary className="btn btn-quiet w-full">{t.teams.addUnavailable}</summary>
            <div className="mt-3">
              <TimeWindowForm
                onAddDated={(w) =>
                  updateTeam(team.id, { unavailable: [...team.unavailable, w].sort((a, b) => a.start.localeCompare(b.start)) })
                }
                onAddWeekly={(w) => updateTeam(team.id, { unavailableWeekly: [...team.unavailableWeekly, w] })}
              />
            </div>
          </details>
        </section>
      </div>
    </article>
  );
}
