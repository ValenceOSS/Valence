import type { ReactNode } from 'react';

type FadeInProps = {
  children: ReactNode;
  isFilling?: boolean;
  isShown?: boolean;
  delayMs?: number;
};

export type { FadeInProps };
