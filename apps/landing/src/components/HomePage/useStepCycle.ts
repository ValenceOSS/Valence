import { useCallback, useEffect, useRef, useState } from 'react';
import { animate, useMotionValue } from 'motion/react';
import type { AnimationPlaybackControls, MotionValue } from 'motion/react';

type StepCycle = {
  active: number;
  progress: MotionValue<number>;
  select: (at: number) => void;
};

/**
 * Walks through a number of steps one after another, each staying for the same time, with how far
 * through the current one it is from 0 to 1. Pausing holds the step and its progress where they
 * are, and choosing a step stops the one filling and starts the chosen one from the beginning.
 *
 * @param count - How many steps there are.
 * @param stayMs - How long each step stays before the next takes over.
 * @param isRunning - Whether time is passing; false holds everything still.
 * @returns The step showing, how far through it is, and a way to choose one.
 */
const useStepCycle = (count: number, stayMs: number, isRunning: boolean): StepCycle => {
  const [active, setActive] = useState(0);
  const [round, setRound] = useState(0);
  const progress = useMotionValue(0);
  const filling = useRef<AnimationPlaybackControls | null>(null);

  useEffect(() => {
    if (!isRunning || count < 2) {
      return undefined;
    }

    const remaining = stayMs * (1 - progress.get());
    const fill = animate(progress, 1, { duration: remaining / 1000, ease: 'linear' });

    filling.current = fill;
    const timer = window.setTimeout(() => {
      fill.stop();
      progress.set(0);
      setActive((now) => (now + 1) % count);
    }, remaining);

    return () => {
      fill.stop();
      window.clearTimeout(timer);
    };
  }, [active, round, isRunning, count, stayMs, progress]);

  const select = useCallback(
    (at: number) => {
      filling.current?.stop();
      progress.set(0);
      setActive(at);
      setRound((now) => now + 1);
    },
    [progress],
  );

  return { active, progress, select };
};

export { useStepCycle };
