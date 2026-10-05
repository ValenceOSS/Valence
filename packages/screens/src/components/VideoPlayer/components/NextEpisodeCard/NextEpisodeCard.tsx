import { motion, useReducedMotionConfig } from 'motion/react';
import { Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { nameTheNextEpisode } from '@ValenceClient/playback/nameTheNextEpisode';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import type { NextEpisodeCardProps } from './NextEpisodeCard.types';

const ARRIVES = { duration: 0.45, ease: [0.16, 1, 0.3, 1] } as const;

const LEAVES = { duration: 0.2, ease: [0.4, 0, 1, 1] } as const;

const OFF_TO_THE_SIDE = { opacity: 0, x: 48, scale: 0.96 } as const;

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
      animate={{ opacity: 1, x: 0, scale: 1, transition: ARRIVES }}
      exit={{ ...(prefersReducedMotion ? { opacity: 0 } : OFF_TO_THE_SIDE), transition: LEAVES }}
      className="valence-solid flex w-64 origin-bottom-right flex-col gap-2 rounded-lg p-2 text-text sm:w-80"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-shade">
        {episode.hasBackdrop === true ? (
          <img
            src={artworkUrl(episode.id, 'backdrop')}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}

        {isCounting && !prefersReducedMotion ? (
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-on-scrim/25">
            <motion.div
              className="h-full origin-left bg-on-scrim"
              initial={false}
              animate={{ scaleX: offer.counted }}
              transition={COUNTS_BETWEEN_TICKS}
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-0.5 px-1">
        <p className="flex items-baseline justify-between gap-2 text-xs font-medium text-text-muted">
          {say('common.nextEpisode')}
          {isCounting && prefersReducedMotion ? (
            <span className="tabular-nums">
              {sayCount('common.startsInCountSeconds', Math.ceil(offer.secondsLeft))}
            </span>
          ) : null}
        </p>

        <p className="line-clamp-1 text-sm font-medium">{nameTheNextEpisode(episode)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="primary" size="sm" onClick={onPlay}>
          <Icon of={PlayFilledIcon} size={14} />
          {say('common.playNextEpisode')}
        </Button>

        <Button variant="secondary" size="sm" onClick={onWatchCredits}>
          {say('common.watchCredits')}
        </Button>
      </div>
    </motion.div>
  );
};

NextEpisodeCard.displayName = 'NextEpisodeCard';

export { NextEpisodeCard };
