import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';
import type { CaptionStyle } from '@ValenceClient/playback/captionStyle';

type TheSubtitlesProps = {
  cues: readonly SubtitleCue[];
  atSeconds: number;
  isClearOfTheControls: boolean;
  captionStyle: CaptionStyle;
};

export type { TheSubtitlesProps };
