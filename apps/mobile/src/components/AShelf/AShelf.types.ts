import type { ReactNode } from 'react';

type AShelfProps = {
  title: string;
  onSeeAll?: () => void;
  children: ReactNode;
};

export type { AShelfProps };
