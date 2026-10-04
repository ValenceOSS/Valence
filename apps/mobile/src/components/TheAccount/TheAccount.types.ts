import type { ReactNode } from 'react';

type TheAccountProps = {
  onOut: () => void;
  onElsewhere: () => void;
  onOpen: (panel: string) => void;
  header?: ReactNode;
  onScrolled?: (isScrolled: boolean) => void;
};

export type { TheAccountProps };
