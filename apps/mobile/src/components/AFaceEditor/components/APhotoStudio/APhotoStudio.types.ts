import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

type APhotoStudioProps = {
  frame: PhotoFrame;
  onPick: (picked: { uri: string; isVideo: boolean }) => void;
  onFrame: (frame: PhotoFrame) => void;
};

export type { APhotoStudioProps };
