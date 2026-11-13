import type { PictureFrame } from '@ValenceCore/pictures/PictureFrame';
import type { PictureTone } from '@ValenceCore/pictures/PictureTone';

type FramedPictureProps = {
  src: string;
  frame: PictureFrame | null;
  aspect: number;
  tone?: PictureTone | null;
  onMeasure?: (size: { width: number; height: number }) => void;
  onError?: () => void;
  className?: string;
};

export type { FramedPictureProps };
