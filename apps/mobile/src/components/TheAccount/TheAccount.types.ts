import type { ReactNode } from 'react';

type TheAccountProps = {
  onOut: () => void;
  onElsewhere: () => void;
  header?: ReactNode;
  onScrolled?: (isScrolled: boolean) => void;
  shown?: string;
};

export type { TheAccountProps };
