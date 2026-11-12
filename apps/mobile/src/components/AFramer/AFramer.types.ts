import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

type AFramerProps = {
  uri: string;
  frame: PhotoFrame;
  aspect: number;
  width: number;
  roundness?: number;
  onFrame: (frame: PhotoFrame) => void;
};

export type { AFramerProps };
