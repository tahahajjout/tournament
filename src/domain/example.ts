import { addDays, format, nextMonday } from "date-fns";
import { expandWeekly } from "./slots";
import type { Team, TimeWindow, WeeklyWindow } from "./types";

const NAMES = ["Atlas FC", "Derb Sultan", "Hay Hassani", "Maârif United", "Ain Diab", "Bourgogne SC", "Sidi Maârouf", "Oasis Club"];
const PLAYERS = ["Yassine", "Hamza", "Omar", "Ayoub", "Mehdi", "Anas", "Karim", "Reda", "Ilyas", "Soufiane", "Imane", "Salma"];

/** A ready-to-try tournament: 8 teams (one with weekly availability), the pitch free 3 evenings a week for 3 weeks. */
export function exampleTournament(today: Date): { teams: Team[]; pitchWindows: TimeWindow[]; pitchWeek: WeeklyWindow[] } {
  const from = nextMonday(today);
  const day = (n: number) => format(addDays(from, n), "yyyy-MM-dd");
  const teams = NAMES.map((name, i): Team => ({
    id: `exemple-${i + 1}`,
    name,
    players: Array.from({ length: 6 + (i % 3) }, (_, j) => PLAYERS[(i * 3 + j) % PLAYERS.length]!),
    unavailable: i === 2 ? [{ start: `${day(1)}T00:00`, end: `${day(1)}T23:59` }] : [],
    unavailableWeekly: i === 5 ? [{ weekday: 4, from: "18:00", to: "20:00" }] : [],
    availableWeekly: i === 7 ? [{ weekday: 2, from: "18:00", to: "22:30" }, { weekday: 6, from: "10:00", to: "18:00" }] : [],
  }));
  const pitchWeek = [
    { weekday: 2, from: "18:00", to: "22:30" },
    { weekday: 4, from: "18:00", to: "22:30" },
    { weekday: 6, from: "10:00", to: "18:30" },
  ];
  return { teams, pitchWindows: expandWeekly(pitchWeek, day(0), day(20)), pitchWeek };
}
