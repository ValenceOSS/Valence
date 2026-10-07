import type { MotionValue } from 'motion/react';
import type { ReactNode } from 'react';
import type { DuoFrameProps } from '@ValenceLanding/components/HomePage/components/DuoShowcase/components/DuoFrame/DuoFrame.types';

type DuoPicture = Omit<DuoFrameProps, 'className' | 'children'> & {
  body: { left: number; top: number; width: number; height: number };
};

type DuoFoldProps = {
  open: DuoPicture;
  folded: DuoPicture;
  foldedScreen: string;
  still: string;
  openness: MotionValue<number>;
  children: ReactNode;
};

export type { DuoFoldProps, DuoPicture };
