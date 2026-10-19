import type { Config } from "./types";

export const DEFAULT_CONFIG: Config = {
  playersOnPitch: 6,
  maxSquadSize: 8,
  halves: 2,
  halfMinutes: 20,
  halfTimeMinutes: 5,
  bufferMinutes: 5,
  points: { win: 3, draw: 1, loss: 0 },
  penaltyKicks: 3,
  extraTime: false,
  extraTimeHalfMinutes: 5,
  thirdPlaceMatch: true,
  minRestMinutes: 50, // one free slot at default slot length
  maxMatchesPerTeamPerDay: 2,
  tieBreakers: [
    "points",
    "headToHeadPoints",
    "headToHeadGoalDifference",
    "goalDifference",
    "goalsFor",
    "fairPlay",
    "lots",
  ],
  fairPlayPenalty: { yellow: 1, red: 3 },
  pitches: 1,
  seed: 1,
  timeZone: "Africa/Casablanca",
};

/** Minutes a match occupies the pitch (playing time + half-time), without buffer. */
export const matchMinutes = (c: Config): number =>
  c.halves * c.halfMinutes + (c.halves - 1) * c.halfTimeMinutes;

/** Pitch slot length: match + changeover buffer (50 min by default). */
export const slotMinutes = (c: Config): number => matchMinutes(c) + c.bufferMinutes;
