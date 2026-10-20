import type { TieBreaker } from "../domain/types";
import { t } from "../i18n";

export function TieBreakerList({ value, onChange }: { value: TieBreaker[]; onChange: (v: TieBreaker[]) => void }) {
  const move = (i: number, by: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + by]] = [next[i + by]!, next[i]!];
    onChange(next);
  };
  const btn = "btn btn-quiet min-h-9 px-3 bg-white";

  return (
    <ol className="space-y-1">
      {value.map((tb, i) => (
        <li key={tb} className="flex items-center gap-2 bg-turf px-3 py-1.5">
          <span className="w-6 font-display text-2xl leading-none text-pitch">{i + 1}</span>
          <span className="flex-1">{t.settings.tieBreakers[tb]}</span>
          <button type="button" className={btn} disabled={i === 0} onClick={() => move(i, -1)} aria-label={t.settings.moveUp}>
            ↑
          </button>
          <button
            type="button"
            className={btn}
            disabled={i === value.length - 1}
            onClick={() => move(i, 1)}
            aria-label={t.settings.moveDown}
          >
            ↓
          </button>
        </li>
      ))}
    </ol>
  );
}
