/** ISO datetime strings, local time (Africa/Casablanca). */
export type TimeWindow = { start: string; end: string };

/** Recurring unavailability: every given weekday (0 = Sunday … 6 = Saturday), "HH:mm" local times. */
export type WeeklyWindow = { weekday: number; from: string; to: string };

export type Team = {
  id: string;
  name: string;
  /** max 8 */
  players: string[];
  unavailable: TimeWindow[];
  unavailableWeekly: WeeklyWindow[];
  /** If non-empty, the team can only play inside these weekly windows. */
  availableWeekly?: WeeklyWindow[];
};

export type Slot = { id: string; start: string; end: string; pitch: number };

export type KnockoutStage = "R16" | "QF" | "SF" | "THIRD" | "FINAL";
export type Stage = "group" | KnockoutStage;

/** Where a not-yet-known knockout team will come from. */
export type Placeholder =
  | { type: "groupPosition"; groupId: string; position: number } // 1 = winner
  | { type: "bestRanked"; position: number; rank: number } // e.g. 2nd best 3rd-placed team
  | { type: "winner"; matchId: string }
  | { type: "loser"; matchId: string };

export type TeamRef = { teamId: string } | { placeholder: Placeholder };

export type Cards = { yellow: number; red: number };

export type MatchResult = {
  home: number;
  away: number;
  penalties?: { home: number; away: number };
  cards?: { home: Cards; away: Cards };
};

export type Match = {
  id: string;
  stage: Stage;
  groupId?: string;
  /** Group matchday (1-based), used for scheduling order. */
  round?: number;
  home: TeamRef;
  away: TeamRef;
  slotId?: string;
  result?: MatchResult;
};

export type Group = { id: string; name: string; teamIds: string[] };

export type Standing = {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  fairPlay: number;
};

export type Bracket = { stage: KnockoutStage; matchIds: string[] }[];

export type TieBreaker =
  | "points"
  | "headToHeadPoints"
  | "headToHeadGoalDifference"
  | "goalDifference"
  | "goalsFor"
  | "fairPlay"
  | "lots";

export type Config = {
  playersOnPitch: number;
  maxSquadSize: number;
  halves: number;
  halfMinutes: number;
  halfTimeMinutes: number;
  /** Changeover time added after each match slot. */
  bufferMinutes: number;
  points: { win: number; draw: number; loss: number };
  penaltyKicks: number;
  extraTime: boolean;
  extraTimeHalfMinutes: number;
  thirdPlaceMatch: boolean;
  minRestMinutes: number;
  maxMatchesPerTeamPerDay: number;
  tieBreakers: TieBreaker[];
  fairPlayPenalty: Cards;
  pitches: number;
  seed: number;
  timeZone: string;
};
