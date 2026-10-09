import type { ReactNode } from 'react';
import type { TitleStatus } from '@ValenceContracts/schemas/AdminCatalogue';

type TitleHeroProps = {
  title: string;
  year: number | null;
  artUrl: string | null;
  art: 'poster' | 'square' | 'round';
  backdropUrl: string | null;
  status: TitleStatus;
  facts: readonly string[];
  overview: string | null;
  askedBy: { name: string; at: string } | null;
  actions: ReactNode;
};

export type { TitleHeroProps };
