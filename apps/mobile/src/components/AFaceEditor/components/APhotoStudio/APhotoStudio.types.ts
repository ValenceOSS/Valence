import type { PhotoFilter, PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

type APhotoStudioProps = {
  frame: PhotoFrame;
  uri: string | null;
  filter: PhotoFilter;
  onPick: (picked: { uri: string; isVideo: boolean }) => void;
  onFrame: (frame: PhotoFrame) => void;
  onFilter: (filter: PhotoFilter) => void;
};

export type { APhotoStudioProps };
