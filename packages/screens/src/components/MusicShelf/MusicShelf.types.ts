import type { ReactNode } from 'react';

type MusicShelfLayout = 'rail' | 'grid';

type MusicShelfTile = { key: string; tile: ReactNode };

type MusicShelfProps = {
  heading: string;
  layout?: MusicShelfLayout;
  count?: number;
  action?: ReactNode;
  tiles: readonly MusicShelfTile[];
};

export type { MusicShelfLayout, MusicShelfProps, MusicShelfTile };
