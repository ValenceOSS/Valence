import type { ReactNode } from 'react';

type OverviewStatProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  onOpen?: () => void;
};

export type { OverviewStatProps };
