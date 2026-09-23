import type { ReactNode } from 'react';

type AStackedPage = {
  key: string;
  page: ReactNode;
  rises?: boolean;
  holdsTheEdge?: boolean;
};

type APageStackProps = {
  pages: readonly AStackedPage[];
  onBack: () => void;
};

export type { APageStackProps, AStackedPage };
