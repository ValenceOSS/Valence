import type { RefObject } from 'react';

type AssSubtitlesProps = {
  video: RefObject<HTMLVideoElement | null>;
  mediaId: string;
  trackId: string;
  offsetSeconds: number;
  picture?: { width: number; height: number } | null;
};

export type { AssSubtitlesProps };
