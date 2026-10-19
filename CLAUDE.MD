# CLAUDE.md — 6v6 Football Tournament Planner

## What we are building

A web app that organises a **6-a-side football (soccer) tournament** from start to finish:

1. Enter the teams and, for each team, the time slots when it **cannot** play.
2. Enter when the **pitch is available** (dates + time windows).
3. The app runs the **draw** (groups), generates the **group stage**, then the **knockout bracket up to the final**.
4. It produces a **match calendar** that respects every availability constraint.
5. Results can be entered as the tournament progresses; standings and the bracket update automatically.

Single pitch by default (number of pitches configurable later).

## Tournament format (fixed rules — encode as constants in `src/domain/rules.ts`)

- **6 v 6** (5 outfield players + 1 goalkeeper).
- **Squad: 8 players per team** (6 starters + 2 substitutes). Rolling substitutions allowed.
- **Match length: 40 min** = 2 halves of 20 min, **5 min half-time**.
- **Slot length on the pitch = 45 min + changeover buffer** (buffer default 5 min, configurable) → 50 min per slot by default.
- Points: **Win 3 / Draw 1 / Loss 0**.
- Group stage: draws allowed.
- Knockout: no draws. If level at full time → **penalty shoot-out** (default: 3 kicks each, then sudden death). No extra time by default (configurable: 2 × 5 min).

All durations, points and tie-break options must live in a single config object so they can be edited from the UI settings page.

## Tech stack

- **Vite + React + TypeScript** (strict mode)
- **Tailwind CSS** for styling
- **Zustand** for state, persisted to **localStorage** (no backend needed)
- **date-fns** for all date/time maths (never hand-roll time arithmetic)
- **Vitest** for unit tests
- Export: printable calendar view (CSS `@media print`), **PDF** (jsPDF or browser print), **.ics** file, and JSON import/export of the whole tournament.

UI language: **French** by default, all strings in `src/i18n/` so English/Arabic can be added.

## Project structure

```
src/
  domain/           # pure TypeScript, NO React — all logic lives here
    types.ts        # Team, TimeWindow, Slot, Match, Group, Standing, Bracket, Config
    rules.ts        # default config (durations, points, tie-breakers)
    rng.ts          # seeded random generator (mulberry32) — draws must be reproducible
    draw.ts         # group formation + random draw (optional pots/seeding)
    roundRobin.ts   # circle-method fixtures inside each group
    standings.ts    # table computation + tie-breakers
    knockout.ts     # bracket construction, byes, qualifier mapping
    slots.ts        # turns pitch availability into concrete slots
    scheduler.ts    # assigns matches to slots under constraints
    validate.ts     # input checks + human-readable conflict reports
  store/            # Zustand store
  components/
  pages/            # Teams, Pitch, Draw, Schedule, Standings, Bracket, Settings
  i18n/
tests/              # mirrors src/domain
```

Rule: **all business logic goes in `src/domain/` as pure functions** with unit tests. Components only display and dispatch.

## Data model (core)

```ts
type TimeWindow = { start: string; end: string }; // ISO datetime strings, local time
type Team = {
  id: string;
  name: string;
  players: string[];
  /* max 8 */ unavailable: TimeWindow[];
};
type Slot = { id: string; start: string; end: string; pitch: number };
type Match = {
  id: string;
  stage: "group" | "R16" | "QF" | "SF" | "THIRD" | "FINAL";
  groupId?: string;
  home: TeamRef;
  away: TeamRef; // TeamRef = concrete team id OR placeholder ("1st Group A", "Winner QF2")
  slotId?: string;
  result?: {
    home: number;
    away: number;
    penalties?: { home: number; away: number };
  };
};
```

## Inputs (UI)

- **Teams page**: add/edit/remove team, name, up to 8 players (warn if < 6), list of unavailable windows (date + from/to; also "whole day" and recurring weekday options).
- **Pitch page**: list of availability windows (date + from/to). Show how many slots each window produces.
- **Settings page**: slot buffer, min rest between a team's matches, max matches per team per day, third-place match on/off, extra time on/off, tie-break order, random seed.

## Group formation (draw.ts)

Pick group sizes automatically from the team count, preferring groups of 4, then 3 (avoid groups of 5+ and of 2):

| Teams | Groups                 | Qualify to knockout              |
| ----- | ---------------------- | -------------------------------- |
| 4     | 1 × 4                  | top 2 → final (or top 4 → semis) |
| 5     | 1 × 5                  | top 4 → semis                    |
| 6     | 2 × 3                  | top 2 per group → semis          |
| 7     | 1 × 4 + 1 × 3          | top 2 per group → semis          |
| 8     | 2 × 4                  | top 2 → semis                    |
| 9     | 3 × 3                  | top 2 + best 2 thirds → QF       |
| 10    | 2 × 3 + 1 × 4 or 2 × 5 | see generic rule                 |
| 12    | 3 × 4                  | top 2 + 2 best thirds → QF       |
| 16    | 4 × 4                  | top 2 → QF                       |

