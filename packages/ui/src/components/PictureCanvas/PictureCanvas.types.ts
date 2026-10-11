import type { RefObject } from 'react';

type PictureCanvasProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isShown: boolean;
  className?: string;
  aspectRatio?: number;
};

export type { PictureCanvasProps };
