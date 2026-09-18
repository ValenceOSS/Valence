import type { ReactNode } from 'react';

type MusicTileProps = {
  title: string;
  detail: string;
  artwork: ReactNode;
  onOpen: () => void;
  onPlay?: () => void;
};

export type { MusicTileProps };
