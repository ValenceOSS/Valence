import { memo } from 'react';
import { Rail } from '@ValenceUI/Rail';
import { DrawnWhenNear } from '@ValenceUI/DrawnWhenNear';
import { RailCard } from '@ValenceScreens/components/RailCard/RailCard';
import { showIdOf } from '@ValenceClient/library/showIdOf';
import { resumeFor } from '@ValenceClient/playback/resumeFor';
import { watchedFraction } from '@ValenceContracts/schemas/WatchProgress';
import type { LibraryRailProps } from './LibraryRail.types';

const EAGER_CARDS = 8;

/**
 * Draws one rail of a library page, its cards drawn only while it is near the screen, and the
 * pictures of those far along it, past what a screen shows, left until they are scrolled near.
 *
 * @param props - The rail, how far through each of its titles the viewer is, and what its cards do.
 * @param props.rail - The rail.
 * @param props.isHome - Whether it is on the front page, where cards are drawn as artwork.
 * @param props.progress - How far through each title the viewer is.
 * @param props.flagOf - What a title is flagged as, such as new.
 * @param props.onPlayFilm - Plays a title from a given point.
 * @param props.onPlayShow - Plays the programme a card stands for.
 * @param props.onInspect - Opens a title's page.
 * @param props.onOpenShow - Opens a programme's page.
 * @param props.isKept - Whether a title is kept.
 * @param props.onToggleKept - Keeps a title, or lets it go.
 * @param props.onHide - Hides a title.
 * @param props.onDismiss - Takes a title off the rail, where its titles can be taken off.
 */
const LibraryRailFace = ({
  rail,
  isHome,
  progress,
  flagOf,
  onPlayFilm,
  onPlayShow,
  onInspect,
  onOpenShow,
  isKept,
  onToggleKept,
  onHide,
  onDismiss,
}: LibraryRailProps) => {
  const { showOf, standsForShows = false } = rail;

  return (
    <DrawnWhenNear>
      {() => (
        <Rail
          title={rail.title}
          sizesCards
          className="-mx-4 sm:-mx-6"
          {...(showOf === undefined || onOpenShow === undefined
            ? {}
            : {
                onOpenTitle: () => {
                  onOpenShow(showOf);
                },
              })}
        >
          {rail.items.map((media, at) => {
            const isShow = isHome && standsForShows && showIdOf(media) !== null;
            const flag = isHome ? flagOf(media) : null;
            const resume = resumeFor(progress, media.id);
            const watched = progress.get(media.id);

            return (
              <div key={media.id} className="shrink-0 snap-start">
                <RailCard
                  media={media}
                  look={isHome ? 'art' : 'card'}
                  isLazy={at >= EAGER_CARDS}
                  isSeries={isShow}
                  {...(flag === null ? {} : { flag })}
                  {...(isShow || watched === undefined
                    ? {}
                    : { watchedFraction: watchedFraction(watched) })}
                  {...(isShow || resume === null ? {} : { resumeSeconds: Math.floor(resume) })}
                  onPlay={isShow ? onPlayShow : onPlayFilm}
                  onInspect={onInspect}
                  {...(onOpenShow === undefined ? {} : { onOpenShow })}
                  {...(isKept === undefined ? {} : { isKept: isKept(media.id) })}
                  {...(onToggleKept === undefined ? {} : { onToggleKept })}
                  {...(onHide === undefined ? {} : { onHide })}
                  {...(onDismiss === undefined ? {} : { onDismiss })}
                />
              </div>
            );
          })}
        </Rail>
      )}
    </DrawnWhenNear>
  );
};

/**
 * Whether a rail would draw the same as it did, so it need not be drawn again: the same titles in the
 * same order, each flagged, kept and watched as before, and the same things for its cards to do.
 *
 * @param before - What the rail was drawn with.
 * @param now - What it is asked to draw with.
 * @returns Whether it would draw the same.
 */
const drawsTheSame = (before: LibraryRailProps, now: LibraryRailProps): boolean =>
  before.rail.id === now.rail.id &&
  before.rail.title === now.rail.title &&
  before.rail.showOf === now.rail.showOf &&
  before.rail.standsForShows === now.rail.standsForShows &&
  before.isHome === now.isHome &&
  before.progress === now.progress &&
  before.onPlayFilm === now.onPlayFilm &&
  before.onPlayShow === now.onPlayShow &&
  before.onInspect === now.onInspect &&
  before.onOpenShow === now.onOpenShow &&
  before.onToggleKept === now.onToggleKept &&
  before.onHide === now.onHide &&
  before.onDismiss === now.onDismiss &&
  before.rail.items.length === now.rail.items.length &&
  now.rail.items.every(
    (media, at) =>
      before.rail.items[at] === media &&
      before.flagOf(media) === now.flagOf(media) &&
      before.isKept?.(media.id) === now.isKept?.(media.id),
  );

const LibraryRail = memo(LibraryRailFace, drawsTheSame);

LibraryRail.displayName = 'LibraryRail';

export { LibraryRail };
