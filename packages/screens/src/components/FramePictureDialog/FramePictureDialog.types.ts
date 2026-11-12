import type { PhotoFrame } from '@ValenceContracts/schemas/ViewerProfile';

type FramePictureDialogProps = {
  file: File | null;
  aspect: number;
  shape?: 'circle' | 'rounded';
  onClose: () => void;
  onUse: (file: File, frame: PhotoFrame) => void;
};

export type { FramePictureDialogProps };
