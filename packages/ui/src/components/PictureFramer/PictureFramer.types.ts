import type { PictureFrame } from '@ValenceCore/pictures/PictureFrame';
import type { PictureTone } from '@ValenceCore/pictures/PictureTone';

type PictureFramerProps = {
  src: string;
  frame: PictureFrame;
  aspect: number;
  tone?: PictureTone | null;
  mostZoom: number;
  label: string;
  shape?: 'circle' | 'rounded';
  onFrame: (frame: PictureFrame) => void;
  className?: string;
};

export type { PictureFramerProps };
