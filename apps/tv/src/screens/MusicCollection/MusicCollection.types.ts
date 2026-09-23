import type { ListenedView } from '@ValenceTv/music/ListenedView';
import type { MusicItem } from '@ValenceTv/music/MusicItem';

type MusicCollectionProps = {
  view: ListenedView;
  onPlayed: () => void;
  onOpen: (item: MusicItem) => void;
  onLight: (path: string | null) => void;
};

export type { MusicCollectionProps };
