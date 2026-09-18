import type { ReactNode } from 'react';

type MusicHeaderProps = {
  eyebrow: string;
  title: string;
  artwork: ReactNode;
  tint: string | null;
  details?: ReactNode;
  actions?: ReactNode;
};

export type { MusicHeaderProps };
