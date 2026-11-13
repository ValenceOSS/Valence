import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';
import type { PictureTone } from '@ValenceCore/pictures/PictureTone';

type AFramerProps = {
  uri: string;
  frame: PhotoFrame;
  aspect: number;
  tone?: PictureTone | null;
  width: number;
  roundness?: number;
  onFrame: (frame: PhotoFrame) => void;
};

export type { AFramerProps };
