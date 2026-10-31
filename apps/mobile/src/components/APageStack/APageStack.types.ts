import type { ReactNode } from 'react';

type AStackedPage = {
  key: string;
  page: ReactNode;
  rises?: boolean;
  isCard?: boolean;
  goesBack?: boolean;
  depth?: number;
  trail?: readonly AStackedPage[];
  holdsTheEdge?: boolean;
};

type ACardScroll = {
  atTop: (isAtTop: boolean) => void;
  pullDown: (dy: number) => void;
  letGo: (dy: number, vy: number) => void;
};

type APageStackProps = {
  pages: readonly AStackedPage[];
  onBack: () => void;
  onStepBack?: () => void;
};

export type { ACardScroll, APageStackProps, AStackedPage };
