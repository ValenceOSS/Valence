import type { Animated } from 'react-native';
import type { ALight } from '@ValencePhone/components/AMoodBackground/AMoodBackground.types';

type APaletteLayerProps = {
  palette: readonly ALight[];
  drifts: readonly Animated.Value[];
  driftsBy: number;
  isLeaving: boolean;
};

export type { APaletteLayerProps };
