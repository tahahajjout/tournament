import type { Photo } from "../photos";

/** Full-bleed header photograph with the page title set large over a flat scrim. */
export function PageHero({ photo, title, line }: { photo: Photo; title: string; line: string }) {
  return (
    <header className="relative isolate overflow-hidden bg-ink text-white print:hidden">
      <img
        key={photo.src}
        src={photo.src}
        alt=""
        className="hero-img absolute inset-0 -z-10 h-full w-full object-cover"
        style={{ objectPosition: photo.position }}
      />
      <div className="absolute inset-0 -z-10 bg-ink/55" />
      <div className="mx-auto flex min-h-56 max-w-6xl flex-col justify-end px-4 pt-20 pb-8 sm:min-h-80 sm:px-8 sm:pb-10">
        <h1 key={title} className="hero-title font-display text-7xl leading-[0.88] tracking-[-0.01em] sm:text-[8.5rem]">
          {title}
        </h1>
        <p key={line} className="hero-sub mt-3 max-w-2xl text-lg font-semibold sm:text-xl">
          {line}
        </p>
      </div>
    </header>
  );
}
