import type { ReleaseParts } from './ReleaseParts';

type SubtitleVideo = {
  kind: 'movie' | 'episode';
  parts: ReleaseParts;
  season: number | null;
  episode: number | null;
  frameRate: number | null;
};

export type { SubtitleVideo };
