import type { ReactNode } from 'react';

type SpreadStageProps = {
  spreads: readonly (readonly number[])[];
  spreadAt: number;
  turnKey: string;
  gap: number;
  isRightToLeft: boolean;
  isAnimated: boolean;
  isHeld?: boolean;
  canGoBack?: boolean;
  canGoOn?: boolean;
  onTurn?: (by: 1 | -1) => void;
  renderPage: (page: number, isShown: boolean) => ReactNode;
};

export type { SpreadStageProps };
