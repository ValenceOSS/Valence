import type { MediaGridSize } from '@ValenceScreens/components/MediaGrid/MediaGrid.types';

type GridSizeChooserProps = {
  value: MediaGridSize;
  onValueChange: (size: MediaGridSize) => void;
  look?: 'track' | 'joined';
  className?: string;
};

export type { GridSizeChooserProps };
