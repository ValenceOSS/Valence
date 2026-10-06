import type { ReactNode } from 'react';

type PageHeroProps = {
  eyebrow?: ReactNode;
  lead: string;
  accent?: string;
  trail?: string;
  description?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
};

export type { PageHeroProps };
