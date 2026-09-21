import type { ReactNode } from 'react';

type HeadedSectionProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  isInset?: boolean;
  className?: string;
};

export type { HeadedSectionProps };
