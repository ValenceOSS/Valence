import type { ReactNode } from 'react';

type MockPanelProps = {
  title: string;
  actions?: ReactNode;
  isFlush?: boolean;
  children: ReactNode;
  className?: string;
};

export type { MockPanelProps };
