import type { CaptionStyle } from '@ValenceClient/playback/captionStyle';
import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';

type SubtitleLineProps = {
  cue: SubtitleCue;
  style: CaptionStyle;
};

export type { SubtitleLineProps };
