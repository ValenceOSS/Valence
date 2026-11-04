import type { ReactNode } from 'react';

type MediaTitleHeroProps = {
  name: string;
  year: number | null;
  posterUrl: string | null;
  badges: ReactNode;
  facts: readonly { label: string; value: string }[];
  actions: ReactNode;
  tabs: ReactNode;
};

export type { MediaTitleHeroProps };
