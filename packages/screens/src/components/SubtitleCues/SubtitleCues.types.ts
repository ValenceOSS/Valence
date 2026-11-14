import type { RefObject } from 'react';
import type { CaptionStyle } from '@ValenceClient/playback/captionStyle';
import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';

type PictureSize = {
  width: number;
  height: number;
};

type SubtitleCuesProps = {
  mediaId: string;
  track: SubtitleTrack;
  atSeconds: number;
  video?: RefObject<HTMLVideoElement | null>;
  picture?: RefObject<PictureSize | null>;
  offsetSeconds?: number;
  style: CaptionStyle;
  isLifted?: boolean;
};

export type { PictureSize, SubtitleCuesProps };
