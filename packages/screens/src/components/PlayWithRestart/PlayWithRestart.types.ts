import type { ReactNode } from 'react';

type PlayWithRestartProps = {
  children: ReactNode;
  onStartAgain?: () => void;
};

export type { PlayWithRestartProps };
