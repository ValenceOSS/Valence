import type { ReactNode } from 'react';

type ARisingProps = {
  children: ReactNode;
  turn?: number;
  after?: number;
  isArrived?: boolean;
  stretches?: boolean;
};

export type { ARisingProps };
