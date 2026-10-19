import { useState, type FormEvent } from "react";
import { TeamCard } from "../components/TeamCard";
import { t } from "../i18n";
import { useTournament } from "../store/useTournament";

export function TeamsPage() {
  const { teams, addTeam } = useTournament();
  const [name, setName] = useState("");
  const key = (n: string) => n.trim().toLocaleLowerCase("fr");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addTeam(name.trim());
    setName("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold">{t.teams.title}</h2>
        <span className="text-sm text-slate-500">{t.teams.count(teams.length)}</span>
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          className="flex-1 rounded border border-slate-300 px-3 py-2"
          placeholder={t.teams.newTeamPlaceholder}
          aria-label={t.teams.newTeamPlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="rounded bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800">
          {t.teams.addTeam}
        </button>
      </form>
      {teams.length === 0 && <p className="text-slate-500">{t.teams.empty}</p>}
      <div className="space-y-4">
        {teams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            duplicateName={teams.some((o) => o.id !== team.id && key(o.name) === key(team.name))}
          />
        ))}
      </div>
    </div>
  );
}
