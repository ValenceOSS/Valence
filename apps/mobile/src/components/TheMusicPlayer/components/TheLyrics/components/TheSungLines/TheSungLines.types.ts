import type { LyricLine } from '@ValenceContracts/schemas/Music';

type TheSungLinesProps = {
  lines: readonly LyricLine[];
  isSynced: boolean;
  sung: number;
  onSeek: (toSeconds: number) => void;
};

export type { TheSungLinesProps };
