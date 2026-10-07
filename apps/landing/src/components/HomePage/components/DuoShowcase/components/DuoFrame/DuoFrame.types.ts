import type { ReactNode } from 'react';

type DuoFrameProps = {
  frame: string;
  width: number;
  height: number;
  screen: { left: number; top: number; width: number; height: number };
  className?: string;
  children: ReactNode;
};

export type { DuoFrameProps };
