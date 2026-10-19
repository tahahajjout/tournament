import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_CONFIG } from "../domain/rules";
import type { Config, Team, TimeWindow } from "../domain/types";

type State = {
  teams: Team[];
  pitchWindows: TimeWindow[];
  config: Config;
  addTeam: (name: string) => void;
  updateTeam: (id: string, patch: Partial<Omit<Team, "id">>) => void;
  removeTeam: (id: string) => void;
  addPitchWindow: (w: TimeWindow) => void;
  removePitchWindow: (w: TimeWindow) => void;
  updateConfig: (patch: Partial<Config>) => void;
  resetConfig: () => void;
};

export const useTournament = create<State>()(
  persist(
    (set) => ({
      teams: [],
      pitchWindows: [],
      config: DEFAULT_CONFIG,
      addTeam: (name) =>
        set((s) => ({
          teams: [...s.teams, { id: crypto.randomUUID(), name, players: [], unavailable: [], unavailableWeekly: [] }],
        })),
      updateTeam: (id, patch) => set((s) => ({ teams: s.teams.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      removeTeam: (id) => set((s) => ({ teams: s.teams.filter((t) => t.id !== id) })),
      addPitchWindow: (w) =>
        set((s) => ({ pitchWindows: [...s.pitchWindows, w].sort((a, b) => a.start.localeCompare(b.start)) })),
      removePitchWindow: (w) => set((s) => ({ pitchWindows: s.pitchWindows.filter((x) => x !== w) })),
      updateConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
      resetConfig: () => set({ config: DEFAULT_CONFIG }),
    }),
    {
      name: "tournament",
      version: 1,
      // New config keys added in later versions fall back to their defaults.
      merge: (persisted, current) => {
        const p = persisted as Partial<State>;
        return { ...current, ...p, config: { ...DEFAULT_CONFIG, ...p.config } };
      },
    },
  ),
);
