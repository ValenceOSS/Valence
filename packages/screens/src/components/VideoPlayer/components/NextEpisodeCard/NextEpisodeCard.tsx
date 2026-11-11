import { motion, useReducedMotionConfig } from 'motion/react';
import { Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { nameTheNextEpisode } from '@ValenceClient/playback/nameTheNextEpisode';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { NextEpisodeCardProps } from './NextEpisodeCard.types';

const ARRIVES = { duration: 0.35, ease: [0.23, 1, 0.32, 1] } as const;

const LEAVES = { duration: 0.16, ease: [0.23, 1, 0.32, 1] } as const;

const OFF_TO_THE_SIDE = { opacity: 0, transform: 'translateX(24px) scale(0.97)' } as const;

const IN_PLACE = { opacity: 1, transform: 'translateX(0px) scale(1)' } as const;

const COUNTS_BETWEEN_TICKS = { duration: 0.3, ease: 'linear' } as const;

/**
 * The card in the corner as an episode ends, offering the next one: its still, with a bar that fills
 * until this episode ends and the next starts on its own, its place and name, and a choice between
 * playing it now and staying for the credits. With less motion asked for, the seconds left are
 * written out instead of the bar.
 *
 * @param episode - What comes next.
 * @param offer - How far the count to the end has got.
 * @param isCounting - Whether the next episode will start on its own at the end, which is what the
 *   count is counting towards.
 * @param onPlay - Told to start it now.
 * @param onWatchCredits - Told to put the card away and stay with the credits.
 */
const NextEpisodeCard = ({
  episode,
  offer,
  isCounting,
  onPlay,
  onWatchCredits,
}: NextEpisodeCardProps) => {
  const prefersReducedMotion = useReducedMotionConfig() === true;

  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 0 } : OFF_TO_THE_SIDE}
      animate={{ ...IN_PLACE, transition: ARRIVES }}
      exit={{ ...(prefersReducedMotion ? { opacity: 0 } : OFF_TO_THE_SIDE), transition: LEAVES }}
      className="valence-solid flex w-[min(24rem,calc(100vw-2rem))] origin-bottom-right flex-col gap-3 rounded-2xl p-2.5 text-text"
    >
      <div className="flex items-center gap-3">
        <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-shade">
          {episode.hasBackdrop === true ? (
            <img
              src={artworkUrl(episode.id, 'backdrop', { size: 'medium' })}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="flex items-baseline gap-2 text-xs font-medium text-text-muted">
            {say('common.nextEpisode')}
            {isCounting && prefersReducedMotion ? (
              <span className="tabular-nums">
                {sayCount('common.startsInCountSeconds', Math.ceil(offer.secondsLeft))}
              </span>
            ) : null}
          </p>

          <p className="line-clamp-2 text-sm font-semibold leading-snug">
            {nameTheNextEpisode(episode)}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="confirm"
          size="md"
          isPill
          onClick={onPlay}
          className="relative flex-1 overflow-hidden"
        >
          {isCounting && !prefersReducedMotion ? (
            <motion.span
              aria-hidden
              className="absolute inset-0 origin-left bg-shade/10"
              initial={false}
              animate={{ transform: `scaleX(${offer.counted.toString()})` }}
              transition={COUNTS_BETWEEN_TICKS}
            />
          ) : null}
          <Icon of={PlayFilledIcon} size={14} />
          {say('common.playNextEpisode')}
        </Button>

        <Button variant="secondary" size="md" isPill onClick={onWatchCredits}>
          {say('common.watchCredits')}
        </Button>
      </div>
    </motion.div>
  );
};

NextEpisodeCard.displayName = 'NextEpisodeCard';

export { NextEpisodeCard };
