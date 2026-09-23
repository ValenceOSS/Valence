import type { MusicItem } from '@ValenceTv/music/MusicItem';

type MusicTileProps = {
  item: MusicItem;
  onPress: (item: MusicItem) => void;
  onFocus?: (item: MusicItem) => void;
  isUrgent?: boolean;
  size?: number;
};

export type { MusicTileProps };
