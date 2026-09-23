import type { View } from 'react-native';
import type { MusicItem } from '@ValenceTv/music/MusicItem';

type MusicProps = {
  onOpen: (item: MusicItem) => void;
  onFeature: (path: string | null) => void;
  upTo: View | null;
};

export type { MusicProps };
