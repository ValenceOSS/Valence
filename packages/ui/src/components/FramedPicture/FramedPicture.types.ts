import type { PictureFrame } from '@ValenceCore/pictures/PictureFrame';

type FramedPictureProps = {
  src: string;
  frame: PictureFrame | null;
  aspect: number;
  onMeasure?: (size: { width: number; height: number }) => void;
  onError?: () => void;
  className?: string;
};

export type { FramedPictureProps };
