import type { ReactNode } from 'react';

type MediaTitleHeroProps = {
  name: string;
  year: number | null;
  posterUrl: string | null;
  badges: ReactNode;
  facts: readonly string[];
  overview: string | null;
  actions: ReactNode;
  tabs: ReactNode;
};

export type { MediaTitleHeroProps };
