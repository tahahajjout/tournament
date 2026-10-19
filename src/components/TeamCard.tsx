import { useState, type FormEvent } from "react";
import type { Team } from "../domain/types";
import { formatWeekly, formatWindow, t } from "../i18n";
import { useTournament } from "../store/useTournament";
import { RemoveButton } from "./RemoveButton";
import { TimeWindowForm } from "./TimeWindowForm";

export function TeamCard({ team, duplicateName }: { team: Team; duplicateName: boolean }) {
  const { updateTeam, removeTeam, config } = useTournament();
  const [player, setPlayer] = useState("");
  const full = team.players.length >= config.maxSquadSize;

  const addPlayer = (e: FormEvent) => {
    e.preventDefault();
    if (!player.trim() || full) return;
    updateTeam(team.id, { players: [...team.players, player.trim()] });
    setPlayer("");
  };

  return (
    <article className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <label className="sr-only" htmlFor={`name-${team.id}`}>
          {t.teams.name}
        </label>
        <input
          id={`name-${team.id}`}
          className="flex-1 rounded border border-slate-300 px-2 py-1 text-lg font-semibold"
          value={team.name}
          onChange={(e) => updateTeam(team.id, { name: e.target.value })}
        />
        <RemoveButton onClick={() => confirm(t.teams.confirmRemove(team.name)) && removeTeam(team.id)} />
      </div>
      {duplicateName && <p className="text-sm text-red-700">{t.teams.duplicateName}</p>}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">
          {t.teams.players(team.players.length, config.maxSquadSize)}
        </h3>
        <ol className="mb-2 grid gap-1 sm:grid-cols-2">
          {team.players.map((p, i) => (
            <li key={i} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-sm">
              <span>
                {i + 1}. {p}
              </span>
              <RemoveButton
                onClick={() => updateTeam(team.id, { players: team.players.filter((_, j) => j !== i) })}
              />
            </li>
          ))}
        </ol>
        {!full && (
          <form onSubmit={addPlayer} className="flex gap-2">
            <input
              className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm"
              placeholder={t.teams.playerPlaceholder}
              aria-label={t.teams.playerPlaceholder}
              value={player}
              onChange={(e) => setPlayer(e.target.value)}
            />
            <button className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100">
              {t.teams.addPlayer}
            </button>
          </form>
        )}
        {team.players.length < config.playersOnPitch && (
          <p className="mt-2 text-sm text-amber-700">{t.teams.tooFewPlayers(config.playersOnPitch)}</p>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">{t.teams.unavailable}</h3>
        {team.unavailable.length + team.unavailableWeekly.length === 0 && (
          <p className="mb-2 text-sm text-slate-500">{t.teams.noUnavailable}</p>
        )}
        <ul className="mb-3 space-y-1">
          {team.unavailableWeekly.map((w, i) => (
            <li key={`w${i}`} className="flex items-center justify-between rounded bg-amber-50 px-2 py-1 text-sm">
              {formatWeekly(w)}
              <RemoveButton
                onClick={() =>
                  updateTeam(team.id, { unavailableWeekly: team.unavailableWeekly.filter((_, j) => j !== i) })
                }
              />
            </li>
          ))}
          {team.unavailable.map((w, i) => (
            <li key={`d${i}`} className="flex items-center justify-between rounded bg-amber-50 px-2 py-1 text-sm">
              {formatWindow(w)}
              <RemoveButton
                onClick={() => updateTeam(team.id, { unavailable: team.unavailable.filter((_, j) => j !== i) })}
              />
            </li>
          ))}
        </ul>
        <TimeWindowForm
          onAddDated={(w) =>
            updateTeam(team.id, {
              unavailable: [...team.unavailable, w].sort((a, b) => a.start.localeCompare(b.start)),
            })
          }
          onAddWeekly={(w) => updateTeam(team.id, { unavailableWeekly: [...team.unavailableWeekly, w] })}
        />
      </section>
    </article>
  );
}
