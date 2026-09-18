import type { ReactNode } from 'react';

type StatTileDirection = 'up' | 'down';

type StatTileTrend = {
  direction: StatTileDirection;
  label: string;
};

type StatTileProps = {
  label: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  fraction?: number;
  history?: ReactNode;
  trend?: StatTileTrend;
  className?: string;
};

export type { StatTileProps, StatTileTrend, StatTileDirection };
