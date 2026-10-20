import { useEffect, useState } from "react";
import { GroupCard } from "../components/GroupCard";
import { IssueList } from "../components/IssueList";
import { StarIcon } from "../components/StarIcon";
import { evenSizes, groupSizes } from "../domain/draw";
import { isWarning, validate } from "../domain/validate";
import { t } from "../i18n";
import { useTournament } from "../store/useTournament";

export function DrawPage() {
  const { teams, groups, bracket, seeds, config, toggleSeed, runDraw, updateConfig } = useTournament();
  const [groupCount, setGroupCount] = useState(0); // 0 = automatic
  const [revealed, setRevealed] = useState(Infinity);

  const n = teams.length;
  const issues = validate({ teams, config, groups: groups.length ? groups : undefined });
  const blocked = issues.some((i) => !isWarning(i) && i.code !== "drawStale");

  // Reveal order follows the draw: first team of each group, then second of each group, …
  const order = Array.from({ length: Math.max(0, ...groups.map((g) => g.teamIds.length)) }, (_, j) =>
    groups.flatMap((g) => g.teamIds[j] ?? []),
  ).flat();
  useEffect(() => {
    if (revealed >= order.length) return;
    const id = setTimeout(() => setRevealed((r) => r + 1), 450);
    return () => clearTimeout(id);
  }, [revealed, order.length]);

  const onDraw = () => {
    if (groups.length) {
      if (!confirm(t.draw.confirmRerun)) return;
      updateConfig({ seed: config.seed + 1 });
    }
    runDraw(groupCount ? evenSizes(n, groupCount) : undefined);
    setRevealed(0);
  };

  return (
    <div className="grid gap-x-12 gap-y-10 lg:grid-cols-[1fr_22rem]">
      <section className="space-y-6 lg:order-2">
        <IssueList issues={issues} />
        {n >= 3 && (
          <div className="space-y-6 print:hidden">
            <div>
              <h2 className="section-title">{t.draw.seeds}</h2>
              <p className="mt-2 mb-3">{t.draw.seedsHint}</p>
              <div className="flex flex-wrap gap-1">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    aria-pressed={seeds.includes(team.id)}
                    onClick={() => toggleSeed(team.id)}
                    className="btn min-h-10 bg-white px-3 font-semibold aria-pressed:bg-ink aria-pressed:text-white"
                  >
                    {seeds.includes(team.id) && <StarIcon className="text-[#f5c542]" />}
                    {team.name}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex flex-col gap-1 font-semibold">
              {t.draw.groupCount}
              <select className="field" value={groupCount} onChange={(e) => setGroupCount(Number(e.target.value))}>
                <option value={0}>{t.draw.auto(groupSizes(n))}</option>
                {Array.from({ length: Math.floor(n / 3) }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>
                    {t.draw.manual(evenSizes(n, g))}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={onDraw} disabled={blocked} className="btn btn-primary min-h-14 w-full text-lg">
              {groups.length ? t.draw.rerun : t.draw.run}
            </button>
            {revealed < order.length && (
              <button className="btn btn-quiet w-full" onClick={() => setRevealed(Infinity)}>
                {t.draw.revealAll}
              </button>
            )}
          </div>
        )}
      </section>

      <section className="space-y-6">
        {groups.length === 0 ? (
          <p className="bg-turf p-6 text-lg">{t.draw.empty}</p>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2">
              {groups.map((g) => (
                <GroupCard key={g.id} group={g} seeds={seeds} isRevealed={(id) => order.indexOf(id) < revealed} />
              ))}
            </div>
            <p className="text-lg">
              {bracket[0] &&
                t.draw.format(
                  bracket[0].matchIds.length * 2,
                  bracket[0].stage === "FINAL" ? t.stages.FINAL : t.roundTitles[bracket[0].stage],
                )}{" "}
              {t.draw.seed(config.seed)}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
