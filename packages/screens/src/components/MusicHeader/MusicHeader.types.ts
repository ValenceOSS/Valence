import type { ReactNode } from 'react';

type MusicHeaderProps = {
  eyebrow: string;
  title: string;
  artwork: ReactNode;
  details?: ReactNode;
  actions?: ReactNode;
};

export type { MusicHeaderProps };
