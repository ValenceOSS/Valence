import { ChevronRight as ChevronRightIcon } from '@keyline-icons/react';
import { CircleCheck as CircleCheckFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { WatchedBar } from '@ValenceUI/WatchedBar';
import { cn } from '@ValenceUI/cn';
import { Equaliser } from '@ValenceScreens/components/Equaliser/Equaliser';
import type { SeasonLineProps } from './SeasonLine.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * One season in the player's list of a programme's seasons: its name, how many of its episodes are
 * left, and a mark on the season that is playing now.
 *
 * @param season - The season and its episodes.
 * @param name - What to call it.
 * @param isOn - Whether the episode on now is in it.
 * @param isMoving - Whether the player is playing, so the mark on it moves with it.
 * @param watchedCount - How many of its episodes this viewer has finished.
 * @param onChoose - Told to open its episodes.
 */
const SeasonLine = ({ season, name, isOn, isMoving, watchedCount, onChoose }: SeasonLineProps) => {
  const total = season.episodes.length;
  const isWatched = watchedCount >= total;

  return (
    <Button
      variant="bare"
      size="none"
      hasTooltip={false}
      aria-current={isOn ? 'true' : undefined}
      onClick={onChoose}
      className={cn(
        'group/season flex h-16 w-full items-center gap-3 rounded-lg px-3 py-2 text-left outline-none',
        'transition-colors duration-[var(--duration-instant)] ease-[var(--ease-out)]',
        'focus-visible:ring-[3px] focus-visible:ring-ring hover-hover:hover:bg-hover',
        isOn ? 'bg-surface-raised' : '',
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className={cn(
            'truncate text-sm',
            isOn ? 'font-semibold text-primary' : 'font-medium text-text',
          )}
        >
          {name}
        </span>

        <span className="truncate text-xs text-text-muted">
          {watchedCount === 0 || isWatched
            ? sayCount('common.count.episodes', total)
            : sayCount('common.countEpisodesLeft', total - watchedCount)}
        </span>

        {watchedCount === 0 || isWatched ? null : (
          <WatchedBar watched={watchedCount / total} className="mx-0 w-24" />
        )}
      </span>

      {isOn ? (
        <Equaliser label={say('common.nowPlaying')} isMoving={isMoving} className="text-primary" />
      ) : isWatched ? (
        <Icon of={CircleCheckFilledIcon} size={16} tone="success" label={say('common.watched')} />
      ) : null}

      <Icon
        of={ChevronRightIcon}
        size={16}
        tone="muted"
        className="shrink-0 transition-transform duration-[var(--duration-instant)] group-hover/season:translate-x-0.5"
      />
    </Button>
  );
};

SeasonLine.displayName = 'SeasonLine';

export { SeasonLine };
