import { t } from "../i18n";
import { PHOTOS } from "../photos";

export function PhotoCredits() {
  return (
    <footer className="mt-24 bg-ink text-white print:hidden">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
        <p className="font-display text-6xl leading-none sm:text-8xl">{t.brand}</p>
        <p className="mt-6 max-w-4xl text-sm leading-relaxed text-white/85">
          {t.credits}{" "}
          {Object.values(PHOTOS).map((p, i, all) => (
            <span key={p.page}>
              <a className="underline underline-offset-2 hover:text-white" href={p.page}>
                « {p.title} »
              </a>{" "}
              {p.creator},{" "}
              <a className="underline underline-offset-2 hover:text-white" href={p.licenseUrl}>
                {p.license}
              </a>
              {i < all.length - 1 ? " ; " : "."}
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
