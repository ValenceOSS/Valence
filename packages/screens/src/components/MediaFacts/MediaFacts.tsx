import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { Star as StarIcon } from '@keyline-icons/react';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import type { ReactNode } from 'react';
import type { MediaFactsProps } from './MediaFacts.types';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import { say } from '@ValenceI18n/say';

const SIZES = {
  inherit: '',
  xs: 'text-xs font-medium tracking-[0.1em]',
  sm: 'text-sm font-medium tracking-[0.14em]',
  base: 'text-base font-medium',
} as const;

const TONES = {
  inherit: '',
  muted: 'text-text-muted',
  scrim: 'text-on-scrim/80',
} as const;

/**
 * States the facts that place an item — its year, how long it runs, which episode it is, what it is
 * rated — on one line beneath its name. Which of them appear is up to the caller, since a card in a
 * grid and a page about one film want different amounts.
 *
 * @param media - The item being described.
 * @param hasRuntime - Whether to say how long it is.
 * @param hasEpisode - Whether to say which episode it is.
 * @param hasSize - Whether to say how much room the file takes, where it is known.
 * @param size - How large the line is set, where it is not the size of the text around it.
 * @param tone - Its colour: that of the text around it, muted, or the pale of text over a picture.
 */
const MediaFacts = ({
  media,
  size = 'inherit',
  tone = 'inherit',
  hasRuntime = false,
  hasEpisode = true,
  hasSize = false,
}: MediaFactsProps) => {
  const rating = media.rating ?? null;

  const facts: { key: string; said: ReactNode }[] = [
    ...(hasEpisode && typeof media.episodeNumber === 'number'
      ? [
          {
            key: 'episode',
            said: (
              <span className="tabular-nums">
                {say('screens.mediaFacts.episode', {
                  episode: describeEpisodeNumbers(media.episodeNumber, media.episodeNumberEnd),
                })}
              </span>
            ),
          },
        ]
      : []),
    ...(hasEpisode && typeof media.seasonNumber === 'number'
      ? [
          {
            key: 'season',
            said: (
              <span className="tabular-nums">
                {say('screens.mediaFacts.season', { season: media.seasonNumber })}
              </span>
            ),
          },
        ]
      : []),
    ...(rating === null
      ? []
      : [
          {
            key: 'rating',
            said: (
              <span className="flex items-center gap-1.5 tabular-nums">
                <Icon of={StarIcon} size={14} />
                {rating.toFixed(1)}
              </span>
            ),
          },
        ]),
    ...(media.year === null
      ? []
      : [{ key: 'year', said: <span className="tabular-nums">{media.year}</span> }]),
    ...(hasRuntime
      ? [
          {
            key: 'runtime',
            said: <span className="tabular-nums">{formatDuration(media.durationSeconds)}</span>,
          },
        ]
      : []),
    ...(hasSize && typeof media.sizeBytes === 'number' && media.sizeBytes > 0
      ? [
          {
            key: 'size',
            said: <span className="tabular-nums">{formatBytes(media.sizeBytes)}</span>,
          },
        ]
      : []),
  ];

  if (facts.length === 0) {
    return null;
  }

  return (
    <span className={cn('flex flex-wrap items-center gap-2', SIZES[size], TONES[tone])}>
      {facts.map((fact, at) => (
        <span key={fact.key} className="flex items-center gap-2">
          {at === 0 ? null : <span aria-hidden>·</span>}
          {fact.said}
        </span>
      ))}
    </span>
  );
};

MediaFacts.displayName = 'MediaFacts';

export { MediaFacts };
