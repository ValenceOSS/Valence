import { MediaPoster } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaPoster/MediaPoster';
import type { MediaTitleHeroProps } from './MediaTitleHero.types';

/**
 * The head of a title's page in Media: its poster, its name and year in large type, what it is in
 * a line of badges and facts, its overview, what can be done to it, and the tabs onto the rest of
 * the page along its foot, so they sit right above what they switch between.
 *
 * @param name - What the title is called.
 * @param year - Its year, where known.
 * @param posterUrl - Its poster, where it has one.
 * @param badges - What stands out about it, such as its match and its best quality.
 * @param facts - What else it is, such as its library, how many files and how large.
 * @param overview - What it is about, where known.
 * @param actions - What can be done to it.
 * @param tabs - The tabs onto the rest of the page.
 */
const MediaTitleHero = ({
  name,
  year,
  posterUrl,
  badges,
  facts,
  overview,
  actions,
  tabs,
}: MediaTitleHeroProps) => (
  <section className="valence-card-shell flex flex-col overflow-hidden">
    <div className="valence-card-face flex flex-col p-0">
      <div className="flex flex-col gap-6 p-5 sm:flex-row sm:gap-7 sm:p-7">
        <MediaPoster
          src={posterUrl}
          className="w-32 shrink-0 self-start shadow-[var(--shadow-lifted)] sm:w-40"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex flex-col gap-3">
            <h1 className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                {name}
              </span>
              {year === null ? null : (
                <span className="text-xl font-medium tabular-nums text-text-muted sm:text-2xl">
                  {year}
                </span>
              )}
            </h1>

            <span className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
              {badges}
              {facts.map((fact, at) => (
                <span key={fact} className="flex items-center gap-2">
                  {at === 0 ? null : <span aria-hidden>·</span>}
                  {fact}
                </span>
              ))}
            </span>

            {overview === null || overview === '' ? null : (
              <p className="line-clamp-3 max-w-2xl font-body text-sm leading-relaxed text-text-muted">
                {overview}
              </p>
            )}
          </div>

          <span className="mt-auto flex flex-wrap items-center gap-2">{actions}</span>
        </div>
      </div>

      <div className="border-t border-[var(--surface-line)] px-5 sm:px-7">{tabs}</div>
    </div>
  </section>
);

MediaTitleHero.displayName = 'MediaTitleHero';

export { MediaTitleHero };