**Generic rule**: number of knockout places = largest power of 2 ≤ (2 × number of groups + reasonable best-thirds). Fill with group winners, runners-up, then best third-placed teams ranked across groups (compare points per match when group sizes differ). If not a power of 2, give **byes** to the best-ranked qualifiers.
The user may also override group count/size manually.

Draw: shuffle with the seeded RNG; optional **pots** (seeded teams go to different groups). Show the draw animated or step-by-step, with a "redraw" button that changes the seed.

## Fixtures

- Group stage: full **round-robin** in each group using the **circle method** (add a dummy team for odd sizes → that team rests).
- Knockout: standard bracket pairing that keeps same-group teams apart until as late as possible (1A vs 2B, 1B vs 2A, …).
- Knockout matches reference placeholders until the previous stage is decided; they are scheduled **before** teams are known.

## Scheduling (scheduler.ts) — the core algorithm

1. Generate slots from pitch windows: `slotLength = 45 + buffer` minutes; drop partial slots at the end of a window.
2. Order matches: group matchdays first (round by round), then R16 → QF → SF → (third place) → final.
3. **Hard constraints**
   - A match can only use a slot where **neither team is unavailable** (any overlap with an unavailable window = forbidden).
   - A team plays at most one match at a time, with at least `minRestMinutes` between its matches (default: one free slot).
   - `maxMatchesPerTeamPerDay` (default 2).
   - A knockout match is scheduled **after every match it depends on** (all relevant group matches / previous round).
   - Final is the last match of the tournament.
4. **Knockout availability with unknown teams**: for a placeholder (e.g. "1st Group A"), the allowed slots are the **intersection of availability of all teams that could fill it**. If that is empty, fall back to the best slot and flag a warning listing which possible teams would be unavailable.
5. **Soft goals** (scoring function): spread each team's matches evenly, avoid long idle gaps, keep the final in a good slot (e.g. last available evening), balance home/away labels.
6. Algorithm: **backtracking search with most-constrained-match-first ordering** (match with fewest valid slots placed first), plus a time/iteration limit. If no complete solution is found, return the best partial schedule **and** a clear list of unplaced matches with the reason (e.g. "Team X and Team Y have no common free slot on the available dates").
7. Must be deterministic for a given input + seed.

## Standings & tie-breakers (standings.ts)

Default order (configurable):

1. Points
2. Head-to-head points among tied teams
3. Head-to-head goal difference
4. Overall goal difference
5. Overall goals scored
6. Fair play (yellow −1, red −3) — optional field on results
7. Drawing of lots (seeded RNG)

## Outputs / views

- **Draw** view: groups as cards.
- **Calendar**: list by day + a timeline/grid (time × date), colour per stage; click a match to enter the score.
- **Per-team schedule** (filter).
- **Standings** tables per group, live.
- **Bracket** view (tree), filling in automatically from results.
- Exports: print/PDF, `.ics`, JSON backup/restore.

## Validation before generating

- At least 3 teams; names unique.
- Each team has 6–8 players (warn only).
- Total slots ≥ total matches (show "need N slots, you have M").
- Every team has at least as many free slots as matches it must play.
  Show errors in plain language, never just "no solution".

## Coding conventions

- TypeScript strict, no `any`.
- Domain functions are pure and fully unit-tested; write the test with the function.
- Times stored as ISO strings in local time (`Africa/Casablanca`); use date-fns for comparison/overlap.
- Small components, one per file.
- Commit after each working milestone.

## Commands

```
npm install
npm run dev        # start dev server
npm run test       # vitest
npm run build
```

## Build order (milestones)

1. Scaffold Vite + React + TS + Tailwind + Vitest + Zustand.
2. `types.ts`, `rules.ts`, `rng.ts`.
3. `draw.ts` + `roundRobin.ts` + tests.
4. `slots.ts` + `scheduler.ts` + tests (include impossible-input tests).
5. `standings.ts` + `knockout.ts` + tests.
6. Teams / Pitch / Settings pages with persistence.
7. Draw, Calendar, Standings, Bracket pages.
8. Result entry + automatic bracket progression.
9. Exports (print/PDF, .ics, JSON).
10. Polish: responsive layout, French UI copy, empty states.

## Test scenarios to keep passing

- 8 teams, 2 groups, plenty of slots → full schedule, final last.
- 6 teams where two teams share no free slot → clear conflict message.
- 9 teams → 3 groups of 3, best thirds correctly ranked.
- Odd group size → each team rests once per round correctly.
- Same input + same seed → identical draw and calendar.
