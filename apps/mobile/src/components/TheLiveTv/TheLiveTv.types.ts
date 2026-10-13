import type { ReactNode } from 'react';

type TheLiveTvProps = {
  header: ReactNode;
  onScrolled?: (isScrolled: boolean) => void;
};

export type { TheLiveTvProps };
