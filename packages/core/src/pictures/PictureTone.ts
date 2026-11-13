type PictureTone = {
  saturate: number;
  hueRotate: number;
  contrast: number;
  brightness: number;
  layer: {
    colour: string;
    blend: 'soft-light' | 'overlay' | 'screen' | 'difference';
    opacity: number;
  } | null;
};

export type { PictureTone };
