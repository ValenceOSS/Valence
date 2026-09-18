import type { ReactNode } from 'react';
import type { ActionMenuGroup } from '@ValenceUI/ActionMenu.types';

type MusicTileProps = {
  title: string;
  detail: string;
  artwork: ReactNode;
  onOpen: () => void;
  onPlay?: () => void;
  menu?: ActionMenuGroup[];
};

export type { MusicTileProps };
