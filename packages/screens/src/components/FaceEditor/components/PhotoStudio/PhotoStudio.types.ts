import type { PhotoFilter, PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

type PhotoStudioProps = {
  hasPicture: boolean;
  picture: string | null;
  filter: PhotoFilter;
  frame: PhotoFrame;
  onPick: (file: File) => void;
  onFrame: (frame: PhotoFrame) => void;
  onFilter: (filter: PhotoFilter) => void;
};

export type { PhotoStudioProps };
