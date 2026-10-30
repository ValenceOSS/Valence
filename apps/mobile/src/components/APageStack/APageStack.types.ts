import type { ReactNode } from 'react';

type AStackedPage = {
  key: string;
  page: ReactNode;
  rises?: boolean;
  isCard?: boolean;
  goesBack?: boolean;
  depth?: number;
  holdsTheEdge?: boolean;
};

type APageStackProps = {
  pages: readonly AStackedPage[];
  onBack: () => void;
};

export type { APageStackProps, AStackedPage };
