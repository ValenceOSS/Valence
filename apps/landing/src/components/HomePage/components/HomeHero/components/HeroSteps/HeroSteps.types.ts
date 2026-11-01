import type { MotionValue } from 'motion/react';

type HeroStep = {
  id: string;
  title: string;
  detail: string;
};

type HeroStepsProps = {
  steps: readonly HeroStep[];
  active: number;
  progress: MotionValue<number>;
  isStill: boolean;
  onSelect: (at: number) => void;
  className?: string;
};

export type { HeroStep, HeroStepsProps };
