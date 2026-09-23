import type { MediaCardShape } from './MediaCard.types';

const cardSizes: Record<MediaCardShape, { width: number; height: number }> = {
  wide: { width: 420, height: 236 },
  poster: { width: 240, height: 360 },
};

export { cardSizes };
