import type { MatchResult } from "../domain/types";
import { t } from "../i18n";

export function Score({ result }: { result?: MatchResult }) {
  if (!result) return <span className="text-ink/50">–</span>;
  return (
    <span className="font-semibold tabular-nums whitespace-nowrap">
      {result.home} – {result.away}
      {result.penalties && (
        <span className="ml-1 text-xs font-normal text-ink/70">
          ({result.penalties.home}–{result.penalties.away} {t.result.penaltiesShort})
        </span>
      )}
    </span>
  );
}
