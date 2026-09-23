import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type GlassProps = {
  cornerRadius: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export type { GlassProps };
