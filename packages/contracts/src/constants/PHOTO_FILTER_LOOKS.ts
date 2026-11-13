import type { PhotoFilter } from '@ValenceContracts/schemas/ViewerProfile';

type PhotoFilterLook = {
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

const AS_IT_IS = { saturate: 1, hueRotate: 0, contrast: 1, brightness: 1, layer: null };

const PHOTO_FILTER_LOOKS: Readonly<Record<PhotoFilter, PhotoFilterLook>> = {
  original: AS_IT_IS,
  greyscale: { ...AS_IT_IS, saturate: 0, contrast: 1.1 },
  noir: { ...AS_IT_IS, saturate: 0, contrast: 1.5, brightness: 0.95 },
  warm: {
    ...AS_IT_IS,
    saturate: 1.1,
    brightness: 1.02,
    layer: { colour: '#ff8a3d', blend: 'soft-light', opacity: 0.45 },
  },
  cool: { ...AS_IT_IS, layer: { colour: '#3d8bff', blend: 'soft-light', opacity: 0.45 } },
  vivid: { ...AS_IT_IS, saturate: 1.5, contrast: 1.1 },
  faded: { ...AS_IT_IS, saturate: 0.65, contrast: 0.85, brightness: 1.08 },
  retro: {
    ...AS_IT_IS,
    saturate: 0.75,
    contrast: 0.88,
    brightness: 1.06,
    layer: { colour: '#ffb066', blend: 'soft-light', opacity: 0.5 },
  },
  sunset: {
    ...AS_IT_IS,
    saturate: 1.2,
    layer: { colour: '#ff5a36', blend: 'overlay', opacity: 0.35 },
  },
  neon: {
    ...AS_IT_IS,
    saturate: 1.8,
    contrast: 1.15,
    brightness: 1.05,
    layer: { colour: '#ff2bd6', blend: 'soft-light', opacity: 0.4 },
  },
  blueprint: {
    ...AS_IT_IS,
    saturate: 0,
    contrast: 1.2,
    layer: { colour: '#1f4fff', blend: 'screen', opacity: 0.65 },
  },
  psychedelic: { ...AS_IT_IS, saturate: 1.6, hueRotate: 180, contrast: 1.05 },
  inverted: { ...AS_IT_IS, layer: { colour: '#ffffff', blend: 'difference', opacity: 1 } },
};

export type { PhotoFilterLook };

export { PHOTO_FILTER_LOOKS };
