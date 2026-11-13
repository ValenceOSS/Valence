import { PICTURE_ASPECTS } from '@ValenceContracts/constants/PICTURE_ASPECTS';

const CROPS = {
  face: { aspect: PICTURE_ASPECTS.face, longestEdge: 512, quality: 82 },
  cover: { aspect: PICTURE_ASPECTS.cover, longestEdge: 1500, quality: 90 },
  poster: { aspect: PICTURE_ASPECTS.poster, longestEdge: 2000, quality: 90 },
  backdrop: { aspect: PICTURE_ASPECTS.backdrop, longestEdge: 3840, quality: 90 },
} as const;

export { CROPS };
