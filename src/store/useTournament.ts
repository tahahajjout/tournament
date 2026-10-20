import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TournamentData } from "../domain/backup";
import { draw } from "../domain/draw";
import { exampleTournament } from "../domain/example";
import { buildKnockout } from "../domain/knockout";
import { groupMatches } from "../domain/roundRobin";
import { DEFAULT_CONFIG } from "../domain/rules";
import { schedule } from "../domain/scheduler";
import { generateSlots } from "../domain/slots";
import type { Config, Group, MatchResult, Team, TimeWindow, WeeklyWindow } from "../domain/types";

type Actions = {
  addTeam: (name: string) => void;
  updateTeam: (id: string, patch: Partial<Omit<Team, "id">>) => void;
  removeTeam: (id: string) => void;
  /** Add windows, skipping exact duplicates (e.g. a weekly template applied twice). */
  addPitchWindows: (ws: TimeWindow[]) => void;
  clearPitchWindows: () => void;
  setPitchWeek: (w: WeeklyWindow[]) => void;
  removePitchWindow: (w: TimeWindow) => void;
  updateConfig: (patch: Partial<Config>) => void;
  resetConfig: () => void;
  toggleSeed: (teamId: string) => void;
  /** Draw groups with the current seed (sizes = manual override), build all fixtures, clear the calendar. */
  runDraw: (sizes?: number[]) => void;
  /** Rebuild the knockout from the current settings and (re)assign every match to a slot; results are kept. */
  generateCalendar: () => void;
  setResult: (matchId: string, result: MatchResult | undefined) => void;
  importData: (data: TournamentData) => void;
  /** Replace everything with a sample tournament, drawn and scheduled. */
  loadExample: () => void;
};

const NO_DRAW = { groups: [], matches: [], bracket: [], slots: [], unplaced: [], warnings: [] };

const fixtures = (groups: Group[], config: Config) => {
  const ko = buildKnockout(groups, config);
  return { matches: [...groups.flatMap(groupMatches), ...ko.matches], bracket: ko.bracket };
};

export const useTournament = create<TournamentData & Actions>()(
  persist(
    (set, get) => ({
      teams: [],
      pitchWindows: [],
      pitchWeek: [],
      config: DEFAULT_CONFIG,
      seeds: [],
      ...NO_DRAW,
      addTeam: (name) =>
        set((s) => ({
          teams: [...s.teams, { id: crypto.randomUUID(), name, players: [], unavailable: [], unavailableWeekly: [] }],
        })),
      updateTeam: (id, patch) => set((s) => ({ teams: s.teams.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      removeTeam: (id) => set((s) => ({ teams: s.teams.filter((t) => t.id !== id), seeds: s.seeds.filter((x) => x !== id) })),
      addPitchWindows: (ws) =>
        set((s) => {
          const key = (w: TimeWindow) => `${w.start}|${w.end}`;
          const seen = new Set(s.pitchWindows.map(key));
          const fresh = ws.filter((w) => !seen.has(key(w)) && seen.add(key(w)));
          return { pitchWindows: [...s.pitchWindows, ...fresh].sort((a, b) => a.start.localeCompare(b.start)) };
        }),
      clearPitchWindows: () => set({ pitchWindows: [] }),
      setPitchWeek: (pitchWeek) => set({ pitchWeek }),
      removePitchWindow: (w) => set((s) => ({ pitchWindows: s.pitchWindows.filter((x) => x !== w) })),
      updateConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
      resetConfig: () => set({ config: DEFAULT_CONFIG }),
      toggleSeed: (teamId) =>
        set((s) => ({ seeds: s.seeds.includes(teamId) ? s.seeds.filter((x) => x !== teamId) : [...s.seeds, teamId] })),
      runDraw: (sizes) =>
        set((s) => {
          const seeds = s.seeds.filter((id) => s.teams.some((t) => t.id === id));
          const groups = draw(
            s.teams.map((t) => t.id),
            s.config.seed,
            { sizes, pots: seeds.length ? [seeds] : undefined },
          );
          return { ...NO_DRAW, groups, ...fixtures(groups, s.config) };
        }),
      generateCalendar: () =>
        set((s) => {
          const results = new Map(s.matches.map((m) => [m.id, m.result]));
          const { matches, bracket } = fixtures(s.groups, s.config);
          const withResults = matches.map((m) => {
            const result = results.get(m.id);
            return result ? { ...m, result } : m;
          });
          const slots = generateSlots(s.pitchWindows, s.config);
          const r = schedule({ matches: withResults, slots, teams: s.teams, groups: s.groups, config: s.config });
          return { matches: r.matches, bracket, slots, unplaced: r.unplaced, warnings: r.warnings };
        }),
      setResult: (matchId, result) =>
        set((s) => ({
          matches: s.matches.map((m) => {
            if (m.id !== matchId) return m;
            const { result: _, ...rest } = m;
            return result ? { ...rest, result } : rest;
          }),
        })),
      importData: (data) => set(data),
      loadExample: () => {
        set({ ...NO_DRAW, ...exampleTournament(new Date()), seeds: [], config: DEFAULT_CONFIG });
        get().runDraw();
        get().generateCalendar();
      },
    }),
    {
      name: "tournament",
      version: 1,
      partialize: ({ teams, pitchWindows, pitchWeek, config, seeds, groups, matches, bracket, slots, unplaced, warnings }) => ({
        teams, pitchWindows, pitchWeek, config, seeds, groups, matches, bracket, slots, unplaced, warnings,
      }),
      // New config keys added in later versions fall back to their defaults.
      merge: (persisted, current) => {
        const p = persisted as Partial<TournamentData>;
        return { ...current, ...p, config: { ...DEFAULT_CONFIG, ...p.config } };
      },
    },
  ),
);

/** Current tournament data only (for JSON export). */
export const exportData = (): TournamentData => {
  const { teams, pitchWindows, pitchWeek, config, seeds, groups, matches, bracket, slots, unplaced, warnings } =
    useTournament.getState();
  return { teams, pitchWindows, pitchWeek, config, seeds, groups, matches, bracket, slots, unplaced, warnings };
};

// Dev only: lets local tooling (screenshots, debugging) drive the store from the console.
if (import.meta.env.DEV) (window as unknown as { __tournament: typeof useTournament }).__tournament = useTournament;
