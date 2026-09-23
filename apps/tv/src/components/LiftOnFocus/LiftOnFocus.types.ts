import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type LiftOnFocusProps = {
  scale: number;
  shadowHeight: number;
  cornerRadius: number;
  isAnchoredLeft: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export type { LiftOnFocusProps };
