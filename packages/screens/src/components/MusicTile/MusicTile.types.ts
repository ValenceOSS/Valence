import type { ReactNode } from 'react';
import type { ActionMenuGroup } from '@ValenceUI/ActionMenu.types';

type MusicTileProps = {
  title: string;
  isTitleShown?: boolean;
  detail: string;
  artwork: ReactNode;
  onOpen: () => void;
  onPlay?: () => void;
  isPlaying?: boolean;
  onPointingAt?: () => void;
  menu?: ActionMenuGroup[];
  shape?: 'square' | 'round';
};

export type { MusicTileProps };
