import type { PhotoFilter, PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

type PhotoFiltersProps = {
  picture: string | null;
  frame: PhotoFrame;
  chosen: PhotoFilter;
  onChoose: (filter: PhotoFilter) => void;
};

export type { PhotoFiltersProps };
