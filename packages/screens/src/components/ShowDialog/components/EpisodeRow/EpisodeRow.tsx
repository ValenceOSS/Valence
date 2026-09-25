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
import type { EpisodeRowProps } from './EpisodeRow.types';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';

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
  <div className="group/episode flex items-center gap-3 py-3">
    <Button
      variant="bare"
      size="none"
      aria-label={
        resumeSeconds === undefined
          ? `Play ${episode.title}`
          : `Resume ${episode.title} from ${formatDuration(resumeSeconds)}`
      }
      onClick={() => {
        onPlay(episode, resumeSeconds ?? 0);
      }}
      className="flex min-w-0 shrink flex-1 items-center gap-4 text-left"
    >
      <span className="w-8 shrink-0 text-center text-sm tabular-nums text-text-muted">
        {episode.episodeNumber === null || episode.episodeNumber === undefined
          ? '—'
          : describeEpisodeNumbers(episode.episodeNumber, episode.episodeNumberEnd)}
      </span>

      <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg bg-surface-raised ring-1 ring-line sm:w-36">
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
            aria-label="Watched"
            className="absolute bottom-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-scrim"
          >
            <Icon of={CheckIcon} size={12} tone="scrim" />
          </span>
        )}

        {watchedFraction === undefined || watchedFraction >= 1 ? null : (
          <span className="absolute inset-x-0 bottom-0 h-1 bg-shade/50">
            <span
              className="block h-full bg-primary"
              style={{ width: `${(Math.min(Math.max(watchedFraction, 0), 1) * 100).toString()}%` }}
            />
          </span>
        )}
      </span>

      <span className="flex min-w-0 flex-col gap-1">
        <span className="truncate text-sm font-medium text-text">{episode.title}</span>
        <span className="font-body text-xs text-text-muted">
          {formatDuration(episode.durationSeconds)}
          {airs === undefined || airs === '' ? '' : ` · ${airs}`}
          {resumeSeconds === undefined ? '' : ` · ${formatDuration(resumeSeconds)} in`}
        </span>
      </span>
    </Button>

    {onMarkWatched === undefined ? null : (
      <Button
        isIconOnly
        variant="ghost"
        size="sm"
        label={
          (watchedFraction ?? 0) >= 1
            ? `Mark ${episode.title} as unwatched`
            : `Mark ${episode.title} as watched`
        }
        isActive={(watchedFraction ?? 0) >= 1}
        onClick={() => {
          onMarkWatched(episode, (watchedFraction ?? 0) < 1);
        }}
      >
        <Icon
          of={(watchedFraction ?? 0) >= 1 ? CircleCheckFilledIcon : CircleCheckIcon}
          size={18}
        />
      </Button>
    )}

    {onInspect === undefined ? null : (
      <Button
        isIconOnly
        variant="ghost"
        label={`About ${episode.title}`}
        size="sm"
        onClick={() => {
          onInspect(episode);
        }}
      >
        <Icon of={InfoIcon} size={18} />
      </Button>
    )}
  </div>
);

EpisodeRow.displayName = 'EpisodeRow';

export { EpisodeRow };
