import type { Ref } from 'react';
import type { View } from 'react-native';
import type { Heard } from '@ValenceClient/books/heardLast';

type NowPlayingChipProps = {
  onOpen: (heard: Heard) => void;
  ref?: Ref<View> | undefined;
};

export type { NowPlayingChipProps };
