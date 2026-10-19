import { useEffect, useState } from "react";
import { t } from "./i18n";
import { PitchPage } from "./pages/PitchPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TeamsPage } from "./pages/TeamsPage";

const PAGES = { teams: TeamsPage, pitch: PitchPage, settings: SettingsPage };
type Page = keyof typeof PAGES;

const current = (): Page => {
  const h = location.hash.slice(1);
  return h in PAGES ? (h as Page) : "teams";
};

export default function App() {
  const [page, setPage] = useState(current);
  useEffect(() => {
    const onHash = () => setPage(current());
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, []);
  const Page = PAGES[page];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <h1 className="font-bold">{t.appTitle}</h1>
          <nav className="flex gap-1">
            {(Object.keys(PAGES) as Page[]).map((p) => (
              <a
                key={p}
                href={`#${p}`}
                aria-current={p === page ? "page" : undefined}
                className="rounded px-3 py-1.5 text-sm hover:bg-slate-100 aria-[current=page]:bg-emerald-700 aria-[current=page]:text-white"
              >
                {t.nav[p]}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Page />
      </main>
    </div>
  );
}
