import { motion, useReducedMotionConfig } from 'motion/react';
import type { Transition } from 'motion/react';
import { RotateCcw10s as RotateCcwIcon, RotateCw10s as RotateCwIcon } from '@keyline-icons/react';
import { Pause as PauseFilledIcon, Play as PlayFilledIcon } from '@keyline-icons/react/fill';
import { Icon } from '@ValenceUI/Icon';
import type { StageCueProps } from './StageCue.types';

const FLASH: Transition = { duration: 0.6, times: [0, 0.2, 1], ease: [0.23, 1, 0.32, 1] };

const PLACES = {
  toggle: 'left-1/2 -translate-x-1/2',
  back: 'left-[20%] -translate-x-1/2',
  forward: 'right-[20%] translate-x-1/2',
} as const;

/**
 * The glyph that blinks over the picture when it is clicked or tapped, so a press that hid nothing
 * and showed nothing still says what it did: playing, paused, or moved back or forward.
 *
 * @param cue - What was just pressed, and when, so pressing again blinks again.
 * @param isPlaying - Whether it plays now, which decides the glyph a play or pause shows.
 */
const StageCue = ({ cue, isPlaying }: StageCueProps) => {
  const prefersReducedMotion = useReducedMotionConfig() === true;

  if (cue === null) {
    return null;
  }

  const glyph =
    cue.kind === 'back'
      ? RotateCcwIcon
      : cue.kind === 'forward'
        ? RotateCwIcon
        : isPlaying
          ? PlayFilledIcon
          : PauseFilledIcon;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute top-1/2 z-20 -translate-y-1/2 ${PLACES[cue.kind]}`}
    >
      <motion.div
        key={cue.at}
        initial={{ opacity: 0, transform: prefersReducedMotion ? 'scale(1)' : 'scale(0.9)' }}
        animate={{
          opacity: [0, 1, 0],
          transform: prefersReducedMotion
            ? ['scale(1)', 'scale(1)', 'scale(1)']
            : ['scale(0.9)', 'scale(1)', 'scale(1.05)'],
        }}
        transition={FLASH}
        className="grid size-16 place-items-center rounded-full bg-shade/50 text-on-scrim backdrop-blur-md"
      >
        <Icon of={glyph} size={28} />
      </motion.div>
    </div>
  );
};

StageCue.displayName = 'StageCue';

export { StageCue };
