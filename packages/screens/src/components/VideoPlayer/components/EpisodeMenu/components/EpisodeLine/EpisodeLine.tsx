import { useRef, useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import {
  CircleCheck as CircleCheckFilledIcon,
  Play as PlayFilledIcon,
} from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { WatchedBar } from '@ValenceUI/WatchedBar';
import { cn } from '@ValenceUI/cn';
import { easeOut } from '@ValenceUI/animations/reveal';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { describeLength } from '@ValenceClient/books/describeLength';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import { Equaliser } from '@ValenceScreens/components/Equaliser/Equaliser';
import { OPENED_EPISODE_REM } from '@ValenceScreens/components/VideoPlayer/components/EpisodeMenu/OPENED_EPISODE_REM';
import type { EpisodeLineProps } from './EpisodeLine.types';
import { say } from '@ValenceI18n/say';

/**
 * One episode in the player's list of them: a single line with its number, name and length, which
 * opens out to its still and what it is about when it is pointed at or reached by keyboard. On a
 * touch screen the first tap opens it and the second plays it, since there is no pointing there.
 *
 * @param episode - The episode to draw.
 * @param isOn - Whether it is the one on now.
 * @param isMoving - Whether the player is playing, so the mark on the one on now moves with it.
 * @param isOpen - Whether it is opened out.
 * @param watchedFraction - How far through it this viewer is.
 * @param onPoint - Told the pointer came onto it.
 * @param onStopPointing - Told the pointer left it.
 * @param onOpen - Told to open it out now.
 * @param onChoose - Told to play it.
 */
const EpisodeLine = ({
  episode,
  isOn,
  isMoving,
  isOpen,
  watchedFraction,
  onPoint,
  onStopPointing,
  onOpen,
  onChoose,
}: EpisodeLineProps) => {
  const prefersReducedMotion = useReducedMotionConfig() === true;
  const pressedByRef = useRef<string>('mouse');
  const [hasOpened, setHasOpened] = useState(isOpen);

  if (isOpen && !hasOpened) {
    setHasOpened(true);
  }

  const asked = useQuery({ ...libraryQueries.detail(episode.id), enabled: isOpen });
  const overview = asked.data?.metadata.overview ?? null;
  const isWatched = watchedFraction !== undefined && watchedFraction >= 1;
  const isStarted = watchedFraction !== undefined && watchedFraction > 0 && !isWatched;
  const number =
    episode.episodeNumber === null || episode.episodeNumber === undefined
      ? ''
      : describeEpisodeNumbers(episode.episodeNumber, episode.episodeNumberEnd);

  return (
    <Button
      variant="bare"
      size="none"
      hasTooltip={false}
      aria-current={isOn ? 'true' : undefined}
      aria-expanded={isOpen}
      onPointerDown={(event) => {
        pressedByRef.current = event.pointerType;
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') {
          onPoint();
        }
      }}
      onPointerLeave={onStopPointing}
      onFocus={(event) => {
        if (event.currentTarget.matches(':focus-visible')) {
          onOpen();
        }
      }}
      onClick={() => {
        if (pressedByRef.current === 'touch' && !isOpen) {
          onOpen();

          return;
        }

        onChoose();
      }}
      className={cn(
        'group/episode flex w-full flex-col rounded-lg px-2 py-2 text-left',
        'transition-colors duration-[var(--duration-instant)] ease-[var(--ease-out)]',
        'focus-visible:ring-[3px] focus-visible:ring-ring outline-none',
        isOpen ? 'bg-surface-raised' : 'hover-hover:hover:bg-hover',
      )}
    >
      <span className="flex h-5 w-full items-center gap-3">
        <span className="flex w-6 shrink-0 justify-end text-sm tabular-nums text-text-muted">
          {isOn ? (
            <Equaliser
              label={say('common.nowPlaying')}
              isMoving={isMoving}
              className="text-primary"
            />
          ) : (
            number
          )}
        </span>

        <span
          className={cn(
            'min-w-0 flex-1 truncate text-sm',
            isOn ? 'font-semibold text-primary' : 'font-medium text-text',
            isWatched && !isOn && !isOpen ? 'text-text-muted' : '',
          )}
        >
          {episode.title}
        </span>

        {isWatched ? (
          <Icon
            of={CircleCheckFilledIcon}
            size={16}
            tone="success"
            label={say('common.watched')}
            className="shrink-0"
          />
        ) : (
          <span className="shrink-0 text-xs tabular-nums text-text-muted">
            {describeLength(episode.durationSeconds)}
          </span>
        )}
      </span>

      <motion.span
        initial={false}
        animate={
          isOpen
            ? { height: `${OPENED_EPISODE_REM.toString()}rem`, opacity: 1 }
            : { height: '0rem', opacity: 0 }
        }
        transition={{ duration: prefersReducedMotion ? 0 : 0.26, ease: easeOut }}
        aria-hidden={!isOpen}
        className="block w-full overflow-hidden"
      >
        {hasOpened ? (
          <>
            <span className="flex h-24 gap-3 pt-2.5 pb-1 pl-9 box-content">
              <span className="flex w-36 shrink-0 flex-col gap-1.5">
                <span className="relative block aspect-video w-full overflow-hidden rounded-md bg-surface ring-1 ring-line">
                  {episode.hasBackdrop ? (
                    <img
                      src={artworkUrl(episode.id, 'backdrop')}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 ease-[var(--ease-out)] group-hover/episode:scale-[1.04] motion-reduce:transition-none"
                    />
                  ) : null}

                  <span className="absolute inset-0 flex items-center justify-center bg-shade/40 opacity-0 transition-opacity duration-[var(--duration-instant)] group-hover/episode:opacity-100">
                    <span className="flex size-9 items-center justify-center rounded-full bg-shade/60 backdrop-blur-sm">
                      <Icon of={PlayFilledIcon} size={16} tone="scrim" />
                    </span>
                  </span>

                  {isOn ? (
                    <span className="absolute top-1.5 left-1.5 rounded-full bg-shade/70 px-2 py-0.5 text-[0.6875rem] font-medium text-on-scrim backdrop-blur-sm">
                      {say('common.nowPlaying')}
                    </span>
                  ) : null}
                </span>

                {isStarted ? <WatchedBar watched={watchedFraction} /> : null}
              </span>

              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                {overview === null || overview === '' ? null : (
                  <span className="line-clamp-4 text-[0.8125rem] leading-[1.125rem] text-text-muted">
                    {overview}
                  </span>
                )}

                {isStarted && !isOn ? (
                  <span className="text-xs tabular-nums text-text-muted/80">
                    {say('common.durationLeft', {
                      timeLeft: describeLength(episode.durationSeconds * (1 - watchedFraction)),
                    })}
                  </span>
                ) : null}
              </span>
            </span>
          </>
        ) : null}
      </motion.span>
    </Button>
  );
};

EpisodeLine.displayName = 'EpisodeLine';

export { EpisodeLine };
