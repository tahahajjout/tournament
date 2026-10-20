import type { ReactNode } from "react";
import { BackupSection } from "../components/BackupSection";
import { NumberField } from "../components/NumberField";
import { TieBreakerList } from "../components/TieBreakerList";
import { Toggle } from "../components/Toggle";
import { slotMinutes } from "../domain/rules";
import { t } from "../i18n";
import { useTournament } from "../store/useTournament";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel space-y-3">
      <h2 className="section-title mb-4">{title}</h2>
      {children}
    </section>
  );
}

export function SettingsPage() {
  const { config: c, updateConfig: set, resetConfig } = useTournament();
  const s = t.settings;

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button className="btn btn-quiet" onClick={() => confirm(s.confirmReset) && resetConfig()}>
          {s.reset}
        </button>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Section title={s.sections.match}>
          <NumberField label={s.halfMinutes} min={1} value={c.halfMinutes} onChange={(v) => set({ halfMinutes: v })} />
          <NumberField label={s.halfTimeMinutes} value={c.halfTimeMinutes} onChange={(v) => set({ halfTimeMinutes: v })} />
          <NumberField label={s.bufferMinutes} value={c.bufferMinutes} onChange={(v) => set({ bufferMinutes: v })} />
          <p className="text-sm text-ink/70">{s.slotLength(slotMinutes(c))}</p>
        </Section>
        <Section title={s.sections.schedule}>
          <NumberField label={s.pitches} min={1} value={c.pitches} onChange={(v) => set({ pitches: v })} />
          <NumberField label={s.minRestMinutes} value={c.minRestMinutes} onChange={(v) => set({ minRestMinutes: v })} />
          <NumberField
            label={s.maxMatchesPerTeamPerDay}
            min={1}
            value={c.maxMatchesPerTeamPerDay}
            onChange={(v) => set({ maxMatchesPerTeamPerDay: v })}
          />
        </Section>
        <Section title={s.sections.points}>
          <NumberField label={s.win} value={c.points.win} onChange={(v) => set({ points: { ...c.points, win: v } })} />
          <NumberField label={s.draw} value={c.points.draw} onChange={(v) => set({ points: { ...c.points, draw: v } })} />
          <NumberField label={s.loss} value={c.points.loss} onChange={(v) => set({ points: { ...c.points, loss: v } })} />
        </Section>
        <Section title={s.sections.knockout}>
          <Toggle label={s.thirdPlaceMatch} checked={c.thirdPlaceMatch} onChange={(v) => set({ thirdPlaceMatch: v })} />
          <Toggle label={s.extraTime} checked={c.extraTime} onChange={(v) => set({ extraTime: v })} />
          {c.extraTime && (
            <NumberField
              label={s.extraTimeHalfMinutes}
              min={1}
              value={c.extraTimeHalfMinutes}
              onChange={(v) => set({ extraTimeHalfMinutes: v })}
            />
          )}
          <NumberField label={s.penaltyKicks} min={1} value={c.penaltyKicks} onChange={(v) => set({ penaltyKicks: v })} />
          <p className="text-xs text-ink/70">{s.knockoutNote}</p>
        </Section>
        <Section title={s.sections.tieBreakers}>
          <TieBreakerList value={c.tieBreakers} onChange={(v) => set({ tieBreakers: v })} />
          <NumberField
            label={s.fairPlayYellow}
            value={c.fairPlayPenalty.yellow}
            onChange={(v) => set({ fairPlayPenalty: { ...c.fairPlayPenalty, yellow: v } })}
          />
          <NumberField
            label={s.fairPlayRed}
            value={c.fairPlayPenalty.red}
            onChange={(v) => set({ fairPlayPenalty: { ...c.fairPlayPenalty, red: v } })}
          />
        </Section>
        <Section title={s.sections.draw}>
          <NumberField label={s.seed} value={c.seed} onChange={(v) => set({ seed: v })} />
        </Section>
        <Section title={t.backup.title}>
          <BackupSection />
        </Section>
      </div>
    </div>
  );
}
