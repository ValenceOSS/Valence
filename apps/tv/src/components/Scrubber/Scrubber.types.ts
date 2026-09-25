import type { Ref } from 'react';
import type { View } from 'react-native';

type ScrubberProps = {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
  onFocus?: () => void;
  ref?: Ref<View> | undefined;
};

export type { ScrubberProps };
