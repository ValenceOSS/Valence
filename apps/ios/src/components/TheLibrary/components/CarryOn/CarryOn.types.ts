import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type CarryOnProps = {
  items: readonly MediaSummary[];
  howFarThrough: (mediaId: string) => number;
  onLookAt: (mediaId: string) => void;
};

export type { CarryOnProps };
