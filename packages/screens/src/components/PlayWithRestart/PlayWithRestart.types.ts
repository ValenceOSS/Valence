import type { ReactNode } from 'react';

type PlayWithRestartProps = {
  children: ReactNode;
  onStartAgain?: () => void;
  size?: 'md' | 'lg';
};

export type { PlayWithRestartProps };
