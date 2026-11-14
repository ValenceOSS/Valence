import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';
import type { CaptionStyle } from '@ValenceClient/playback/captionStyle';
import type { ABox } from '@ValenceMobile/components/Watching/howBigToDrawIt';
import type { AFrame } from '@ValenceMobile/components/Watching/fittedTo';

type TheSubtitlesProps = {
  cues: readonly SubtitleCue[];
  atSeconds: number;
  isPlaying: boolean;
  isClearOfTheControls: boolean;
  captionStyle: CaptionStyle;
  frame: AFrame | null;
  screen: ABox;
};

export type { TheSubtitlesProps };
