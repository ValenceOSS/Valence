import { Button } from '@ValenceUI/Button';
import { WatchedBar } from '@ValenceUI/WatchedBar';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import type { SeasonMateProps } from './SeasonMate.types';

/**
 * Another episode of the season being looked at, as a card: its picture, how far into it somebody got
 * underneath, and its number and name. The programme's name is left off, since every card beside it
 * is the same programme.
 *
 * @param episode - The episode.
 * @param watched - How much of it has been watched, where any has.
 * @param onSelect - Told the episode was chosen.
 */
const SeasonMate = ({ episode, watched, onSelect }: SeasonMateProps) => {
  const number =
    episode.episodeNumber === null || episode.episodeNumber === undefined
      ? null
      : describeEpisodeNumbers(episode.episodeNumber, episode.episodeNumberEnd);

  return (
    <div className="flex w-56 shrink-0 snap-start flex-col gap-2 sm:w-60">
      <Button
        variant="bare"
        size="none"
        hasTooltip={false}
        label={number === null ? episode.title : `Episode ${number}, ${episode.title}`}
        className="group flex w-full flex-col items-stretch gap-2 text-left"
        onClick={onSelect}
      >
        <span className="relative block aspect-video w-full overflow-hidden rounded-lg bg-surface-raised ring-1 ring-line">
          {!episode.hasBackdrop ? null : (
            <img
              src={artworkUrl(episode.id, 'backdrop')}
              alt=""
              loading="lazy"
              draggable={false}
              className="absolute inset-0 size-full object-cover transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)] motion-reduce:transition-none hover-hover:group-hover:scale-[1.03]"
            />
          )}
        </span>

        {watched === undefined || watched <= 0 || watched >= 1 ? null : (
          <WatchedBar watched={watched} />
        )}

        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-text">
            {number === null ? episode.title : `${number}. ${episode.title}`}
          </span>
          <span className="text-xs text-text-muted">
            {watched !== undefined && watched >= 1
              ? `${formatDuration(episode.durationSeconds)} · Watched`
              : formatDuration(episode.durationSeconds)}
          </span>
        </span>
      </Button>
    </div>
  );
};

SeasonMate.displayName = 'SeasonMate';

export { SeasonMate };
