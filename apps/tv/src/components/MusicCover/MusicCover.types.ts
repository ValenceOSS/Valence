import type { StyleProp, ViewStyle } from 'react-native';
import type { MusicItemKind } from '@ValenceTv/music/MusicItem';

type MusicCoverProps = {
  kind: MusicItemKind;
  art: string | null;
  size: number;
  isUrgent?: boolean;
  crossfadeMs?: number;
  style?: StyleProp<ViewStyle>;
};

export type { MusicCoverProps };
