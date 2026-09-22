import type { ReactNode } from 'react';

type TitleSpreadProps = {
  mediaId: string;
  name: string;
  hasLogo: boolean;
  stillPath: string | null;
  facts: string;
  badges: readonly string[];
  tagline?: string | null | undefined;
  overview?: string | null | undefined;
  credits: readonly string[];
  children: ReactNode;
  below?: ReactNode;
};

export type { TitleSpreadProps };
