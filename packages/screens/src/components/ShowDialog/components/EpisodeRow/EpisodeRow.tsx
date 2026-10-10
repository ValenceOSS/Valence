import { Icon } from '@ValenceUI/Icon';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import {
  Info as InfoIcon,
  Check as CheckIcon,
  CircleCheck as CircleCheckIcon,
} from '@keyline-icons/react';
import {
  CircleCheck as CircleCheckFilledIcon,
  Play as PlayFilledIcon,
} from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { WatchedBar } from '@ValenceUI/WatchedBar';
import type { EpisodeRowProps } from './EpisodeRow.types';
import { say } from '@ValenceI18n/say';
import { numberedEpisodeTitle } from '@ValenceCore/functions/numberedEpisodeTitle';

/**
 * One episode in a list of them: its number, its name, how long it runs, what it is about, and how
 * far through it this viewer is.
 *
 * @param episode - The episode to draw.
 * @param onPlay - Told to start it, and where from.
 * @param onInspect - Told to open the page about it.
 * @param onMarkWatched - Told to mark it watched, or unwatched again where it already is.
 * @param watchedFraction - How far through it this viewer is.
 * @param resumeSeconds - Where they left it.
 * @param airs - When it aired, in words, where the catalogue dates it.
 */
const EpisodeRow = ({
  episode,
  onPlay,
  onInspect,
  onMarkWatched,
  watchedFraction,
  resumeSeconds,
  airs,
}: EpisodeRowProps) => (
  <div className="group/episode relative z-10 flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
    <Button
      variant="bare"
      size="none"
      aria-label={
        resumeSeconds === undefined
          ? say('common.playTitle', { title: episode.title })
          : say('common.resumeTitleFromResumeSeconds', {
              title: episode.title,
              resumeSeconds: formatDuration(resumeSeconds),
            })
      }
      onClick={() => {
        onPlay(episode, resumeSeconds ?? 0);
      }}
      className="flex min-w-[min(100%,24rem)] flex-1 basis-96 items-center gap-4 text-left"
    >
      <span className="flex w-28 shrink-0 flex-col gap-1.5 sm:w-36">
        <span className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-raised ring-1 ring-line">
          {!episode.hasBackdrop ? null : (
            <img
              src={artworkUrl(episode.id, 'backdrop')}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          )}

          <span className="absolute inset-0 flex items-center justify-center bg-shade/40 opacity-0 transition-opacity group-hover/episode:opacity-100">
            <Icon of={PlayFilledIcon} size={20} tone="scrim" />
          </span>

          {watchedFraction === undefined || watchedFraction < 1 ? null : (
            <span
              role="img"
              aria-label={say('common.watched')}
              className="absolute bottom-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-success text-surface"
            >
              <Icon of={CheckIcon} size={12} />
            </span>
          )}
        </span>

        {watchedFraction === undefined || watchedFraction <= 0 || watchedFraction >= 1 ? null : (
          <WatchedBar watched={watchedFraction} />
        )}
      </span>

      <span className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-sm font-medium text-text">
          {numberedEpisodeTitle(episode.title, episode.episodeNumber, episode.episodeNumberEnd)}
        </span>
        <span className="font-body text-xs text-text-muted">
          {formatDuration(episode.durationSeconds)}
          {airs === undefined || airs === '' ? '' : ` · ${airs}`}
          {resumeSeconds === undefined
            ? ''
            : ` · ${say('common.durationIn', { duration: formatDuration(resumeSeconds) })}`}
        </span>
      </span>
    </Button>

    {onMarkWatched === undefined && onInspect === undefined ? null : (
      <span className="ml-auto flex shrink-0 items-center">
        {onMarkWatched === undefined ? null : (
          <Button
            variant={(watchedFraction ?? 0) >= 1 ? 'secondary' : 'confirm'}
            size="sm"
            {...(onInspect === undefined ? {} : { joins: 'next' as const })}
            label={
              (watchedFraction ?? 0) >= 1
                ? say('common.markTitleAsUnwatched', { title: episode.title })
                : say('common.markTitleAsWatched', { title: episode.title })
            }
            hasTooltip={false}
            isActive={(watchedFraction ?? 0) >= 1}
            onClick={() => {
              onMarkWatched(episode, (watchedFraction ?? 0) < 1);
            }}
          >
            {(watchedFraction ?? 0) >= 1 ? say('common.watched') : say('common.markAsWatched')}
            <Icon
              of={(watchedFraction ?? 0) >= 1 ? CircleCheckFilledIcon : CircleCheckIcon}
              size={16}
            />
          </Button>
        )}

        {onInspect === undefined ? null : (
          <Button
            variant="secondary"
            size="sm"
            {...(onMarkWatched === undefined ? {} : { joins: 'previous' as const })}
            className={onMarkWatched === undefined ? '' : 'border-l-0'}
            label={say('common.aboutTitle', { title: episode.title })}
            hasTooltip={false}
            onClick={() => {
              onInspect(episode);
            }}
          >
            {say('common.moreInfo')}
            <Icon of={InfoIcon} size={16} />
          </Button>
        )}
      </span>
    )}
  </div>
);

EpisodeRow.displayName = 'EpisodeRow';

export { EpisodeRow };
