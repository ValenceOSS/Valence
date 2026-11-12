import type { PictureFrame } from '@ValenceCore/pictures/PictureFrame';

type PictureFramerProps = {
  src: string;
  frame: PictureFrame;
  aspect: number;
  mostZoom: number;
  label: string;
  shape?: 'circle' | 'rounded';
  onFrame: (frame: PictureFrame) => void;
  className?: string;
};

export type { PictureFramerProps };
