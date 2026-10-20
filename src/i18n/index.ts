import { format, parseISO } from "date-fns";
import { fr as frLocale } from "date-fns/locale";
import type { Issue } from "../domain/validate";
import type { KnockoutStage, Match, Placeholder, Stage, TieBreaker, TimeWindow, WeeklyWindow } from "../domain/types";

const ordinal = (n: number) => `${n}${n === 1 ? "er" : "e"}`;

const fr = {
  appTitle: "Tournoi de football 6 contre 6",
  brand: "Tournoi 6v6",
  navLabel: "Sections du tournoi",
  credits: "Photos :",
  hero: {
    teams: (n: number) => (n ? `${n} équipe${n > 1 ? "s" : ""} inscrite${n > 1 ? "s" : ""}, 6 à 8 joueurs chacune.` : "Inscrivez les équipes et leurs disponibilités."),
    pitch: (slots: number, min: number) =>
      slots ? `${slots} créneau${slots > 1 ? "x" : ""} de ${min} minutes sur le terrain.` : "Indiquez quand le terrain est libre.",
    draw: (groups: number, seed: number) => `${groups} groupe${groups > 1 ? "s" : ""} tiré${groups > 1 ? "s" : ""} au sort, graine ${seed}.`,
    drawNone: "Le tirage n'a pas encore eu lieu.",
    calendar: (placed: number, total: number) =>
      total ? `${placed} match${placed > 1 ? "s" : ""} planifié${placed > 1 ? "s" : ""} sur ${total}.` : "Faites le tirage, puis générez le calendrier.",
    standings: (played: number, total: number) => `${played} match${played > 1 ? "s" : ""} de groupe joué${played > 1 ? "s" : ""} sur ${total}.`,
    bracket: "Le tableau se remplit au fil des résultats.",
    champion: (name: string) => `Champion : ${name}.`,
    settings: (halves: number, half: number, slot: number) => `Matchs de ${halves} × ${half} min, créneaux de ${slot} min.`,
  },
  week: {
    title: "Semaine type",
    pitchIntro: "Coloriez les cases où le terrain est libre chaque semaine (cliquez, ou glissez pour en remplir plusieurs), puis choisissez la période à remplir.",
    gridLabel: "Semaine type, cases d'une demi-heure",
    gridEmpty: "Aucune case coloriée.",
    gridClear: "Vider la grille",
    teamTitle: "Disponibilités hebdomadaires",
    teamIntro: "Coloriez les cases où l'équipe peut jouer chaque semaine. Laissez la grille vide si elle est disponible à tout moment.",
    from: "Du",
    to: "Au",
    fill: (n: number) => (n ? `Ajouter ${n} plage${n > 1 ? "s" : ""}` : "Aucune plage sur cette période"),
    applyToAll: "Appliquer à toutes les équipes",
    confirmApplyToAll: (name: string) => `Remplacer les disponibilités hebdomadaires de toutes les équipes par celles de « ${name} » ?`,
    clearAll: "Tout effacer",
    confirmClearAll: "Supprimer toutes les disponibilités du terrain ?",
    weekOf: (date: string) => `Semaine du ${date}`,
    oneByOne: "Ajouter une date précise",
  },
  nav: {
    teams: "Équipes",
    pitch: "Terrain",
    draw: "Tirage",
    calendar: "Calendrier",
    standings: "Classements",
    bracket: "Tableau final",
    settings: "Paramètres",
  },
  stages: {
    group: "Phase de groupes",
    R16: "Huitième de finale",
    QF: "Quart de finale",
    SF: "Demi-finale",
    THIRD: "Match pour la 3e place",
    FINAL: "Finale",
  } satisfies Record<Stage, string>,
  roundTitles: {
    R16: "Huitièmes de finale",
    QF: "Quarts de finale",
    SF: "Demi-finales",
    THIRD: "Match pour la 3e place",
    FINAL: "Finale",
  } satisfies Record<KnockoutStage, string>,
  roundShort: { THIRD: "3e place" },
  group: (id: string) => `Groupe ${id}`,
  groupWord: "Groupe",
  matchday: (n: number) => `Journée ${n}`,
  draw: {
    title: "Tirage au sort",
    run: "Lancer le tirage",
    rerun: "Refaire le tirage",
    confirmRerun: "Refaire le tirage efface le calendrier et tous les résultats. Continuer ?",
    groupCount: "Groupes",
    auto: (sizes: number[]) => `Automatique (${sizes.join(" + ")})`,
    manual: (sizes: number[]) => `${sizes.length} groupe${sizes.length > 1 ? "s" : ""} (${sizes.join(" + ")})`,
    seeds: "Têtes de série",
    seedsHint: "Les têtes de série sont placées dans des groupes différents.",
    seed: (n: number) => `Graine du tirage : ${n}`,
    revealAll: "Tout afficher",
    empty: "Le tirage n'a pas encore eu lieu.",
    format: (n: number, stage: string) => `${n} équipes qualifiées pour la phase finale (${stage.toLowerCase()}).`,
  },
  calendar: {
    title: "Calendrier",
    intro: "Le calendrier respecte les indisponibilités de chaque équipe, le repos entre deux matchs et l'ordre des tours.",
    generate: "Générer le calendrier",
    regenerate: "Régénérer le calendrier",
    confirmRegenerate: "Des résultats sont déjà saisis. Régénérer peut déplacer des matchs déjà joués. Continuer ?",
    needDraw: "Faites d'abord le tirage.",
    empty: "Aucun match planifié : générez le calendrier.",
    list: "Liste",
    grid: "Grille",
    allTeams: "Toutes les équipes",
    filter: "Équipe",
    print: "Imprimer / PDF",
    ics: "Exporter (.ics)",
    hint: "Cliquez sur un match pour saisir le score.",
    unplacedTitle: (n: number) => `${n} match${n > 1 ? "s" : ""} non planifié${n > 1 ? "s" : ""}`,
    noCommonFreeSlot: (teams: string) => `${teams} n'ont aucun créneau libre en commun aux dates disponibles.`,
    noSlotLeft:
      "Aucun créneau restant ne respecte le repos minimum, la limite de matchs par jour et l'ordre des tours. Ajoutez des créneaux ou assouplissez les paramètres.",
    warningsTitle: "Disponibilités à surveiller",
    warning: (teams: string) => `Indisponible(s) à cet horaire s'ils se qualifient : ${teams}.`,
    pitch: (n: number) => `Terrain ${n}`,
    time: "Heure",
  },
  standings: {
    title: "Classements",
    empty: "Faites d'abord le tirage.",
    cols: { pos: "#", team: "Équipe", played: "J", won: "G", drawn: "N", lost: "P", gf: "BP", ga: "BC", gd: "Diff", pts: "Pts", fp: "FP" },
    qualified: "Qualifié pour la phase finale",
    maybe: "Qualifiable parmi les meilleurs",
    bestTitle: (position: number) => `Classement des ${position}${position === 1 ? "ers" : "es"} de groupe`,
    bestHint: (n: number) => `Les ${n} premiers se qualifient (points par match, puis différence de buts par match).`,
  },
  bracket: { title: "Tableau final", empty: "Faites d'abord le tirage." },
  result: {
    save: "Enregistrer",
    clear: "Effacer le résultat",
    cancel: "Annuler",
    penalties: "Tirs au but",
    penaltiesShort: "t.a.b.",
    score: "Score",
    penaltiesRequired: "Égalité : saisissez les tirs au but, avec un vainqueur.",
    unknownTeams: "Les équipes de ce match ne sont pas encore connues.",
    cards: "Cartons (fair-play)",
    yellow: "Jaunes",
    red: "Rouges",
  },
  placeholder: {
    groupPosition: (position: number, groupId: string) => `${ordinal(position)} du groupe ${groupId}`,
    bestRanked: (position: number, rank: number) =>
      `${rank === 1 ? "Meilleur" : `${ordinal(rank)} meilleur`} ${ordinal(position)}`,
    winner: (match: string) => `Vainqueur ${match}`,
    loser: (match: string) => `Perdant ${match}`,
    shortStage: { R16: "8e", QF: "quart", SF: "demi" } as Record<string, string>,
    tbd: "À déterminer",
  },
  issues: {
    tooFewTeams: (n: number) => `Il faut au moins 3 équipes (actuellement ${n}).`,
    emptyName: "Une équipe n'a pas de nom.",
    duplicateName: (name: string) => `Deux équipes s'appellent « ${name} ».`,
    playerCount: (team: string, n: number) => `${team} a ${n} joueur${n > 1 ? "s" : ""} (6 à 8 attendus).`,
    drawStale: "Les équipes ont changé depuis le tirage : refaites le tirage.",
    notEnoughSlots: (needed: number, available: number) =>
      `Il faut au moins ${needed} créneaux, vous en avez ${available}. Ajoutez des disponibilités du terrain.`,
    teamNotEnoughFreeSlots: (team: string, needed: number, available: number) =>
      `${team} doit jouer ${needed} matchs de groupe mais n'est libre que sur ${available} créneau${available > 1 ? "x" : ""}.`,
  },
  example: {
    load: "Charger un tournoi d'exemple",
    confirm: "Remplacer tout le tournoi actuel par un exemple de 8 équipes ?",
    hint: "8 équipes, le terrain libre trois soirs par semaine : tirage et calendrier déjà faits, pour essayer.",
  },
  backup: {
    title: "Sauvegarde",
    export: "Exporter (JSON)",
    import: "Importer (JSON)",
    confirmImport: "Remplacer tout le tournoi actuel par ce fichier ?",
    invalid: (msg: string) => `Fichier invalide : ${msg}.`,
  },
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
    newTeamExample: "Ex. : Raja Hay Mohammadi",
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
    noUnavailable: "Aucune date bloquée.",
    anytime: "Disponible à tout moment.",
    editWeek: "Choisir les horaires de la semaine",
    addUnavailable: "Ajouter une indisponibilité",
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
    knockoutNote: "Modifiez ces options puis régénérez le calendrier pour mettre à jour le tableau final.",
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

export const formatTime = (iso: string) => format(parseISO(iso), "HH:mm");
export const formatDay = (iso: string) => format(parseISO(iso), "EEEE d MMMM", { locale: frLocale });
export const formatShortDay = (iso: string) => format(parseISO(iso), "EEE d MMM", { locale: frLocale });

/** "QF2" → "quart 2" (used inside "Vainqueur quart 2"). */
const KNOCKOUT_ID = /^(R16|QF|SF)(\d+)$/;
const shortMatch = (matchId: string) => {
  const m = KNOCKOUT_ID.exec(matchId);
  return m ? `${t.placeholder.shortStage[m[1]!]} ${m[2]}` : matchId;
};

export function placeholderLabel(p: Placeholder): string {
  switch (p.type) {
    case "groupPosition": return t.placeholder.groupPosition(p.position, p.groupId);
    case "bestRanked": return t.placeholder.bestRanked(p.position, p.rank);
    case "winner": return t.placeholder.winner(shortMatch(p.matchId));
    case "loser": return t.placeholder.loser(shortMatch(p.matchId));
  }
}

/** "Groupe A · Journée 2", "Quart de finale 3", "Finale". */
export function matchTitle(m: Match): string {
  if (m.stage === "group") return `${t.group(m.groupId ?? "")} · ${t.matchday(m.round ?? 1)}`;
  const n = KNOCKOUT_ID.exec(m.id)?.[2];
  return n ? `${t.stages[m.stage]} ${n}` : t.stages[m.stage];
}

export function issueMessage(i: Issue): string {
  switch (i.code) {
    case "tooFewTeams": return t.issues.tooFewTeams(i.count);
    case "emptyName": return t.issues.emptyName;
    case "duplicateName": return t.issues.duplicateName(i.name);
    case "playerCount": return t.issues.playerCount(i.team, i.count);
    case "drawStale": return t.issues.drawStale;
    case "notEnoughSlots": return t.issues.notEnoughSlots(i.needed, i.available);
    case "teamNotEnoughFreeSlots": return t.issues.teamNotEnoughFreeSlots(i.team, i.needed, i.available);
  }
}
