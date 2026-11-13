import type { ReactNode } from 'react';

type PlayWithRestartProps = {
  children: ReactNode;
  onStartAgain?: () => void;
  more?: (className: string) => ReactNode;
  size?: 'md' | 'lg';
};

export type { PlayWithRestartProps };
