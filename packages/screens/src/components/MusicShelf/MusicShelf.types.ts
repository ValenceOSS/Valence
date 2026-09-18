import type { ReactNode } from 'react';

type MusicShelfLayout = 'rail' | 'grid';

type MusicShelfProps = {
  heading: string;
  layout?: MusicShelfLayout;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
};

export type { MusicShelfLayout, MusicShelfProps };
