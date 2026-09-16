import type { MotionValue } from 'motion/react';

type ScrollWordAnnotation = 'tag' | 'emphasis';

type ScrollWordProps = {
  children: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
  annotation?: ScrollWordAnnotation;
};

export type { ScrollWordAnnotation, ScrollWordProps };
