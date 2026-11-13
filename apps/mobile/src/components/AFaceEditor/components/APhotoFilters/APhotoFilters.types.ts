import type { PhotoFilter, PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

type APhotoFiltersProps = {
  uri: string | null;
  frame: PhotoFrame;
  chosen: PhotoFilter;
  onChoose: (filter: PhotoFilter) => void;
};

export type { APhotoFiltersProps };
