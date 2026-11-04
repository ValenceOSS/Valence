import { InfoRow } from '@ValenceUI/InfoRow';
import { cn } from '@ValenceUI/cn';
import { MediaPoster } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaPoster/MediaPoster';
import type { MediaTitleHeroProps } from './MediaTitleHero.types';

/**
 * The head of a title's page in Media, or of one season or episode of it: its poster or still, its
 * name in large type with its year or episode beside it, what stands
 * out about it in a line of badges, what can be done to it, and the facts of it in a column of
 * their own at the right where there is room, under the badges where there is not, with the tabs
 * onto the rest of the page along its foot, so they sit right above what they switch between.
 *
 * @param name - What the title is called.
 * @param aside - What is set beside the name, quieter, such as its year or an episode's number.
 * @param posterUrl - Its poster or still, where it has one.
 * @param isWide - Whether the picture is a still from the video rather than a poster.
 * @param badges - What stands out about it, such as its match and its best quality.
 * @param facts - What else it is, each named, such as its library, how many files and how large.
 * @param actions - What can be done to it.
 * @param tabs - The tabs onto the rest of the page.
 */
const MediaTitleHero = ({
  name,
  aside,
  posterUrl,
  isWide = false,
  badges,
  facts,
  actions,
  tabs,
}: MediaTitleHeroProps) => (
  <section className="valence-card-shell @container flex flex-col overflow-hidden">
    <div className="valence-card-face flex flex-col p-0">
      <div className="flex flex-col gap-6 p-5 sm:flex-row sm:gap-7 sm:p-7">
        <MediaPoster
          src={posterUrl}
          isWide={isWide}
          className={cn(
            'shrink-0 self-start shadow-[var(--shadow-lifted)]',
            isWide ? 'w-full max-w-xs sm:w-72' : 'w-32',
          )}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex flex-col gap-3">
            <h1 className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">
                {name}
              </span>
              {aside === null ? null : (
                <span className="text-xl font-medium tabular-nums text-text-muted sm:text-2xl">
                  {aside}
                </span>
              )}
            </h1>

            <span className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
              {badges}
              {facts.map((fact) => (
                <span key={fact.label} className="flex items-center gap-2 @4xl:hidden">
                  <span aria-hidden>·</span>
                  {fact.value}
                </span>
              ))}
            </span>
          </div>

          <span className="mt-auto flex flex-wrap items-center gap-2">{actions}</span>
        </div>

        {facts.length === 0 ? null : (
          <div className="-my-1 hidden w-72 shrink-0 flex-col self-start border-l border-[var(--surface-line)] pl-5 text-[0.8125rem] @4xl:flex">
            {facts.map((fact) => (
              <InfoRow key={fact.label} label={fact.label}>
                {fact.value}
              </InfoRow>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--surface-line)] px-5 sm:px-7">{tabs}</div>
    </div>
  </section>
);

MediaTitleHero.displayName = 'MediaTitleHero';

export { MediaTitleHero };
