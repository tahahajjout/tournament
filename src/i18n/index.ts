import { format, parseISO } from "date-fns";
import { fr as frLocale } from "date-fns/locale";
import type { TieBreaker, TimeWindow, WeeklyWindow } from "../domain/types";

const fr = {
  appTitle: "Tournoi de football 6 contre 6",
  nav: { teams: "Équipes", pitch: "Terrain", settings: "Paramètres" },
  common: {
    add: "Ajouter",
    remove: "Supprimer",
    date: "Date",
    from: "De",
    to: "À",
    wholeDay: "Toute la journée",
    weekly: "Chaque semaine",
    weekday: "Jour",
    endBeforeStart: "L'heure de fin doit être après l'heure de début.",
  },
  teams: {
    title: "Équipes",
    newTeamPlaceholder: "Nom de l'équipe",
    addTeam: "Ajouter l'équipe",
    empty: "Aucune équipe pour l'instant. Ajoutez-en au moins 3 pour lancer un tournoi.",
    count: (n: number) => `${n} équipe${n > 1 ? "s" : ""}`,
    name: "Nom",
    duplicateName: "Une autre équipe porte déjà ce nom.",
    players: (n: number, max: number) => `Joueurs (${n}/${max})`,
    playerPlaceholder: "Nom du joueur",
    addPlayer: "Ajouter le joueur",
    tooFewPlayers: (min: number) => `Moins de ${min} joueurs : l'équipe ne pourra pas aligner un six complet.`,
    unavailable: "Indisponibilités",
    noUnavailable: "Disponible à tout moment.",
    confirmRemove: (name: string) => `Supprimer l'équipe « ${name} » ?`,
  },
  pitch: {
    title: "Disponibilités du terrain",
    intro: (min: number) => `Chaque créneau dure ${min} min (match + changement).`,
    empty: "Aucun créneau. Ajoutez les dates et heures où le terrain est disponible.",
    slots: (n: number) => `${n} créneau${n > 1 ? "x" : ""}`,
    total: (n: number) => `Total : ${n} créneau${n > 1 ? "x" : ""}`,
  },
  settings: {
    title: "Paramètres",
    reset: "Rétablir les valeurs par défaut",
    confirmReset: "Rétablir tous les paramètres par défaut ?",
    sections: { match: "Match", schedule: "Calendrier", points: "Points", knockout: "Phase finale", tieBreakers: "Départage", draw: "Tirage" },
    halfMinutes: "Durée d'une mi-temps (min)",
    halfTimeMinutes: "Pause mi-temps (min)",
    bufferMinutes: "Battement entre deux matchs (min)",
    slotLength: (min: number) => `Durée d'un créneau : ${min} min`,
    pitches: "Nombre de terrains",
    minRestMinutes: "Repos minimum entre deux matchs d'une équipe (min)",
    maxMatchesPerTeamPerDay: "Matchs maximum par équipe et par jour",
    win: "Victoire",
    draw: "Nul",
    loss: "Défaite",
    thirdPlaceMatch: "Match pour la 3e place",
    extraTime: "Prolongations avant les tirs au but",
    extraTimeHalfMinutes: "Durée d'une mi-temps de prolongation (min)",
    penaltyKicks: "Tirs au but par équipe (puis mort subite)",
    fairPlayYellow: "Fair-play : pénalité carton jaune",
    fairPlayRed: "Fair-play : pénalité carton rouge",
    moveUp: "Monter",
    moveDown: "Descendre",
    seed: "Graine aléatoire (tirage et tirage au sort)",
    tieBreakers: {
      points: "Points",
      headToHeadPoints: "Points en confrontations directes",
      headToHeadGoalDifference: "Différence de buts en confrontations directes",
      goalDifference: "Différence de buts générale",
      goalsFor: "Buts marqués",
      fairPlay: "Fair-play",
      lots: "Tirage au sort",
    } satisfies Record<TieBreaker, string>,
  },
};

export type Strings = typeof fr;
export const t: Strings = fr;

const time = (iso: string) => format(parseISO(iso), "HH:mm");
const isWholeDay = (from: string, to: string) => from === "00:00" && to === "23:59";

export const weekdayName = (weekday: number) => frLocale.localize.day(weekday as 0, { width: "wide" });

export function formatWindow(w: TimeWindow): string {
  const day = format(parseISO(w.start), "EEEE d MMMM yyyy", { locale: frLocale });
  const [from, to] = [time(w.start), time(w.end)];
  return `${day} · ${isWholeDay(from, to) ? t.common.wholeDay : `${from}–${to}`}`;
}

export function formatWeekly(w: WeeklyWindow): string {
  return `Chaque ${weekdayName(w.weekday)} · ${isWholeDay(w.from, w.to) ? t.common.wholeDay : `${w.from}–${w.to}`}`;
}
