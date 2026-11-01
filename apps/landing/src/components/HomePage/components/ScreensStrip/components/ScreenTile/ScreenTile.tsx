import { useState } from 'react';
import type { PointerEvent } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotionConfig,
  useSpring,
} from 'motion/react';
import { revealItemVariants } from '@ValenceUI/animations/reveal';
import { BrandGlyph } from '@ValenceUI/BrandGlyph';
import { Icon } from '@ValenceUI/Icon';
import type { ScreenTileProps } from './ScreenTile.types';

const MARK_SIZE = 40;

const MOST_TILT_DEGREES = 14;

const SWEEP_SECONDS = 0.9;

const SWEEP_GAP_SECONDS = 3.5;

const STAGGER_SECONDS = 0.16;

const LEAN = { stiffness: 220, damping: 18, mass: 0.5 } as const;

/**
 * One screen Valence plays on, on a solid tile: its mark, its name and where its app comes from. A
 * soft light passes over the marks along the row every few seconds, each a moment after the one
 * before; inside the tile a faint glow follows the pointer, and the mark rises and leans towards it,
 * then sinks back to rest when the pointer leaves before the passing light takes it up again.
 * Whoever asked for stillness sees the tile still.
 *
 * @param screen - The screen: its name, its mark, and where its app comes from. A screen that
 *   could be anybody's, a browser or a computer, wears a plain icon rather than a brand's mark.
 * @param index - Where it stands in the row, which sets when the passing light reaches it.
 * @param count - How many tiles share the row, so the light waits for the whole row between passes.
 */
const ScreenTile = ({ screen, index, count }: ScreenTileProps) => {
  const isStill = useReducedMotionConfig() === true;
  const [isPointedAt, setIsPointedAt] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const spotX = useMotionValue(50);
  const spotY = useMotionValue(50);
  const leanX = useMotionValue(0);
  const leanY = useMotionValue(0);
  const rotateY = useSpring(leanX, LEAN);
  const rotateX = useSpring(leanY, LEAN);
  const spotlight = useMotionTemplate`radial-gradient(circle at ${spotX}% ${spotY}%, color-mix(in oklab, var(--color-text) 9%, transparent), transparent 62%)`;

  const follow = (event: PointerEvent<HTMLLIElement>) => {
    if (isStill || event.pointerType !== 'mouse') {
      return;
    }

    const box = event.currentTarget.getBoundingClientRect();
    const across = (event.clientX - box.left) / box.width;
    const down = (event.clientY - box.top) / box.height;

    spotX.set(across * 100);
    spotY.set(down * 100);
    leanX.set((across - 0.5) * 2 * MOST_TILT_DEGREES);
    leanY.set((down - 0.5) * -2 * MOST_TILT_DEGREES);
  };

  const settle = () => {
    if (isPointedAt) {
      setIsSettling(true);
    }

    setIsPointedAt(false);
    leanX.set(0);
    leanY.set(0);
  };

  return (
    <motion.li
      custom={index}
      variants={revealItemVariants(isStill)}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') {
          setIsPointedAt(true);
        }
      }}
      onPointerMove={follow}
      onPointerLeave={settle}
      className="relative isolate flex flex-col items-center gap-4 overflow-hidden rounded-[1.15rem] bg-[var(--frame-card)] px-4 py-8 text-center sm:py-10"
    >
      {isStill ? null : (
        <motion.span
          aria-hidden
          style={{ backgroundImage: spotlight }}
          animate={{ opacity: isPointedAt ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="pointer-events-none absolute inset-0 -z-10"
        />
      )}

      <span className="flex size-12 items-center justify-center [perspective:400px]">
        <motion.span
          {...(isStill
            ? {}
            : {
                style: { rotateX, rotateY },
                animate: isPointedAt
                  ? { y: -4, scale: 1.1, opacity: 1 }
                  : isSettling
                    ? { y: 0, scale: 1, opacity: 0.6 }
                    : { y: [0, -3, 0], scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] },
                transition:
                  isPointedAt || isSettling
                    ? { type: 'spring', stiffness: 260, damping: 22 }
                    : {
                        duration: SWEEP_SECONDS,
                        ease: 'easeInOut',
                        repeat: Infinity,
                        repeatDelay: SWEEP_GAP_SECONDS + STAGGER_SECONDS * (count - 1),
                        delay: STAGGER_SECONDS * index,
                      },
                onAnimationComplete: () => {
                  if (isSettling) {
                    setIsSettling(false);
                  }
                },
              })}
          className="block text-text"
        >
          {typeof screen.mark === 'string' ? (
            <BrandGlyph of={screen.mark} size={MARK_SIZE} />
          ) : (
            <Icon of={screen.mark} size={MARK_SIZE} />
          )}
        </motion.span>
      </span>

      <span className="flex flex-col gap-1">
        <span className="text-base font-semibold tracking-[-0.01em] text-text">{screen.label}</span>
        <span className="text-sm text-text-muted">{screen.where}</span>
      </span>
    </motion.li>
  );
};

ScreenTile.displayName = 'ScreenTile';

export { ScreenTile };
