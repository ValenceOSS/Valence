import type { Ref } from 'react';
import type { View } from 'react-native';

type NowPlayingChipProps = {
  onOpen: () => void;
  ref?: Ref<View> | undefined;
};

export type { NowPlayingChipProps };
