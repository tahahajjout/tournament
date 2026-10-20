import { useState, type FormEvent } from "react";
import { TeamCard } from "../components/TeamCard";
import { t } from "../i18n";
import { useTournament } from "../store/useTournament";

export function TeamsPage() {
  const { teams, addTeam, loadExample } = useTournament();
  const [name, setName] = useState("");
  const key = (n: string) => n.trim().toLocaleLowerCase("fr");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addTeam(name.trim());
    setName("");
  };

  return (
    <div className="space-y-10">
      <form onSubmit={submit} className="flex flex-col gap-3 bg-pitch p-6 text-white sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-2 text-lg font-bold">
          {t.teams.newTeamPlaceholder}
          <input
            className="min-h-14 bg-white px-4 text-xl text-ink"
            placeholder={t.teams.newTeamExample}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button className="btn min-h-14 bg-ink px-8 text-lg text-white hover:bg-black">{t.teams.addTeam}</button>
      </form>
      {teams.length === 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-turf p-6">
          <p className="max-w-xl text-lg">
            {t.teams.empty} {t.example.hint}
          </p>
          <button className="btn btn-quiet bg-white" onClick={loadExample}>
            {t.example.load}
          </button>
        </div>
      )}
      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          duplicateName={teams.some((o) => o.id !== team.id && key(o.name) === key(team.name))}
        />
      ))}
    </div>
  );
}
