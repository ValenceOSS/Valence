import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

type PhotoStudioProps = {
  fileName: string | null;
  hasPicture: boolean;
  frame: PhotoFrame;
  onPick: (file: File) => void;
  onFrame: (frame: PhotoFrame) => void;
};

export type { PhotoStudioProps };
