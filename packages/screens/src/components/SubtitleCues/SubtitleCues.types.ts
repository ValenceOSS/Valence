import type { RefObject } from 'react';
import type { CaptionStyle } from '@ValenceClient/playback/captionStyle';

type SubtitleCuesProps = {
  src: string;
  cuesSrc?: string;
  atSeconds: number;
  video?: RefObject<HTMLVideoElement | null>;
  offsetSeconds?: number;
  style: CaptionStyle;
  isLifted?: boolean;
};

export type { SubtitleCuesProps };
