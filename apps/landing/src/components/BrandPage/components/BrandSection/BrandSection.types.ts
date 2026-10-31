import type { ReactNode } from 'react';

type BrandSectionProps = {
  id?: string;
  title: string;
  text: string;
  actions?: ReactNode;
  children: ReactNode;
};

export type { BrandSectionProps };
