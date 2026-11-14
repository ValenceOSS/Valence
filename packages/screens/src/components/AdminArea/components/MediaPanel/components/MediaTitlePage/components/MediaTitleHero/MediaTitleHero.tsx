import { useState } from 'react';
import { BackdropScrim } from '@ValenceUI/BackdropScrim';
import { cn } from '@ValenceUI/cn';
import { MediaPoster } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaPoster/MediaPoster';
import type { MediaTitleHeroProps } from './MediaTitleHero.types';

/**
 * A title's page in Media, or one season or episode of it. Its backdrop runs across the top of the
 * card, fading in once it has loaded rather than arriving all at once, with the poster set over its
 * foot so picture and page read as one; beside the poster its name in large type with its year or
 * episode, what stands out about it in a line of badges, and what can be done to it. The facts of it
 * run along the card's foot as a strip of their own, and the tabs onto the rest of the page sit
 * beneath the card along a line of their own, the way the other admin pages head what they switch
 * between. An episode's still is its backdrop, so it has
 * no poster over it; and where there is no backdrop at all, the card starts at the poster.
 *
 * @param name - What the title is called.
 * @param aside - What is set beside the name, quieter, such as its year or an episode's number.
 * @param posterUrl - Its poster or still, where it has one.
 * @param backdropUrl - The wide picture across the top, where it has one.
 * @param isWide - Whether the picture is a still from the video rather than a poster.
 * @param badges - What stands out about it, such as its match and its best quality.
 * @param facts - What else it is, each named, such as its library, how many files and how large.
 * @param actions - What can be done to it.
 * @param tabs - The tabs onto the rest of the page.
 * @param children - What the tabs switch between.
 */
const MediaTitleHero = ({
  name,
  aside,
  posterUrl,
  backdropUrl = null,
  isWide = false,
  badges,
  facts,
  actions,
  tabs,
  children,
}: MediaTitleHeroProps) => {
  const banner = isWide ? posterUrl : backdropUrl;
  const [loaded, setLoaded] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const hasBanner = banner !== null && banner !== failed;
  const hasPoster = !isWide;

  return (
    <div className="flex flex-col gap-5">
      <section className="valence-card-shell">
        <div className="valence-card-face @container overflow-hidden p-0">
          {hasBanner ? (
            <div className="relative h-40 overflow-hidden bg-[var(--surface-line)] @xl:h-56">
              <img
                src={banner}
                alt=""
                className={cn(
                  'absolute inset-0 size-full object-cover object-[center_25%]',
                  'transition-opacity duration-[var(--duration-base)] ease-[var(--ease-out)]',
                  loaded === banner ? 'opacity-100' : 'opacity-0',
                )}
                onLoad={() => {
                  setLoaded(banner);
                }}
                onError={() => {
                  setFailed(banner);
                }}
              />
              <BackdropScrim />
            </div>
          ) : null}

          <div className="flex flex-col gap-5 px-5 pb-5 @xl:flex-row @xl:items-end @xl:gap-6 @xl:px-7">
            {hasPoster ? (
              <MediaPoster
                src={posterUrl}
                className={cn(
                  'relative w-28 shrink-0 self-start shadow-[var(--shadow-overlay)] @xl:w-36',
                  hasBanner ? '-mt-16 @xl:-mt-24' : 'mt-5 @xl:mt-7',
                )}
              />
            ) : null}

            <div
              className={cn(
                'flex min-w-0 flex-1 flex-col gap-4 @3xl:flex-row @3xl:items-end @3xl:justify-between',
                hasPoster ? '' : 'pt-5 @xl:pt-7',
              )}
            >
              <div className="flex min-w-0 flex-col gap-3">
                <h1 className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-3xl font-semibold tracking-[-0.02em] text-text @xl:text-4xl">
                    {name}
                  </span>
                  {aside === null ? null : (
                    <span className="text-xl font-medium tabular-nums text-text-muted @xl:text-2xl">
                      {aside}
                    </span>
                  )}
                </h1>

                <span className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
                  {badges}
                </span>
              </div>

              <span className="flex shrink-0 flex-wrap items-center gap-2">{actions}</span>
            </div>
          </div>

          {facts.length === 0 ? null : (
            <dl className="grid grid-cols-2 border-t border-[var(--surface-line)] @lg:grid-cols-3 @4xl:grid-flow-col @4xl:grid-cols-none @4xl:auto-cols-fr">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex min-w-0 flex-col gap-0.5 border-[var(--surface-line)] px-5 py-3 @xl:px-7 @4xl:border-s @4xl:first:border-s-0"
                >
                  <dt className="text-xs text-text-muted">{fact.label}</dt>
                  <dd className="truncate text-sm font-medium text-text tabular-nums">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <div className="border-b border-[var(--surface-line)]">{tabs}</div>

      {children}
    </div>
  );
};

MediaTitleHero.displayName = 'MediaTitleHero';

export { MediaTitleHero };
