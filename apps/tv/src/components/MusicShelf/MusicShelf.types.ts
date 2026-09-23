import type { MusicItem } from '@ValenceTv/music/MusicItem';

type MusicShelfProps = {
  title: string;
  items: readonly MusicItem[];
  onOpen: (item: MusicItem) => void;
  onFocus?: (item: MusicItem) => void;
};

export type { MusicShelfProps };
