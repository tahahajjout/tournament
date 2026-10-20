import { useEffect, useState } from "react";
import { PageHero } from "./components/PageHero";
import { PhotoCredits } from "./components/PhotoCredits";
import { resolveTeam } from "./domain/knockout";
import { slotMinutes } from "./domain/rules";
import { generateSlots } from "./domain/slots";
import { t } from "./i18n";
import { BracketPage } from "./pages/BracketPage";
import { CalendarPage } from "./pages/CalendarPage";
import { DrawPage } from "./pages/DrawPage";
import { PitchPage } from "./pages/PitchPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StandingsPage } from "./pages/StandingsPage";
import { TeamsPage } from "./pages/TeamsPage";
import { PHOTOS } from "./photos";
import { useTournament } from "./store/useTournament";

const PAGES = {
  teams: TeamsPage,
  pitch: PitchPage,
  draw: DrawPage,
  calendar: CalendarPage,
  standings: StandingsPage,
  bracket: BracketPage,
  settings: SettingsPage,
};
type Page = keyof typeof PAGES;

const current = (): Page => {
  const h = location.hash.slice(1);
  return h in PAGES ? (h as Page) : "teams";
};

/** The one live sentence under each page title. */
function useHeroLine(page: Page): string {
  const s = useTournament();
  const h = t.hero;
  switch (page) {
    case "teams": return h.teams(s.teams.length);
    case "pitch": return h.pitch(generateSlots(s.pitchWindows, s.config).length, slotMinutes(s.config));
    case "draw": return s.groups.length ? h.draw(s.groups.length, s.config.seed) : h.drawNone;
    case "calendar": return h.calendar(s.matches.filter((m) => m.slotId).length, s.matches.length);
    case "standings": {
      const group = s.matches.filter((m) => m.stage === "group");
      return h.standings(group.filter((m) => m.result).length, group.length);
    }
    case "bracket": {
      const champion = resolveTeam({ placeholder: { type: "winner", matchId: "FINAL" } }, s.groups, s.matches, s.config);
      const name = s.teams.find((x) => x.id === champion)?.name;
      return name ? h.champion(name) : h.bracket;
    }
    case "settings": return h.settings(s.config.halves, s.config.halfMinutes, slotMinutes(s.config));
  }
}

export default function App() {
  const [page, setPage] = useState(current);
  useEffect(() => {
    const onHash = () => {
      setPage(current());
      scrollTo({ top: 0 });
    };
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);
  const line = useHeroLine(page);
  const Page = PAGES[page];

  return (
    <div className="min-h-dvh">
      <div className="sticky top-0 z-20 bg-ink text-white print:static print:bg-white print:text-ink">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 sm:px-8">
          <a href="#teams" className="font-display text-3xl leading-none tracking-wide">
            {t.brand}
          </a>
          <nav className="-mx-2 flex flex-wrap print:hidden" aria-label={t.navLabel}>
            {(Object.keys(PAGES) as Page[]).map((p) => (
              <a
                key={p}
                href={`#${p}`}
                aria-current={p === page ? "page" : undefined}
                className="flex min-h-11 items-center px-3 text-[15px] font-semibold text-white/75 transition-colors duration-150 hover:text-white aria-[current=page]:bg-pitch aria-[current=page]:text-white"
              >
                {t.nav[p]}
              </a>
            ))}
          </nav>
        </div>
      </div>
      <PageHero photo={PHOTOS[page]} title={t.nav[page]} line={line} />
      <main key={page} className="enter mx-auto max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
        <Page />
      </main>
      <PhotoCredits />
    </div>
  );
}
