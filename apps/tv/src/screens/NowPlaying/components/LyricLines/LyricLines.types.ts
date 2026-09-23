import type { Lyrics } from '@ValenceContracts/schemas/Music';

type LyricLinesProps = {
  lyrics: Lyrics;
  positionMs: number;
  onSeek: (seconds: number) => void;
};

export type { LyricLinesProps };
