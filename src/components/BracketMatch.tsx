import { winnerSide } from "../domain/knockout";
import type { Match, Slot } from "../domain/types";
import { formatShortDay, formatTime, matchTitle, t } from "../i18n";
import { STAGE_STYLE } from "./StageBadge";
import { TeamName } from "./TeamName";

export function BracketMatch({ match, slot, onSelect }: { match: Match; slot?: Slot; onSelect: () => void }) {
  const won = winnerSide(match.result);
  const r = match.result;
  const row = (s: "home" | "away") => (
    <div className={`flex items-center justify-between gap-3 px-4 py-2.5 text-base ${won === s ? "bg-pitch/12" : ""}`}>
      <TeamName teamRef={match[s]} bold={won === s} />
      <span className={`font-display text-2xl leading-none tabular-nums ${won === s ? "" : "text-ink/60"}`}>
        {r ? r[s] : ""}
        {r?.penalties && <sup className="ml-0.5 text-xs">({r.penalties[s]})</sup>}
      </span>
    </div>
  );

  return (
    <button
      onClick={onSelect}
      className="w-64 bg-white text-left transition-transform duration-150 hover:-translate-y-0.5"
    >
      <div className={`flex justify-between gap-2 px-4 py-1.5 text-sm ${STAGE_STYLE[match.stage]}`}>
        <span className="font-semibold">{match.stage === "THIRD" ? t.roundShort.THIRD : matchTitle(match)}</span>
        {slot && (
          <span>
            {formatShortDay(slot.start)} {formatTime(slot.start)}
          </span>
        )}
      </div>
      {row("home")}
      {row("away")}
    </button>
  );
}
