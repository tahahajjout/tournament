import type { Stage } from "../domain/types";
import { t } from "../i18n";

/** One colour per stage, from the photos (turf, futsal-court blue, sand, kit red), shared by calendar and bracket. */
export const STAGE_STYLE: Record<Stage, string> = {
  group: "bg-turf text-ink",
  R16: "bg-[#d9e4f2] text-ink",
  QF: "bg-[#efe1c4] text-ink",
  SF: "bg-[#f4d3cc] text-ink",
  THIRD: "bg-[#ddd8cc] text-ink",
  FINAL: "bg-flag text-white",
};

export function StageBadge({ stage, label }: { stage: Stage; label?: string }) {
  return (
    <span className={`px-2 py-0.5 text-sm font-semibold whitespace-nowrap ${STAGE_STYLE[stage]}`}>
      {label ?? t.stages[stage]}
    </span>
  );
}
