import type { ReactNode } from 'react';

type ACardArrivalProps = {
  children: ReactNode;
  at: number;
  isArrived?: boolean;
  onArrived?: () => void;
};

export type { ACardArrivalProps };
