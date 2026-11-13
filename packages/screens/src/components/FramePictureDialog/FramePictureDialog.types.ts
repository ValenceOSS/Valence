import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

type FramePictureDialogProps = {
  file: File | null;
  aspect: number;
  limits: { mostBytes: number; mostPixelsAnEdge: number };
  shape?: 'circle' | 'rounded';
  onClose: () => void;
  onUse: (file: File, frame: PhotoFrame) => void;
};

export type { FramePictureDialogProps };
