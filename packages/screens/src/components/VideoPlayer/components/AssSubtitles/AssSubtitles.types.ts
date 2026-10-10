import type { RefObject } from 'react';

type AssSubtitlesProps = {
  video: RefObject<HTMLVideoElement | null>;
  mediaId: string;
  trackId: string;
  offsetSeconds: number;
};

export type { AssSubtitlesProps };
