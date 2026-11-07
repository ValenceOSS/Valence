import type { ReactNode } from 'react';

type MediaTitleHeroProps = {
  name: string;
  aside: string | null;
  posterUrl: string | null;
  backdropUrl?: string | null;
  isWide?: boolean;
  badges: ReactNode;
  facts: readonly { label: string; value: string }[];
  actions: ReactNode;
  tabs: ReactNode;
  children: ReactNode;
};

export type { MediaTitleHeroProps };
