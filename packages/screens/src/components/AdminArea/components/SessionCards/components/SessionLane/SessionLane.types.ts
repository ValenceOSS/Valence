import type { ReactNode } from 'react';
import type { MediaGridSize } from '@ValenceScreens/components/MediaGrid/MediaGrid.types';

type SessionLaneProps = {
  name: string;
  face: ReactNode;
  count: number;
  size: MediaGridSize;
  children: ReactNode;
};

export type { SessionLaneProps };
