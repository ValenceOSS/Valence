import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type FadeEdge = 'left' | 'right' | 'top' | 'bottom';

type EdgeFadeProps = {
  edge: FadeEdge;
  reach: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export type { EdgeFadeProps, FadeEdge };
