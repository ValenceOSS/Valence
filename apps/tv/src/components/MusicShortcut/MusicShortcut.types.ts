import type { Ref } from 'react';
import type { View } from 'react-native';
import type { MusicItem } from '@ValenceTv/music/MusicItem';

type MusicShortcutProps = {
  item: MusicItem;
  width: number;
  onPress: (item: MusicItem) => void;
  onFocus?: (item: MusicItem) => void;
  ref?: Ref<View> | undefined;
  hasPreferredFocus?: boolean;
};

export type { MusicShortcutProps };
