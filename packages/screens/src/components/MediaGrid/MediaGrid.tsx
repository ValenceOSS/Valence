import { VirtualGrid } from '@ValenceUI/VirtualGrid';
import { RailCard } from '@ValenceScreens/components/RailCard/RailCard';
import type { MediaGridProps, MediaGridSize } from './MediaGrid.types';

const POSTER_WIDTHS: Record<MediaGridSize, number> = { small: 130, medium: 170, large: 220 };

const WIDE_WIDTHS: Record<MediaGridSize, number> = { small: 220, medium: 300, large: 420 };

const POSTER_TO_WIDTH = 1.5;

const WIDE_TO_WIDTH = 0.5625;

const UNDER_A_CARD = 64;

/**
 * Lays a page of items out as a grid of cards, at whichever size a viewer chose. Each card carries
 * how far through it they are and whether they have kept it, both asked of the caller rather than
 * fetched here.
 *
 * @param items - What to draw.
 * @param onPlay - Told to start something, and where from.
 * @param onInspect - Told to open the page about something.
 * @param watchedFractionFor - How far through each item this viewer is.
 * @param resumeFor - Where they left each item.
 * @param isKept - Whether each item is kept.
 * @param onToggleKept - Told to keep something, or stop.
 * @param onHide - Told to hide something from this viewer.
 * @param size - How large the cards are.
 * @param shape - Whether each card stands upright as a poster or lies flat; posters sit more to a row.
 */
const MediaGrid = ({
  items,
  onPlay,
  onInspect,
  watchedFractionFor,
  resumeFor,
  isKept,
  onToggleKept,
  onHide,
  size = 'medium',
  isSeries = false,
  onOpenShow,
  shape = 'wide',
}: MediaGridProps) => (
  <VirtualGrid
    count={items.length}
    label="What is here"
    leastCardWidth={(shape === 'poster' ? POSTER_WIDTHS : WIDE_WIDTHS)[size]}
    rowHeight={
      (shape === 'poster'
        ? POSTER_WIDTHS[size] * POSTER_TO_WIDTH
        : WIDE_WIDTHS[size] * WIDE_TO_WIDTH) + UNDER_A_CARD
    }
  >
    {(at) => {
      const media = items[at];

      if (media === undefined) {
        return null;
      }

      return (
        <RailCard
          key={media.id}
          media={media}
          {...(watchedFractionFor?.(media.id) === undefined
            ? {}
            : { watchedFraction: watchedFractionFor(media.id) ?? 0 })}
          {...(resumeFor === undefined || resumeFor(media.id) === null
            ? {}
            : { resumeSeconds: Math.floor(resumeFor(media.id) ?? 0) })}
          onPlay={onPlay}
          onInspect={onInspect}
          isSeries={isSeries}
          shape={shape}
          {...(onOpenShow === undefined ? {} : { onOpenShow })}
          {...(isKept === undefined ? {} : { isKept: isKept(media.id) })}
          {...(onToggleKept === undefined ? {} : { onToggleKept })}
          {...(onHide === undefined ? {} : { onHide })}
        />
      );
    }}
  </VirtualGrid>
);

MediaGrid.displayName = 'MediaGrid';

export { MediaGrid };
