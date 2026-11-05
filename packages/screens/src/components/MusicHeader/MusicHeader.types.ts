import type { ReactNode } from 'react';

type MusicHeaderProps = {
  eyebrow: string;
  title: string;
  artwork?: ReactNode;
  layout?: 'banner' | 'hero';
  backdrop?: string | null;
  isBackdropSharp?: boolean;
  details?: ReactNode;
  actions?: ReactNode;
};

export type { MusicHeaderProps };
