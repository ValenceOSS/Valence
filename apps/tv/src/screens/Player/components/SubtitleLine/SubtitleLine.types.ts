import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';
import type { CaptionStyle } from '@ValenceClient/playback/captionStyle';

type SubtitleLineProps = {
  cues: readonly SubtitleCue[];
  position: number;
  isLifted: boolean;
  captionStyle: CaptionStyle;
};

export type { SubtitleLineProps };
