// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeAll, expect, test } from "vitest";
import { resolveTeam } from "../src/domain/knockout";
import type { Match } from "../src/domain/types";
import { BracketPage } from "../src/pages/BracketPage";
import { CalendarPage } from "../src/pages/CalendarPage";
import { DrawPage } from "../src/pages/DrawPage";
import { PitchPage } from "../src/pages/PitchPage";
import { SettingsPage } from "../src/pages/SettingsPage";
import { StandingsPage } from "../src/pages/StandingsPage";
import { TeamsPage } from "../src/pages/TeamsPage";
import { useTournament } from "../src/store/useTournament";

const store = () => useTournament.getState();
const winner = (id: string) => {
  const s = store();
  return resolveTeam({ placeholder: { type: "winner", matchId: id } }, s.groups, s.matches, s.config);
};
/** Enter a result for every match of a stage whose teams are known: home wins, or a draw settled on penalties. */
const playStage = (stage: Match["stage"]) => {
  for (const m of store().matches.filter((x) => x.stage === stage)) {
    const s = store();
    const known = [m.home, m.away].every((r) => resolveTeam(r, s.groups, s.matches, s.config));
    expect(known).toBe(true);
    s.setResult(m.id, stage === "SF" ? { home: 1, away: 1, penalties: { home: 3, away: 2 } } : { home: 2, away: 1 });
  }
};

beforeAll(() => {
  const s = store();
  for (let i = 1; i <= 8; i++) {
    s.addTeam(`Équipe ${i}`);
  }
  for (const team of store().teams) s.updateTeam(team.id, { players: ["a", "b", "c", "d", "e", "f"] });
  s.addPitchWindows([1, 2, 3, 4].map((d) => ({ start: `2026-11-0${d}T14:00`, end: `2026-11-0${d}T22:20` })));
});

test("full tournament flow through the store, bracket fills in from results", () => {
  store().runDraw();
  expect(store().groups.map((g) => g.teamIds.length)).toEqual([4, 4]);

  store().generateCalendar();
  expect(store().unplaced).toEqual([]);
  expect(store().matches.every((m) => m.slotId)).toBe(true);

  expect(winner("SF1")).toBeUndefined();
  playStage("group");
  playStage("SF");
  expect(winner("SF1")).toBeDefined();
  playStage("THIRD");
  playStage("FINAL");
  expect(winner("FINAL")).toBe(winner("SF1"));

  // Regenerating keeps the results.
  store().generateCalendar();
  expect(store().matches.every((m) => m.result)).toBe(true);
});

test("every page renders with a full tournament", () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const text = (Page: () => React.JSX.Element) => {
    const el = document.createElement("div");
    const root = createRoot(el);
    act(() => root.render(<Page />));
    const out = el.textContent ?? "";
    act(() => root.unmount());
    return out;
  };
  expect(text(TeamsPage)).toContain("Choisir les horaires de la semaine");
  expect(text(DrawPage)).toMatch(/Groupe\s*B/);
  expect(text(PitchPage)).toContain("Total : 40 créneaux");
  expect(text(SettingsPage)).toContain("Durée d'un créneau : 50 min");
  const calendar = text(CalendarPage);
  expect(calendar).toContain("Équipe 1");
  expect(calendar).toContain("2 – 1");
  expect(text(StandingsPage)).toContain("Équipe 1");
  const bracket = text(BracketPage);
  expect(bracket).toContain("Finale");
  expect(bracket).toContain("1(3)"); // SF 1–1, won 3–2 on penalties
});
