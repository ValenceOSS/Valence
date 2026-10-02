import type { CaptionStyle } from '@ValenceClient/playback/captionStyle';

type SubtitleCuesProps = {
  src: string;
  cuesSrc?: string;
  atSeconds: number;
  style: CaptionStyle;
  isLifted?: boolean;
};

export type { SubtitleCuesProps };
