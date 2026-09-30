import type { Lyrics } from '@ValenceContracts/schemas/Music';

type LyricLinesLook = 'page' | 'immersive' | 'panel';

type LyricLinesProps = {
  lyrics: Lyrics;
  at: number;
  onSeek: (seconds: number) => void;
  look?: LyricLinesLook;
};

export type { LyricLinesLook, LyricLinesProps };
