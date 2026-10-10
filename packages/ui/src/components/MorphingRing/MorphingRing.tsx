import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotionConfig } from 'motion/react';
import { RingSegments } from './components/RingSegments/RingSegments';
import type { MorphingRingProps } from './MorphingRing.types';

const SEGMENTS = 8;

const TICK_MILLISECONDS = 360;

const FINISH_TICK_MILLISECONDS = 45;

/**
 * A ring of eight segments. Waiting on something of unknown length, it lights one more segment at a
 * time until all are lit, then puts them out again from the first, turning as it goes where it is
 * told to. Told to finish, it lights the rest quickly from wherever it had got to and says when
 * the ring is whole. Given a progress, it holds still with as many lit as it has reached. Somebody
 * who asked for less motion sees it standing still. Drawn from its own segments rather than icons,
 * since no icon set carries a ring in separate segments.
 *
 * @param size - How large to draw it, in pixels.
 * @param progress - How far along it is, from nothing to done, where that is known.
 * @param isFinishing - Whether what it waited for has arrived, so it fills the rest quickly.
 * @param isTurning - Whether the ring also turns as it fills, for a ring large enough that the
 *   turning reads as motion rather than jitter.
 * @param onFilled - Told once it has finished and every segment is lit.
 */
const MorphingRing = ({
  size,
  progress,
  isFinishing = false,
  isTurning = false,
  onFilled,
}: MorphingRingProps) => {
  const isStill = useReducedMotionConfig() === true;
  const [ticks, setTicks] = useState(0);
  const [finish, setFinish] = useState<{ lit: number; from: number } | null>(null);
  const isTicking = progress === undefined && !isStill;
  const phase = ticks % (SEGMENTS * 2);
  const isEmptying = phase >= SEGMENTS;
  const lit = finish?.lit ?? (isEmptying ? SEGMENTS : phase + 1);
  const litFrom = finish?.from ?? (isEmptying ? phase - SEGMENTS + 1 : 0);
  const shownRef = useRef({ lit, from: litFrom });

  shownRef.current = { lit, from: litFrom };

  useEffect(() => {
    if (!isFinishing) {
      return undefined;
    }

    if (isStill) {
      onFilled?.();

      return undefined;
    }

    setFinish((was) => was ?? shownRef.current);

    const timer = setInterval(() => {
      setFinish((was) => {
        if (was === null) {
          return was;
        }

        if (was.lit < SEGMENTS) {
          return { ...was, lit: was.lit + 1 };
        }

        return was.from > 0 ? { ...was, from: was.from - 1 } : was;
      });
    }, FINISH_TICK_MILLISECONDS);

    return () => {
      clearInterval(timer);
    };
  }, [isFinishing, isStill, onFilled]);

  useEffect(() => {
    if (finish !== null && finish.lit === SEGMENTS && finish.from === 0) {
      onFilled?.();
    }
  }, [finish, onFilled]);

  useEffect(() => {
    if (!isTicking || isFinishing) {
      return undefined;
    }

    const timer = setInterval(() => {
      setTicks((was) => was + 1);
    }, TICK_MILLISECONDS);

    return () => {
      clearInterval(timer);
    };
  }, [isTicking, isFinishing]);

  if (!isTicking) {
    const held =
      progress === undefined
        ? SEGMENTS - 2
        : Math.min(Math.max(Math.ceil(progress * SEGMENTS), 0), SEGMENTS);

    return (
      <span aria-hidden className="relative block shrink-0" style={{ width: size, height: size }}>
        <RingSegments size={size} count={SEGMENTS} lit={held} />
      </span>
    );
  }

  return (
    <motion.span
      aria-hidden
      className="relative block shrink-0"
      animate={{ rotate: isTurning ? ticks * (360 / SEGMENTS) : 0 }}
      transition={{ duration: TICK_MILLISECONDS / 1000, ease: 'linear' }}
      style={{ width: size, height: size }}
    >
      <RingSegments size={size} count={SEGMENTS} lit={lit} litFrom={litFrom} />
    </motion.span>
  );
};

MorphingRing.displayName = 'MorphingRing';

export { MorphingRing };
