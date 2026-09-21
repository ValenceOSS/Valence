import type { ReactNode } from 'react';

type HeadedSectionProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export type { HeadedSectionProps };
