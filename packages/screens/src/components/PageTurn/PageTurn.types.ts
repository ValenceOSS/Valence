import type { ReactNode } from 'react';

type PageTurnProps = {
  from: readonly number[];
  to: readonly number[];
  isAdvancing: boolean;
  isRightToLeft: boolean;
  gap: number;
  seconds: number;
  renderPage: (page: number) => ReactNode;
  onDone: () => void;
};

export type { PageTurnProps };
