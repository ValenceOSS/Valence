import type { ReactNode } from 'react';

type ScrolledTitleProps = {
  title: string;
  artwork?: string | null;
  detail?: ReactNode;
  isShowing: boolean;
  tint?: string | null;
  children?: ReactNode;
};

export type { ScrolledTitleProps };
