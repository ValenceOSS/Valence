import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';

type TheSubtitlesProps = {
  cues: readonly SubtitleCue[];
  atSeconds: number;
  isClearOfTheControls: boolean;
};

export type { TheSubtitlesProps };
