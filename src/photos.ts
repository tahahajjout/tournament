import bracket from "./assets/photos/bracket.webp";
import calendar from "./assets/photos/calendar.webp";
import draw from "./assets/photos/draw.webp";
import pitch from "./assets/photos/pitch.webp";
import settings from "./assets/photos/settings.webp";
import standings from "./assets/photos/standings.webp";
import teams from "./assets/photos/teams.webp";

export type Photo = { src: string; position: string; title: string; creator: string; license: string; licenseUrl: string; page: string };

/** One header photograph per page, from open collections (see assets/photos/credits.json). */
export const PHOTOS = {
  teams: {
    src: teams,
    position: "50% 38%",
    title: "Morocco women's national futsal team (WAFCON Futsal 2025)",
    creator: "Reda benkhadra",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    page: "https://commons.wikimedia.org/w/index.php?curid=164487822",
  },
  pitch: {
    src: pitch,
    position: "50% 55%",
    title: "Five-a-Side football pitches, Wembley",
    creator: "Stanley Howe",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    page: "https://commons.wikimedia.org/w/index.php?curid=107946940",
  },
  draw: {
    src: draw,
    position: "50% 60%",
    title: "A neon green soccer ball and a neon orange cone",
    creator: "Jonathan Desrosiers",
    license: "CC0",
    licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    page: "https://wordpress.org/photos/photo/83265a15f8/",
  },
  calendar: {
    src: calendar,
    position: "50% 45%",
    title: "A late-night match at Klet Kaeo",
    creator: "PattayaPatrol",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    page: "https://commons.wikimedia.org/w/index.php?curid=188865091",
  },
  standings: {
    src: standings,
    position: "50% 50%",
    title: "WAFCON Futsal 2025 (Tanzania v Morocco) 7",
    creator: "Reda benkhadra",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    page: "https://commons.wikimedia.org/wiki/File:WAFCON_Futsal_2025_(Tanzania_v_Morocco)_7.jpg",
  },
  bracket: {
    src: bracket,
    position: "50% 62%",
    title: "WAFCON Futsal 2025 - Morocco trophy celebration",
    creator: "Reda benkhadra",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    page: "https://commons.wikimedia.org/w/index.php?curid=164487812",
  },
  settings: {
    src: settings,
    position: "50% 50%",
    title: "Football goal net",
    creator: "Santeri Viinamäki",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    page: "https://commons.wikimedia.org/w/index.php?curid=50909167",
  },
} satisfies Record<string, Photo>;
