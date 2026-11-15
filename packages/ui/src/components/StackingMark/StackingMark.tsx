import { motion, useReducedMotionConfig } from 'motion/react';
import { Logo } from '@ValenceUI/Logo';
import { cn } from '@ValenceUI/cn';
import type { StackingMarkProps } from './StackingMark.types';

const BANDS = [
  { src: '/valence-layers-base.svg', after: 0, takes: 0.56 },
  { src: '/valence-layers-middle.svg', after: 0.13, takes: 0.54 },
  { src: '/valence-layers-top.svg', after: 0.24, takes: 0.52 },
] as const;

const FALL = [0.5, 0, 0.75, 0] as const;

const LAND = [0.3, 0, 0.3, 1] as const;

const SETTLE = [0.22, 1, 0.36, 1] as const;

const CYCLE = 3.2;

const LEAVES = 1.9;

const LAST_AFTER = 0.24;

const UNSETTLE = [0.64, 0, 0.78, 0] as const;

const UNLAND = [0.7, 0, 0.7, 1] as const;

const RISE = [0.25, 1, 0.5, 1] as const;

/**
 * Valence's mark built the way the brand moves: the base, then the middle, then the top layer
 * dropping in and settling onto the stack with a little give, once, or over and over, with the
 * stack leaving between turns the way it came in played backwards: the top layer first, each one
 * giving a little before it lifts away. Whoever asked for stillness sees the mark already stacked.
 *
 * @param isLooping - Whether it stacks, holds and lifts away again for ever, for a screen that waits.
 * @param isCurrentColour - Whether it takes the colour of the text around it rather than the ink.
 * @param delay - How long to wait before the first layer drops, in seconds.
 * @param label - What it is, for anybody who cannot see it; omit where a name sits beside it.
 * @param className - How large it is and where it sits.
 */
const StackingMark = ({
  isLooping = false,
  isCurrentColour = false,
  delay = 0,
  label,
  className,
}: StackingMarkProps) => {
  const isStill = useReducedMotionConfig() === true;

  return (
    <span
      {...(label === undefined ? { 'aria-hidden': true } : { role: 'img', 'aria-label': label })}
      style={{ aspectRatio: (140 / 132).toString() }}
      className={cn('relative inline-block shrink-0', className)}
    >
      {BANDS.map((band) => {
        const mark = (
          <Logo
            src={band.src}
            isSolid={!isCurrentColour}
            isCurrentColour={isCurrentColour}
            className="absolute inset-0 h-full"
          />
        );

        if (isStill) {
          return (
            <span key={band.src} className="absolute inset-0">
              {mark}
            </span>
          );
        }

        const leavesAt = LEAVES + LAST_AFTER - 2 * band.after;
        const at = (seconds: number) => seconds / CYCLE;

        return (
          <motion.span
            key={band.src}
            className="absolute inset-0 origin-bottom"
            initial={{ y: '-55%', opacity: 0 }}
            animate={
              isLooping
                ? {
                    y: ['-55%', '0%', '0%', '0%', '0%', '0%', '0%', '-55%', '-55%'],
                    scaleY: [1, 1, 0.9, 1, 1, 0.9, 1, 1, 1],
                    opacity: [0, 1, 1, 1, 1, 1, 1, 0, 0],
                  }
                : { y: ['-55%', '0%', '0%', '0%'], scaleY: [1, 1, 0.9, 1], opacity: [0, 1, 1, 1] }
            }
            transition={{
              duration: isLooping ? CYCLE : band.takes,
              delay: delay + band.after,
              times: isLooping
                ? [
                    0,
                    at(band.takes * 0.42),
                    at(band.takes * 0.6),
                    at(band.takes),
                    at(leavesAt),
                    at(leavesAt + band.takes * 0.4),
                    at(leavesAt + band.takes * 0.58),
                    at(leavesAt + band.takes),
                    1,
                  ]
                : [0, 0.42, 0.6, 1],
              ease: isLooping
                ? [FALL, LAND, SETTLE, 'linear', UNSETTLE, UNLAND, RISE, 'linear']
                : [FALL, LAND, SETTLE],
              ...(isLooping ? { repeat: Infinity } : {}),
            }}
          >
            {mark}
          </motion.span>
        );
      })}
    </span>
  );
};

StackingMark.displayName = 'StackingMark';

export { StackingMark };
