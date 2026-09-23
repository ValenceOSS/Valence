import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';

type SubtitleLineProps = {
  cues: readonly SubtitleCue[];
  position: number;
  isLifted: boolean;
};

export type { SubtitleLineProps };
