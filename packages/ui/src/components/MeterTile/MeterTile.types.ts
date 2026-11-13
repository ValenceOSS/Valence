import type { ReactNode } from 'react';

type MeterTileProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  fraction?: number;
  icon?: ReactNode;
  className?: string;
};

export type { MeterTileProps };
